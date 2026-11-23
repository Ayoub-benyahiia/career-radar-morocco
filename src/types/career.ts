export type ExperienceLevel = 'stage_pfe' | 'junior';

export type ContractType = 'Stage' | 'Alternance' | 'CDI' | 'CDD / Freelance';

export type WorkMode = 'all' | 'onsite' | 'hybrid_remote';

export type OfferWorkMode = 'onsite' | 'hybrid' | 'remote';

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'no_response';

export interface Skill {
  id: number;
  name: string;
  domaine: string;
}

export interface City {
  id: number;
  name: string;
  region: string;
  offer_count: number;
}

export interface OfferLite {
  id: number;
  title_id: number;
  city_id: number;
  contract: ContractType;
  level: ExperienceLevel;
  work_mode: OfferWorkMode;
  skill_ids: number[];
}

export interface JobTitle {
  id: number;
  title: string;
  domaine: string;
  core_skill_ids: number[];
  offer_count: number;
}

export interface SkillPairingEntry {
  skill_id: number;
  pct: number;
  co_count: number;
}

export type SkillPairingsMap = Record<string, SkillPairingEntry[]>;

export interface MarketAggregates {
  by_city: Record<string, number>;
  by_contract: Record<string, number>;
  by_level: Record<string, number>;
  by_work_mode: Record<string, number>;
  top_skills: Array<{ skill_id: number; count: number; pct: number }>;
}

export interface MarketMeta {
  total_analyzed_offers: number;
  eligible_offers: number;
  min_skills_threshold: number;
  total_skills: number;
  total_cities: number;
  period: string;
  generated_at: string;
  source_note: string;
}

export interface MarketDataset {
  skills: Skill[];
  cities: City[];
  offers: OfferLite[];
  titles: JobTitle[];
  pairings: SkillPairingsMap;
  aggregates: MarketAggregates;
  meta: MarketMeta;
}

export interface UserProfile {
  cityId: number;
  experienceLevel: ExperienceLevel;
  workMode: WorkMode;
  contractType: ContractType[];
  skillIds: number[];
  onboardingCompleted: boolean;
  lastBackupDate?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  url: string;
  date: string; // ISO YYYY-MM-DD
  status: ApplicationStatus;
  notes?: string;
  hrContact?: string;
}

export interface MarketCoverageResult {
  score: number; // integer 0..100 rounded
  exactPct: number; // float 0..100
  matchingOffersCount: number;
  eligibleOffersCount: number;
}

export interface SkillROIResult {
  skillId: number;
  skillName: string;
  domaine: string;
  additionalOffers: number;
  gainPoints: number; // exact percentage points gain (+X.X pts)
  projectedScore: number;
}

export interface MatchedJobRole {
  titleId: number;
  title: string;
  domaine: string;
  matchPct: number; // 0..100 integer
  matchingOfferCount: number;
  totalRoleOffers: number;
  contracts: ContractType[];
  workModes: OfferWorkMode[];
  cityNames: string[];
  requiredSkillIds: number[];
  ownedSkillIds: number[];
  missingSkillIds: number[];
}

export interface MilestoneTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface SkillLearningResource {
  skillId?: number;
  skillName: string;
  domaine?: string;
  w3schoolsUrl?: string;
  geeksForGeeksUrl?: string;
  officialDocsUrl?: string;
  youtubeQuery: string;
  youtubeUrl: string;
}

export interface CareerPlanMilestone {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  skillIds: number[];
  tasks: MilestoneTask[];
  recommendedProject?: string;
}

export interface ProjectReadinessStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  techStack: string[];
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  targetSkillNames: string[];
  repoUrl?: string;
  liveDemoUrl?: string;
  steps: ProjectReadinessStep[];
  moroccanMarketContext: string;
  deliverables: string[];
  updatedAt?: string;
}

export interface CareerPlanConfig {
  targetTitleId: number;
  weeklyHours: number; // e.g. 5, 10, 15, 20
  durationWeeks: number; // 4, 6, or 8
  apiKey?: string; // BYOK
}

export interface CareerPlan {
  id: string;
  targetTitleId: number;
  targetRoleTitle: string;
  targetDomaine: string;
  currentScore: number;
  projectedScore: number;
  scoreGainPoints: number;
  weeklyHours: number;
  durationWeeks: number;
  mode: 'gemini_ai' | 'offline_deterministic';
  generatedAt: string;
  adaptedAt?: string;
  adaptationNote?: string;
  strategicAdvice: string;
  localMarketNote: string;
  interviewTips: string[];
  portfolioProject: {
    title: string;
    description: string;
    techStack: string[];
  };
  milestones: CareerPlanMilestone[];
}

export interface InterviewQuestionItem {
  id: string;
  category: 'technique' | 'culture_rh' | 'question_au_recruteur';
  question: string;
  keyPointsToCover: string[];
  sampleAnswerHint?: string;
}

export interface InterviewPrepGuide {
  roleTitle: string;
  company: string;
  detectedSkills: string[];
  questions: InterviewQuestionItem[];
  checklistDayJ: string[];
  generatedAt: string;
  mode: 'offline_deterministic' | 'gemini_ai';
}

export type AppRoute =
  | 'onboarding'
  | 'setup'
  | 'dashboard'
  | 'skill-gap'
  | 'career-planner'
  | 'tracker'
  | 'profile';

