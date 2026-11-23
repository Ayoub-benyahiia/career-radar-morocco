import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Deterministic Mulberry32 PRNG for reproducible Moroccan IT dataset
function createRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20261122);

function pickWeighted<T>(items: Array<{ value: T; weight: number }>): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// 1. EXACTLY 121 IT SKILLS grouped by French domaine
const SKILLS_BY_DOMAIN: Record<string, string[]> = {
  Frontend: [
    'React',
    'TypeScript',
    'JavaScript',
    'Angular',
    'Vue.js',
    'Next.js',
    'Tailwind CSS',
    'HTML5',
    'CSS3',
    'Sass/SCSS',
    'Redux',
    'Bootstrap',
    'Svelte',
    'GraphQL',
    'Webpack',
    'Vite',
    'Material UI',
    'WebSockets',
    'Three.js',
    'Jest',
  ],
  Backend: [
    'Node.js',
    'Express',
    'Java',
    'Spring Boot',
    'Python',
    'Django',
    'FastAPI',
    'PHP',
    'Laravel',
    'Symfony',
    'C#',
    '.NET',
    'ASP.NET Core',
    'Go',
    'Rust',
    'Ruby on Rails',
    'NestJS',
    'REST API',
    'Microservices',
    'Hibernate/JPA',
    'GraphQL API',
    'Maven',
    'Gradle',
    'RabbitMQ',
    'Kafka',
  ],
  'Base de données': [
    'SQL',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'SQL Server',
    'Oracle DB',
    'Redis',
    'Elasticsearch',
    'Firebase',
    'Supabase',
    'SQLite',
    'Prisma',
    'PL/SQL',
  ],
  'DevOps & Cloud': [
    'Git',
    'Docker',
    'Kubernetes',
    'Linux',
    'CI/CD',
    'GitHub Actions',
    'GitLab CI',
    'Jenkins',
    'AWS',
    'Azure',
    'Google Cloud',
    'Terraform',
    'Ansible',
    'Nginx',
    'Bash/Shell',
    'Prometheus',
    'Grafana',
    'SonarQube',
    'ArgoCD',
  ],
  'Data & IA': [
    'Pandas',
    'NumPy',
    'Scikit-learn',
    'TensorFlow',
    'PyTorch',
    'Power BI',
    'Tableau',
    'Excel',
    'Apache Spark',
    'Airflow',
    'ETL',
    'SQL Analytics',
    'R',
    'Machine Learning',
    'NLP',
    'LangChain',
    'OpenCV',
    'dbt',
    'Snowflake',
    'Talend',
  ],
  Mobile: [
    'Flutter',
    'React Native',
    'Dart',
    'Kotlin',
    'Swift',
    'Android SDK',
    'iOS SDK',
    'Ionic',
  ],
  'Qualité & Outils': [
    'Postman',
    'Jira',
    'Agile/Scrum',
    'Figma',
    'Cypress',
    'Selenium',
    'Playwright',
    'JUnit',
    'Pytest',
    'Swagger/OpenAPI',
    'OAuth2/JWT',
    'Cybersécurité',
    'OWASP',
    'UML',
    'SAP',
    'Odoo',
  ],
};

interface SkillDef {
  id: number;
  name: string;
  domaine: string;
}

const skills: SkillDef[] = [];
const skillNameToId = new Map<string, number>();
let nextSkillId = 1;
for (const [domaine, names] of Object.entries(SKILLS_BY_DOMAIN)) {
  for (const name of names) {
    skills.push({ id: nextSkillId, name, domaine });
    skillNameToId.set(name, nextSkillId);
    nextSkillId++;
  }
}

if (skills.length !== 121) {
  throw new Error(`Expected 121 skills, got ${skills.length}`);
}

const sid = (name: string): number => {
  const id = skillNameToId.get(name);
  if (!id) throw new Error(`Unknown skill: ${name}`);
  return id;
};

// 2. EXACTLY 27 MOROCCAN CITIES (realistic IT distribution, Agadir well-represented)
const CITIES_RAW: Array<{ name: string; region: string; weight: number }> = [
  { name: 'Casablanca', region: 'Casablanca-Settat', weight: 41.0 },
  { name: 'Rabat', region: 'Rabat-Salé-Kénitra', weight: 21.5 },
  { name: 'Agadir', region: 'Souss-Massa', weight: 6.2 },
  { name: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma', weight: 6.4 },
  { name: 'Marrakech', region: 'Marrakech-Safi', weight: 5.5 },
  { name: 'Fès', region: 'Fès-Meknès', weight: 3.4 },
  { name: 'Oujda', region: 'Oriental', weight: 2.2 },
  { name: 'Kénitra', region: 'Rabat-Salé-Kénitra', weight: 2.1 },
  { name: 'Tétouan', region: 'Tanger-Tétouan-Al Hoceïma', weight: 1.8 },
  { name: 'Salé', region: 'Rabat-Salé-Kénitra', weight: 1.7 },
  { name: 'Meknès', region: 'Fès-Meknès', weight: 1.6 },
  { name: 'Mohammedia', region: 'Casablanca-Settat', weight: 1.4 },
  { name: 'El Jadida', region: 'Casablanca-Settat', weight: 0.9 },
  { name: 'Settat', region: 'Casablanca-Settat', weight: 0.7 },
  { name: 'Safi', region: 'Marrakech-Safi', weight: 0.6 },
  { name: 'Béni Mellal', region: 'Béni Mellal-Khénifra', weight: 0.55 },
  { name: 'Nador', region: 'Oriental', weight: 0.45 },
  { name: 'Ifrane', region: 'Fès-Meknès', weight: 0.35 },
  { name: 'Khouribga', region: 'Béni Mellal-Khénifra', weight: 0.35 },
  { name: 'Laâyoune', region: 'Laâyoune-Sakia El Hamra', weight: 0.25 },
  { name: 'Essaouira', region: 'Marrakech-Safi', weight: 0.22 },
  { name: 'Ouarzazate', region: 'Drâa-Tafilalet', weight: 0.2 },
  { name: 'Taza', region: 'Fès-Meknès', weight: 0.18 },
  { name: 'Dakhla', region: 'Dakhla-Oued Ed-Dahab', weight: 0.15 },
  { name: 'Berkane', region: 'Oriental', weight: 0.12 },
  { name: 'Errachidia', region: 'Drâa-Tafilalet', weight: 0.1 },
  { name: 'Larache', region: 'Tanger-Tétouan-Al Hoceïma', weight: 0.08 },
];

if (CITIES_RAW.length !== 27) {
  throw new Error(`Expected 27 cities, got ${CITIES_RAW.length}`);
}

// 3. 26 MOROCCAN IT ROLE ARCHETYPES
interface RoleArchetype {
  id: number;
  title: string;
  domaine: string;
  weight: number;
  core: string[];
  secondary: string[];
  extra: string[];
  remoteBias: number;
}

const ROLE_ARCHETYPES: RoleArchetype[] = [
  {
    id: 1,
    title: 'Développeur Full Stack JS',
    domaine: 'Frontend',
    weight: 11.5,
    core: ['JavaScript', 'React', 'Node.js', 'Git'],
    secondary: ['TypeScript', 'Express', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'REST API', 'Docker'],
    extra: ['Next.js', 'Redux', 'Jest', 'CI/CD', 'Postman', 'Agile/Scrum'],
    remoteBias: 0.55,
  },
  {
    id: 2,
    title: 'Développeur Java / Spring Boot',
    domaine: 'Backend',
    weight: 12.2,
    core: ['Java', 'Spring Boot', 'SQL', 'Git'],
    secondary: ['REST API', 'Hibernate/JPA', 'PostgreSQL', 'Docker', 'Microservices', 'Maven', 'Angular'],
    extra: ['JUnit', 'Oracle DB', 'Kafka', 'Jenkins', 'CI/CD', 'Agile/Scrum', 'Swagger/OpenAPI'],
    remoteBias: 0.4,
  },
  {
    id: 3,
    title: 'Développeur Frontend React',
    domaine: 'Frontend',
    weight: 8.4,
    core: ['React', 'JavaScript', 'HTML5', 'CSS3'],
    secondary: ['TypeScript', 'Tailwind CSS', 'Git', 'Redux', 'REST API', 'Next.js', 'Vite'],
    extra: ['Figma', 'Jest', 'Material UI', 'Sass/SCSS', 'GraphQL', 'Cypress'],
    remoteBias: 0.6,
  },
  {
    id: 4,
    title: 'Développeur Angular / Java',
    domaine: 'Frontend',
    weight: 7.4,
    core: ['Angular', 'TypeScript', 'Java', 'Spring Boot'],
    secondary: ['SQL', 'Git', 'REST API', 'HTML5', 'CSS3', 'Docker', 'PostgreSQL'],
    extra: ['RxJS', 'Bootstrap', 'Maven', 'GitLab CI', 'Agile/Scrum', 'SonarQube'].filter((s) =>
      skillNameToId.has(s)
    ),
    remoteBias: 0.42,
  },
  {
    id: 5,
    title: 'Développeur .NET / C#',
    domaine: 'Backend',
    weight: 7.0,
    core: ['C#', '.NET', 'SQL Server', 'Git'],
    secondary: ['ASP.NET Core', 'REST API', 'Azure', 'SQL', 'Angular', 'Docker'],
    extra: ['JavaScript', 'TypeScript', 'Microservices', 'CI/CD', 'Agile/Scrum', 'Swagger/OpenAPI'],
    remoteBias: 0.38,
  },
  {
    id: 6,
    title: 'Développeur PHP / Laravel',
    domaine: 'Backend',
    weight: 6.8,
    core: ['PHP', 'Laravel', 'MySQL', 'Git'],
    secondary: ['JavaScript', 'HTML5', 'CSS3', 'REST API', 'Vue.js', 'SQL', 'Bootstrap'],
    extra: ['Docker', 'Tailwind CSS', 'Redis', 'Linux', 'Postman', 'Agile/Scrum'],
    remoteBias: 0.45,
  },
  {
    id: 7,
    title: 'Data Analyst',
    domaine: 'Data & IA',
    weight: 6.4,
    core: ['SQL', 'Python', 'Power BI', 'Excel'],
    secondary: ['Pandas', 'SQL Analytics', 'Tableau', 'ETL', 'PostgreSQL', 'Git'],
    extra: ['NumPy', 'R', 'MySQL', 'Airflow', 'dbt', 'Agile/Scrum'],
    remoteBias: 0.48,
  },
  {
    id: 8,
    title: 'Développeur Backend Node.js',
    domaine: 'Backend',
    weight: 5.2,
    core: ['Node.js', 'JavaScript', 'REST API', 'Git'],
    secondary: ['TypeScript', 'Express', 'NestJS', 'MongoDB', 'PostgreSQL', 'Docker', 'SQL'],
    extra: ['Redis', 'Prisma', 'OAuth2/JWT', 'Jest', 'AWS', 'Swagger/OpenAPI'],
    remoteBias: 0.62,
  },
  {
    id: 9,
    title: 'Ingénieur DevOps Junior',
    domaine: 'DevOps & Cloud',
    weight: 5.0,
    core: ['Docker', 'Linux', 'Git', 'CI/CD'],
    secondary: ['Kubernetes', 'AWS', 'Bash/Shell', 'GitLab CI', 'Terraform', 'Nginx', 'Python'],
    extra: ['Azure', 'Jenkins', 'Ansible', 'Prometheus', 'Grafana', 'GitHub Actions', 'ArgoCD'],
    remoteBias: 0.58,
  },
  {
    id: 10,
    title: 'Développeur Mobile Flutter',
    domaine: 'Mobile',
    weight: 4.5,
    core: ['Flutter', 'Dart', 'Git', 'REST API'],
    secondary: ['Firebase', 'Android SDK', 'iOS SDK', 'Figma', 'SQLite'],
    extra: ['OAuth2/JWT', 'Postman', 'Agile/Scrum', 'CI/CD', 'Node.js'],
    remoteBias: 0.56,
  },
  {
    id: 11,
    title: 'Data Engineer',
    domaine: 'Data & IA',
    weight: 4.2,
    core: ['Python', 'SQL', 'ETL', 'Git'],
    secondary: ['Apache Spark', 'Airflow', 'PostgreSQL', 'Docker', 'AWS', 'dbt', 'Kafka'],
    extra: ['Snowflake', 'Azure', 'Linux', 'Pandas', 'Talend', 'Google Cloud'],
    remoteBias: 0.52,
  },
  {
    id: 12,
    title: 'Data Scientist / IA Junior',
    domaine: 'Data & IA',
    weight: 3.8,
    core: ['Python', 'Machine Learning', 'Pandas', 'SQL'],
    secondary: ['Scikit-learn', 'NumPy', 'PyTorch', 'TensorFlow', 'Git', 'NLP'],
    extra: ['Docker', 'FastAPI', 'LangChain', 'OpenCV', 'Power BI', 'Linux'],
    remoteBias: 0.54,
  },
  {
    id: 13,
    title: 'Développeur Symfony / PHP',
    domaine: 'Backend',
    weight: 3.4,
    core: ['PHP', 'Symfony', 'SQL', 'Git'],
    secondary: ['MySQL', 'PostgreSQL', 'Docker', 'REST API', 'JavaScript', 'HTML5'],
    extra: ['React', 'Vue.js', 'Redis', 'RabbitMQ', 'Linux', 'Agile/Scrum'],
    remoteBias: 0.44,
  },
  {
    id: 14,
    title: 'Développeur Python / Django',
    domaine: 'Backend',
    weight: 3.3,
    core: ['Python', 'Django', 'SQL', 'Git'],
    secondary: ['PostgreSQL', 'REST API', 'Docker', 'FastAPI', 'Linux', 'HTML5'],
    extra: ['React', 'Redis', 'Pytest', 'CI/CD', 'AWS', 'Swagger/OpenAPI'],
    remoteBias: 0.55,
  },
  {
    id: 15,
    title: 'Ingénieur QA & Automatisation',
    domaine: 'Qualité & Outils',
    weight: 3.0,
    core: ['Jira', 'Agile/Scrum', 'Postman', 'SQL'],
    secondary: ['Selenium', 'Cypress', 'Playwright', 'Git', 'JavaScript', 'Python', 'Java'],
    extra: ['CI/CD', 'REST API', 'JUnit', 'Pytest', 'GitLab CI'],
    remoteBias: 0.42,
  },
  {
    id: 16,
    title: 'Développeur Mobile React Native',
    domaine: 'Mobile',
    weight: 2.8,
    core: ['React Native', 'JavaScript', 'React', 'Git'],
    secondary: ['TypeScript', 'REST API', 'Firebase', 'Redux', 'Android SDK', 'iOS SDK'],
    extra: ['Node.js', 'Figma', 'Jest', 'Postman', 'Agile/Scrum'],
    remoteBias: 0.62,
  },
  {
    id: 17,
    title: 'Développeur Next.js / TypeScript',
    domaine: 'Frontend',
    weight: 2.6,
    core: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    secondary: ['JavaScript', 'Git', 'PostgreSQL', 'Prisma', 'REST API', 'Node.js'],
    extra: ['Supabase', 'Docker', 'GraphQL', 'GitHub Actions', 'Figma'],
    remoteBias: 0.68,
  },
  {
    id: 18,
    title: 'Consultant Odoo / ERP',
    domaine: 'Qualité & Outils',
    weight: 2.5,
    core: ['Odoo', 'Python', 'PostgreSQL', 'Git'],
    secondary: ['SQL', 'Linux', 'JavaScript', 'HTML5', 'REST API', 'UML'],
    extra: ['Docker', 'Agile/Scrum', 'Excel', 'Jira'],
    remoteBias: 0.3,
  },
  {
    id: 19,
    title: 'Analyste BI & Reporting',
    domaine: 'Data & IA',
    weight: 2.4,
    core: ['Power BI', 'SQL', 'Excel', 'ETL'],
    secondary: ['SQL Server', 'Talend', 'Tableau', 'Python', 'Oracle DB', 'SQL Analytics'],
    extra: ['PL/SQL', 'PostgreSQL', 'Jira', 'Agile/Scrum'],
    remoteBias: 0.36,
  },
  {
    id: 20,
    title: 'Ingénieur Cloud AWS / Azure',
    domaine: 'DevOps & Cloud',
    weight: 2.2,
    core: ['AWS', 'Docker', 'Linux', 'Git'],
    secondary: ['Azure', 'Terraform', 'Kubernetes', 'CI/CD', 'Python', 'Bash/Shell'],
    extra: ['Google Cloud', 'Ansible', 'Prometheus', 'Grafana', 'Nginx'],
    remoteBias: 0.56,
  },
  {
    id: 21,
    title: 'Développeur Frontend Vue.js',
    domaine: 'Frontend',
    weight: 2.0,
    core: ['Vue.js', 'JavaScript', 'HTML5', 'CSS3'],
    secondary: ['TypeScript', 'Tailwind CSS', 'Git', 'REST API', 'Laravel', 'Sass/SCSS'],
    extra: ['Vite', 'Figma', 'Node.js', 'Docker', 'Jest'],
    remoteBias: 0.55,
  },
  {
    id: 22,
    title: 'Ingénieur Cybersécurité Junior',
    domaine: 'Qualité & Outils',
    weight: 1.8,
    core: ['Cybersécurité', 'Linux', 'OWASP', 'Python'],
    secondary: ['Bash/Shell', 'Docker', 'AWS', 'Git', 'OAuth2/JWT', 'SQL'],
    extra: ['Nginx', 'Kubernetes', 'Azure', 'CI/CD'],
    remoteBias: 0.35,
  },
  {
    id: 23,
    title: 'Développeur Android Kotlin',
    domaine: 'Mobile',
    weight: 1.6,
    core: ['Kotlin', 'Android SDK', 'Git', 'REST API'],
    secondary: ['Java', 'Firebase', 'SQLite', 'Gradle', 'Figma'],
    extra: ['OAuth2/JWT', 'Agile/Scrum', 'CI/CD', 'Postman'],
    remoteBias: 0.45,
  },
  {
    id: 24,
    title: 'Consultant Technique SAP',
    domaine: 'Qualité & Outils',
    weight: 1.4,
    core: ['SAP', 'SQL', 'Excel', 'Agile/Scrum'],
    secondary: ['Oracle DB', 'Java', 'REST API', 'Jira', 'UML', 'ETL'],
    extra: ['Python', 'Power BI', 'Linux'],
    remoteBias: 0.25,
  },
  {
    id: 25,
    title: 'Développeur Backend Go / Microservices',
    domaine: 'Backend',
    weight: 1.2,
    core: ['Go', 'Docker', 'SQL', 'Git'],
    secondary: ['Microservices', 'PostgreSQL', 'Kubernetes', 'REST API', 'Redis', 'Linux'],
    extra: ['Kafka', 'RabbitMQ', 'AWS', 'CI/CD', 'Prometheus'],
    remoteBias: 0.65,
  },
  {
    id: 26,
    title: 'Développeur Full Stack Python / React',
    domaine: 'Backend',
    weight: 2.3,
    core: ['Python', 'React', 'SQL', 'Git'],
    secondary: ['FastAPI', 'Django', 'TypeScript', 'PostgreSQL', 'Docker', 'REST API'],
    extra: ['Tailwind CSS', 'Linux', 'Redis', 'AWS', 'CI/CD'],
    remoteBias: 0.58,
  },
];

// Generate exactly 4,774 eligible offers (skill_ids.length >= 3)
const ELIGIBLE_OFFERS_COUNT = 4774;

type ContractType = 'Stage' | 'Alternance' | 'CDI' | 'CDD / Freelance';
type ExperienceLevel = 'stage_pfe' | 'junior';
type OfferWorkMode = 'onsite' | 'hybrid' | 'remote';

interface OfferLite {
  id: number;
  title_id: number;
  city_id: number;
  contract: ContractType;
  level: ExperienceLevel;
  work_mode: OfferWorkMode;
  skill_ids: number[];
}

const cityWeighted = CITIES_RAW.map((c, idx) => ({ value: idx + 1, weight: c.weight }));
const roleWeighted = ROLE_ARCHETYPES.map((r) => ({ value: r, weight: r.weight }));

const offers: OfferLite[] = [];
const cityCounts = new Map<number, number>();
const titleCounts = new Map<number, number>();
const contractCounts: Record<string, number> = {};
const levelCounts: Record<string, number> = {};
const workModeCounts: Record<string, number> = {};
const skillCounts = new Map<number, number>();
const coMatrix = new Map<number, Map<number, number>>();

for (let i = 1; i <= ELIGIBLE_OFFERS_COUNT; i++) {
  const role = pickWeighted(roleWeighted);
  const cityId = pickWeighted(cityWeighted);

  const contract: ContractType = pickWeighted([
    { value: 'CDI', weight: 48 },
    { value: 'Stage', weight: 31 },
    { value: 'CDD / Freelance', weight: 12 },
    { value: 'Alternance', weight: 9 },
  ]);

  const level: ExperienceLevel =
    contract === 'Stage' || contract === 'Alternance'
      ? rng() < 0.92
        ? 'stage_pfe'
        : 'junior'
      : rng() < 0.28
        ? 'stage_pfe'
        : 'junior';

  const rWork = rng();
  const work_mode: OfferWorkMode =
    rWork < role.remoteBias * 0.35
      ? 'remote'
      : rWork < role.remoteBias
        ? 'hybrid'
        : 'onsite';

  // Pick 3 to 7 distinct skills from core + secondary + extra
  const selected = new Set<number>();
  // Include 2 to 4 core skills
  const shuffledCore = [...role.core].sort(() => rng() - 0.5);
  const coreTake = Math.min(shuffledCore.length, rng() < 0.65 ? 3 : rng() < 0.85 ? 4 : 2);
  for (let k = 0; k < coreTake; k++) {
    selected.add(sid(shuffledCore[k]));
  }

  // Target total skill count between 3 and 7 (average ~4.8)
  const targetCount = pickWeighted([
    { value: 3, weight: 18 },
    { value: 4, weight: 28 },
    { value: 5, weight: 27 },
    { value: 6, weight: 18 },
    { value: 7, weight: 9 },
  ]);

  const shuffledSec = [...role.secondary].sort(() => rng() - 0.5);
  for (const s of shuffledSec) {
    if (selected.size >= targetCount) break;
    if (rng() < 0.72) selected.add(sid(s));
  }

  const shuffledExt = [...role.extra].sort(() => rng() - 0.5);
  for (const s of shuffledExt) {
    if (selected.size >= targetCount) break;
    if (rng() < 0.55) selected.add(sid(s));
  }

  // Guarantee minimum 3 skills
  for (const s of [...role.core, ...role.secondary]) {
    if (selected.size >= 3) break;
    selected.add(sid(s));
  }

  const skill_ids = Array.from(selected).sort((a, b) => a - b);

  offers.push({
    id: i,
    title_id: role.id,
    city_id: cityId,
    contract,
    level,
    work_mode,
    skill_ids,
  });

  cityCounts.set(cityId, (cityCounts.get(cityId) ?? 0) + 1);
  titleCounts.set(role.id, (titleCounts.get(role.id) ?? 0) + 1);
  contractCounts[contract] = (contractCounts[contract] ?? 0) + 1;
  levelCounts[level] = (levelCounts[level] ?? 0) + 1;
  workModeCounts[work_mode] = (workModeCounts[work_mode] ?? 0) + 1;

  for (let a = 0; a < skill_ids.length; a++) {
    const sa = skill_ids[a];
    skillCounts.set(sa, (skillCounts.get(sa) ?? 0) + 1);
    let inner = coMatrix.get(sa);
    if (!inner) {
      inner = new Map<number, number>();
      coMatrix.set(sa, inner);
    }
    for (let b = 0; b < skill_ids.length; b++) {
      if (a === b) continue;
      const sb = skill_ids[b];
      inner.set(sb, (inner.get(sb) ?? 0) + 1);
    }
  }
}

const cities = CITIES_RAW.map((c, idx) => ({
  id: idx + 1,
  name: c.name,
  region: c.region,
  offer_count: cityCounts.get(idx + 1) ?? 0,
}));

const titles = ROLE_ARCHETYPES.map((r) => ({
  id: r.id,
  title: r.title,
  domaine: r.domaine,
  core_skill_ids: [...r.core, ...r.secondary.slice(0, 3)].map(sid),
  offer_count: titleCounts.get(r.id) ?? 0,
}));

// Build exact pairings map from co-occurrence matrix
const pairings: Record<string, Array<{ skill_id: number; pct: number; co_count: number }>> = {};
for (const skill of skills) {
  const totalWithSkill = skillCounts.get(skill.id) ?? 0;
  if (totalWithSkill === 0) continue;
  const inner = coMatrix.get(skill.id);
  if (!inner) continue;
  const sorted = Array.from(inner.entries())
    .map(([otherId, coCount]) => ({
      skill_id: otherId,
      pct: Math.round((coCount / totalWithSkill) * 100),
      co_count: coCount,
    }))
    .filter((entry) => entry.pct >= 8)
    .sort((a, b) => b.pct - a.pct || b.co_count - a.co_count)
    .slice(0, 6);
  if (sorted.length > 0) {
    pairings[String(skill.id)] = sorted;
  }
}

const top_skills = Array.from(skillCounts.entries())
  .map(([skill_id, count]) => ({
    skill_id,
    count,
    pct: Number(((count / ELIGIBLE_OFFERS_COUNT) * 100).toFixed(1)),
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 30);

const by_city: Record<string, number> = {};
for (const c of cities) {
  by_city[c.name] = c.offer_count;
}

const aggregates = {
  by_city,
  by_contract: contractCounts,
  by_level: levelCounts,
  by_work_mode: workModeCounts,
  top_skills,
};

const meta = {
  total_analyzed_offers: 10782,
  eligible_offers: ELIGIBLE_OFFERS_COUNT,
  min_skills_threshold: 3,
  total_skills: skills.length,
  total_cities: cities.length,
  period: '2016–2026',
  generated_at: '2026-11-22',
  source_note:
    "Données issues de 10 782 offres IT au Maroc (2016–2026). 4 774 offres qualifiées comportent au moins 3 compétences techniques explicites.",
};

// Write all 7 JSON files to public/data/
const dataDir = path.resolve(process.cwd(), 'public/data');
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(path.join(dataDir, 'skills.json'), JSON.stringify(skills));
fs.writeFileSync(path.join(dataDir, 'cities.json'), JSON.stringify(cities));
fs.writeFileSync(path.join(dataDir, 'offers-lite.json'), JSON.stringify(offers));
fs.writeFileSync(path.join(dataDir, 'titles.json'), JSON.stringify(titles));
fs.writeFileSync(path.join(dataDir, 'pairings.json'), JSON.stringify(pairings));
fs.writeFileSync(path.join(dataDir, 'aggregates.json'), JSON.stringify(aggregates));
fs.writeFileSync(path.join(dataDir, 'meta.json'), JSON.stringify(meta));

// =========================================================================
// 4. GENERATE CRISP PWA ICONS (SVG + 180/192/512/maskable-512 PNGs)
// =========================================================================
const publicDir = path.resolve(process.cwd(), 'public');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2B4233"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="#F7F3EB" stroke-opacity="0.22" stroke-width="14"/>
  <circle cx="256" cy="256" r="112" fill="none" stroke="#F7F3EB" stroke-opacity="0.38" stroke-width="14"/>
  <circle cx="256" cy="256" r="56" fill="none" stroke="#F2A86F" stroke-width="14"/>
  <path d="M256 256 L362 150" stroke="#F2A86F" stroke-width="20" stroke-linecap="round"/>
  <circle cx="362" cy="150" r="22" fill="#F2A86F"/>
  <circle cx="256" cy="256" r="22" fill="#F7F3EB"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

// Pure Node RGBA PNG encoder using zlib.deflateSync
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function renderRadarPng(size: number, maskable: boolean): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const cy = size / 2;
  // Safe zone scaling: maskable icons keep artwork inside central 72% (14% padding each side)
  const scale = maskable ? size * 0.72 : size * 0.92;
  const rOuter = scale * 0.36;
  const rMid = scale * 0.24;
  const rInner = scale * 0.12;
  const strokeW = Math.max(2, scale * 0.032);
  const dotR = scale * 0.048;

  // Target radar blip at 45 deg top-right
  const blipX = cx + rOuter * 0.68;
  const blipY = cy - rOuter * 0.68;

  // Palette colors
  const bgR = 0x2b, bgG = 0x42, bgB = 0x33; // #2B4233 Forest Green
  const creamR = 0xf7, creamG = 0xf3, creamB = 0xeb; // #F7F3EB
  const peachR = 0xf2, peachG = 0xa8, peachB = 0x6f; // #F2A86F

  const cornerRadius = maskable ? 0 : size * 0.21;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Rounded corners for non-maskable icons
      if (!maskable && cornerRadius > 0) {
        const dxC = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
        const dyC = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
        const distCorner = Math.hypot(dxC, dyC);
        if (distCorner > cornerRadius + 0.5) {
          a = 0;
        } else if (distCorner > cornerRadius - 0.5) {
          a = Math.round(255 * (cornerRadius + 0.5 - distCorner));
        }
      }

      if (a > 0) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);

        const blend = (tr: number, tg: number, tb: number, alpha: number) => {
          r = Math.round(r * (1 - alpha) + tr * alpha);
          g = Math.round(g * (1 - alpha) + tg * alpha);
          b = Math.round(b * (1 - alpha) + tb * alpha);
        };

        // Soft top-right radar sweep glow
        if (dist < rOuter) {
          const angle = Math.atan2(dy, dx); // -PI..PI, top-right is -PI/4
          const diff = Math.abs(angle + Math.PI / 4);
          if (diff < 0.65) {
            const sweepAlpha = (1 - diff / 0.65) * 0.16;
            blend(peachR, peachG, peachB, sweepAlpha);
          }
        }

        // Rings
        const dOuter = Math.abs(dist - rOuter);
        if (dOuter < strokeW / 2 + 1) {
          const cov = Math.max(0, Math.min(1, strokeW / 2 + 0.5 - dOuter));
          blend(creamR, creamG, creamB, cov * 0.28);
        }

        const dMid = Math.abs(dist - rMid);
        if (dMid < strokeW / 2 + 1) {
          const cov = Math.max(0, Math.min(1, strokeW / 2 + 0.5 - dMid));
          blend(creamR, creamG, creamB, cov * 0.45);
        }

        const dInner = Math.abs(dist - rInner);
        if (dInner < strokeW / 2 + 1) {
          const cov = Math.max(0, Math.min(1, strokeW / 2 + 0.5 - dInner));
          blend(peachR, peachG, peachB, cov * 0.92);
        }

        // Radar needle segment from (cx, cy) to (blipX, blipY)
        const vx = blipX - cx;
        const vy = blipY - cy;
        const lenSq = vx * vx + vy * vy;
        const t = Math.max(0, Math.min(1, (dx * vx + dy * vy) / lenSq));
        const px = cx + t * vx;
        const py = cy + t * vy;
        const dLine = Math.hypot(x - px, y - py);
        if (dLine < strokeW * 0.65 + 0.8) {
          const cov = Math.max(0, Math.min(1, strokeW * 0.65 + 0.4 - dLine));
          blend(peachR, peachG, peachB, cov);
        }

        // Blip dot
        const dBlip = Math.hypot(x - blipX, y - blipY);
        if (dBlip < dotR + 0.8) {
          const cov = Math.max(0, Math.min(1, dotR + 0.4 - dBlip));
          blend(peachR, peachG, peachB, cov);
        }

        // Center hub dot
        if (dist < dotR + 0.8) {
          const cov = Math.max(0, Math.min(1, dotR + 0.4 - dist));
          blend(creamR, creamG, creamB, cov);
        }
      }

      const idx = rowStart + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderRadarPng(180, true));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderRadarPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderRadarPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderRadarPng(512, true));

console.log(
  `Generated Moroccan IT dataset: ${skills.length} skills, ${cities.length} cities, ${offers.length} eligible offers, ${titles.length} titles, plus PWA icons.`
);
