import type { CareerPlan, JobApplication, PortfolioProjectItem, UserProfile } from '../types/career';

const DB_NAME = 'CareerRadarDB';
const DB_VERSION = 3;
const STORE_PROFILE = 'profile';
const STORE_APPLICATIONS = 'applications';
const STORE_CAREER_PLAN = 'career_plan';
const STORE_PORTFOLIO_PROJECTS = 'portfolio_projects';

const LS_PROFILE_KEY = 'career_radar_profile_v1';
const LS_APPS_KEY = 'career_radar_applications_v1';
const LS_CAREER_PLAN_KEY = 'career_radar_plan_v1';
const LS_PORTFOLIO_PROJECTS_KEY = 'career_radar_portfolio_v1';

export const DEFAULT_AGADIR_CITY_ID = 3;

export const DEFAULT_USER_PROFILE: UserProfile = {
  cityId: DEFAULT_AGADIR_CITY_ID,
  experienceLevel: 'stage_pfe',
  workMode: 'all',
  contractType: ['Stage'],
  skillIds: [],
  onboardingCompleted: false,
};

export interface StorageHealth {
  engine: 'indexeddb' | 'localstorage';
  persisted: boolean;
}

class CareerRadarStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private usingFallback = false;

  private openDB(): Promise<IDBDatabase | null> {
    if (this.usingFallback) {
      return Promise.resolve(null);
    }
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      this.usingFallback = true;
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_PROFILE)) {
              db.createObjectStore(STORE_PROFILE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORE_APPLICATIONS)) {
              db.createObjectStore(STORE_APPLICATIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_CAREER_PLAN)) {
              db.createObjectStore(STORE_CAREER_PLAN, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORE_PORTFOLIO_PROJECTS)) {
              db.createObjectStore(STORE_PORTFOLIO_PROJECTS, { keyPath: 'id' });
            }
          };

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            this.usingFallback = true;
            resolve(null);
          };
          request.onblocked = () => {
            this.usingFallback = true;
            resolve(null);
          };
        } catch {
          this.usingFallback = true;
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  async initPersistence(): Promise<StorageHealth> {
    let persisted = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        persisted = await navigator.storage.persist();
      } else if (typeof navigator !== 'undefined' && navigator.storage?.persisted) {
        persisted = await navigator.storage.persisted();
      }
    } catch {
      persisted = false;
    }

    const db = await this.openDB();
    return {
      engine: db ? 'indexeddb' : 'localstorage',
      persisted,
    };
  }

  async getProfile(): Promise<UserProfile> {
    const db = await this.openDB();
    if (db) {
      try {
        const result = await new Promise<UserProfile | null>((resolve, reject) => {
          const tx = db.transaction(STORE_PROFILE, 'readonly');
          const store = tx.objectStore(STORE_PROFILE);
          const req = store.get('userProfile');
          req.onsuccess = () => resolve(req.result?.value ?? null);
          req.onerror = () => reject(req.error);
        });
        if (result) {
          return { ...DEFAULT_USER_PROFILE, ...result };
        }
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      const raw = window.localStorage.getItem(LS_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        return { ...DEFAULT_USER_PROFILE, ...parsed };
      }
    } catch {
      // ignore storage errors
    }

    return { ...DEFAULT_USER_PROFILE };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const sanitized: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      ...profile,
      skillIds: Array.from(new Set(profile.skillIds)),
    };

    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_PROFILE, 'readwrite');
          tx.objectStore(STORE_PROFILE).put({ key: 'userProfile', value: sanitized });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      window.localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore quota errors
    }
  }

  async getApplications(): Promise<JobApplication[]> {
    const db = await this.openDB();
    if (db) {
      try {
        const rows = await new Promise<JobApplication[]>((resolve, reject) => {
          const tx = db.transaction(STORE_APPLICATIONS, 'readonly');
          const req = tx.objectStore(STORE_APPLICATIONS).getAll();
          req.onsuccess = () => resolve((req.result as JobApplication[]) ?? []);
          req.onerror = () => reject(req.error);
        });
        return rows.sort((a, b) => b.date.localeCompare(a.date));
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      const raw = window.localStorage.getItem(LS_APPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as JobApplication[];
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => b.date.localeCompare(a.date));
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  async saveApplications(applications: JobApplication[]): Promise<void> {
    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_APPLICATIONS, 'readwrite');
          const store = tx.objectStore(STORE_APPLICATIONS);
          store.clear();
          for (const app of applications) {
            store.put(app);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      window.localStorage.setItem(LS_APPS_KEY, JSON.stringify(applications));
    } catch {
      // ignore
    }
  }

  async upsertApplication(application: JobApplication): Promise<JobApplication[]> {
    const current = await this.getApplications();
    const index = current.findIndex((item) => item.id === application.id);
    const updated =
      index >= 0
        ? current.map((item) => (item.id === application.id ? application : item))
        : [application, ...current];
    updated.sort((a, b) => b.date.localeCompare(a.date));
    await this.saveApplications(updated);
    return updated;
  }

  async deleteApplication(id: string): Promise<JobApplication[]> {
    const current = await this.getApplications();
    const updated = current.filter((item) => item.id !== id);
    await this.saveApplications(updated);
    return updated;
  }

  async getCareerPlan(): Promise<CareerPlan | null> {
    const db = await this.openDB();
    if (db) {
      try {
        const result = await new Promise<CareerPlan | null>((resolve, reject) => {
          const tx = db.transaction(STORE_CAREER_PLAN, 'readonly');
          const store = tx.objectStore(STORE_CAREER_PLAN);
          const req = store.get('activePlan');
          req.onsuccess = () => resolve(req.result?.value ?? null);
          req.onerror = () => reject(req.error);
        });
        if (result) return result;
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      const raw = window.localStorage.getItem(LS_CAREER_PLAN_KEY);
      if (raw) {
        return JSON.parse(raw) as CareerPlan;
      }
    } catch {
      // ignore
    }

    return null;
  }

  async saveCareerPlan(plan: CareerPlan): Promise<void> {
    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_CAREER_PLAN, 'readwrite');
          tx.objectStore(STORE_CAREER_PLAN).put({ key: 'activePlan', value: plan });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      window.localStorage.setItem(LS_CAREER_PLAN_KEY, JSON.stringify(plan));
    } catch {
      // ignore
    }
  }

  async toggleMilestoneTask(milestoneId: string, taskId: string): Promise<CareerPlan | null> {
    const plan = await this.getCareerPlan();
    if (!plan) return null;

    let modified = false;
    const updatedMilestones = plan.milestones.map((milestone) => {
      if (milestone.id !== milestoneId) return milestone;
      const updatedTasks = milestone.tasks.map((task) => {
        if (task.id !== taskId) return task;
        modified = true;
        return { ...task, completed: !task.completed };
      });
      return { ...milestone, tasks: updatedTasks };
    });

    if (!modified) return plan;

    const updatedPlan: CareerPlan = { ...plan, milestones: updatedMilestones };
    await this.saveCareerPlan(updatedPlan);
    return updatedPlan;
  }

  async clearCareerPlan(): Promise<void> {
    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_CAREER_PLAN, 'readwrite');
          tx.objectStore(STORE_CAREER_PLAN).delete('activePlan');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // ignore
      }
    }

    try {
      window.localStorage.removeItem(LS_CAREER_PLAN_KEY);
    } catch {
      // ignore
    }
  }

  async getPortfolioProjects(): Promise<PortfolioProjectItem[]> {
    const db = await this.openDB();
    if (db) {
      try {
        const rows = await new Promise<PortfolioProjectItem[]>((resolve, reject) => {
          const tx = db.transaction(STORE_PORTFOLIO_PROJECTS, 'readonly');
          const store = tx.objectStore(STORE_PORTFOLIO_PROJECTS);
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result as PortfolioProjectItem[]) ?? []);
          req.onerror = () => reject(req.error);
        });
        if (rows && rows.length > 0) return rows;
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      const raw = window.localStorage.getItem(LS_PORTFOLIO_PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as PortfolioProjectItem[];
      }
    } catch {
      // ignore
    }

    return [];
  }

  async savePortfolioProjects(projects: PortfolioProjectItem[]): Promise<void> {
    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_PORTFOLIO_PROJECTS, 'readwrite');
          const store = tx.objectStore(STORE_PORTFOLIO_PROJECTS);
          store.clear();
          for (const item of projects) {
            store.put(item);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        this.usingFallback = true;
      }
    }

    try {
      window.localStorage.setItem(LS_PORTFOLIO_PROJECTS_KEY, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }

  async upsertPortfolioProject(project: PortfolioProjectItem): Promise<PortfolioProjectItem[]> {
    const current = await this.getPortfolioProjects();
    const idx = current.findIndex((p) => p.id === project.id);
    const updated =
      idx >= 0
        ? current.map((p) => (p.id === project.id ? { ...p, ...project, updatedAt: new Date().toISOString() } : p))
        : [{ ...project, updatedAt: new Date().toISOString() }, ...current];
    await this.savePortfolioProjects(updated);
    return updated;
  }

  async toggleProjectStep(projectId: string, stepId: string): Promise<PortfolioProjectItem | null> {
    const projects = await this.getPortfolioProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    let modified = false;
    const updatedSteps = project.steps.map((step) => {
      if (step.id !== stepId) return step;
      modified = true;
      return { ...step, completed: !step.completed };
    });

    if (!modified) return project;

    const updatedProject: PortfolioProjectItem = {
      ...project,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = projects.map((p) => (p.id === projectId ? updatedProject : p));
    await this.savePortfolioProjects(updatedList);
    return updatedProject;
  }

  async updateProjectLinks(
    projectId: string,
    repoUrl?: string,
    liveDemoUrl?: string
  ): Promise<PortfolioProjectItem | null> {
    const projects = await this.getPortfolioProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const updatedProject: PortfolioProjectItem = {
      ...project,
      repoUrl: repoUrl !== undefined ? repoUrl.trim() : project.repoUrl,
      liveDemoUrl: liveDemoUrl !== undefined ? liveDemoUrl.trim() : project.liveDemoUrl,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = projects.map((p) => (p.id === projectId ? updatedProject : p));
    await this.savePortfolioProjects(updatedList);
    return updatedProject;
  }

  async clearAllData(): Promise<void> {
    const db = await this.openDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(
            [STORE_PROFILE, STORE_APPLICATIONS, STORE_CAREER_PLAN, STORE_PORTFOLIO_PROJECTS],
            'readwrite'
          );
          tx.objectStore(STORE_PROFILE).clear();
          tx.objectStore(STORE_APPLICATIONS).clear();
          tx.objectStore(STORE_CAREER_PLAN).clear();
          tx.objectStore(STORE_PORTFOLIO_PROJECTS).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // ignore
      }
    }

    try {
      window.localStorage.removeItem(LS_PROFILE_KEY);
      window.localStorage.removeItem(LS_APPS_KEY);
      window.localStorage.removeItem(LS_CAREER_PLAN_KEY);
      window.localStorage.removeItem(LS_PORTFOLIO_PROJECTS_KEY);
    } catch {
      // ignore
    }
  }

  private inMemoryTheme: 'light' | 'dark' = 'light';

  getTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return this.inMemoryTheme;
    try {
      const stored = window.localStorage.getItem('career_radar_theme_v1');
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return this.inMemoryTheme;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.inMemoryTheme = theme;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('career_radar_theme_v1', theme);
    } catch {
      // ignore
    }
  }
}

export const storage = new CareerRadarStorage();

export interface CareerRadarBackupPayload {
  version: number;
  exportedAt: string;
  userProfile: UserProfile;
  applications: JobApplication[];
  careerPlan?: CareerPlan | null;
  portfolioProjects?: PortfolioProjectItem[];
}

export function validateBackupPayload(raw: unknown): CareerRadarBackupPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!obj.userProfile || typeof obj.userProfile !== 'object') return null;
  if (!Array.isArray(obj.applications)) return null;

  const prof = obj.userProfile as Partial<UserProfile>;
  const userProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    cityId: typeof prof.cityId === 'number' ? prof.cityId : DEFAULT_AGADIR_CITY_ID,
    experienceLevel: prof.experienceLevel === 'junior' ? 'junior' : 'stage_pfe',
    workMode:
      prof.workMode === 'onsite' || prof.workMode === 'hybrid_remote' ? prof.workMode : 'all',
    contractType: Array.isArray(prof.contractType) && prof.contractType.length > 0
      ? prof.contractType
      : ['Stage'],
    skillIds: Array.isArray(prof.skillIds)
      ? prof.skillIds.filter((id): id is number => typeof id === 'number')
      : [],
    onboardingCompleted: Boolean(prof.onboardingCompleted),
    lastBackupDate: typeof prof.lastBackupDate === 'string' ? prof.lastBackupDate : undefined,
  };

  const validStatuses = new Set([
    'saved',
    'applied',
    'interview',
    'offer',
    'rejected',
    'no_response',
  ]);

  const applications: JobApplication[] = obj.applications
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `imp-${Date.now()}-${idx}`,
      company: typeof item.company === 'string' ? item.company.trim() : 'Entreprise',
      role: typeof item.role === 'string' ? item.role.trim() : 'Poste IT',
      url: typeof item.url === 'string' ? item.url.trim() : '',
      date:
        typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
          ? item.date
          : new Date().toISOString().slice(0, 10),
      status: validStatuses.has(String(item.status))
        ? (item.status as JobApplication['status'])
        : 'saved',
      notes: typeof item.notes === 'string' ? item.notes : undefined,
      hrContact: typeof item.hrContact === 'string' ? item.hrContact : undefined,
    }));

  return {
    version: typeof obj.version === 'number' ? obj.version : 3,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    userProfile,
    applications,
    careerPlan: obj.careerPlan && typeof obj.careerPlan === 'object' ? (obj.careerPlan as CareerPlan) : undefined,
    portfolioProjects: Array.isArray(obj.portfolioProjects) ? (obj.portfolioProjects as PortfolioProjectItem[]) : undefined,
  };
}
