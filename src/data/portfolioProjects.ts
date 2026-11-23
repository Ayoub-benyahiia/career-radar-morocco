import type { PortfolioProjectItem, ProjectReadinessStep } from '../types/career';

export const STANDARD_PROJECT_STEPS: ProjectReadinessStep[] = [
  {
    id: 'requirements',
    label: 'Cahier des charges & Maquette',
    description: 'Définir les user stories, le schéma de données et wireframes/maquette Figma.',
    completed: false,
  },
  {
    id: 'repo',
    label: 'Dépôt GitHub initialisé & structuré',
    description: 'Créer le dépôt avec .gitignore adapté, branches feature et commits conventionnels.',
    completed: false,
  },
  {
    id: 'code',
    label: 'Code développé & testé',
    description: 'Architecture modulaire, gestion des erreurs, typage strict et tests unitaires.',
    completed: false,
  },
  {
    id: 'readme',
    label: 'README.md professionnel documenté',
    description: 'Badges, captures d’écran démo, instructions d’installation et stack technique.',
    completed: false,
  },
  {
    id: 'deploy',
    label: 'Déploiement en ligne actif',
    description: 'Application accessible en production sur Vercel, Netlify, Render ou GitHub Pages.',
    completed: false,
  },
];

export const CURATED_PORTFOLIO_PROJECTS: Omit<PortfolioProjectItem, 'steps'>[] = [
  {
    id: 'proj-ecommerce-dashboard',
    title: 'Plateforme E-Commerce & Dashboard B2B Maroc',
    category: 'Frontend & Full Stack',
    difficulty: 'Intermédiaire',
    description:
      'Application web e-commerce responsive avec catalogue produits, panier persistant, filtrage multicritères, gestion d’état et tableau de bord administrateur pour le suivi des ventes en MAD.',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'REST API'],
    targetSkillNames: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'HTML5', 'CSS3', 'Redux'],
    moroccanMarketContext:
      'Forte demande dans les agences web et ESN de Casablanca et Rabat pour des développeurs maîtrisant les interfaces modulaires et le state management.',
    deliverables: [
      'Dashboard réactif avec graphiques de ventes',
      'Catalogue avec recherche instantanée et pagination',
      'Panier d’achat avec synchronisation localStorage',
      'Gestion des formulaires avec validation stricte',
    ],
  },
  {
    id: 'proj-secure-rest-api',
    title: 'API REST Sécurisée Multi-Rôles & Microservice',
    category: 'Backend',
    difficulty: 'Intermédiaire',
    description:
      'Serveur backend d’authentification et de gestion de ressources avec JWT, hachage de mot de passe bcrypt, contrôle d’accès basé sur les rôles (RBAC), validation de schéma et documentation Swagger/OpenAPI.',
    techStack: ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
    targetSkillNames: ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'MongoDB'],
    moroccanMarketContext:
      'Casablanca Nearshore et Technopark recherchent constamment des ingénieurs sachant structurer une API REST scalable conforme aux normes de sécurité.',
    deliverables: [
      'Documentation Swagger/OpenAPI interactive',
      'Architecture en couches Controller / Service / Repository',
      'Fichier Dockerfile et docker-compose prêts pour la production',
      'Suite de tests d’intégration automatisés',
    ],
  },
  {
    id: 'proj-spring-internship-portal',
    title: 'Portail de Suivi des Conventions de Stage & PFE',
    category: 'Backend & Enterprise',
    difficulty: 'Intermédiaire',
    description:
      'Système d’information pour la gestion universitaire des stages PFE au Maroc : workflows de validation multi-étapes, génération de conventions PDF, notifications et persistance JPA/Hibernate.',
    techStack: ['Java', 'Spring Boot', 'MySQL', 'Hibernate/JPA'],
    targetSkillNames: ['Java', 'Spring Boot', 'SQL', 'MySQL', 'Hibernate/JPA', 'REST API', 'Maven'],
    moroccanMarketContext:
      'L’écosystème bancaire (Attijariwafa, BCP, BMCE) et les grands comptes au Maroc recrutent massivement sur le stack Java / Spring Boot.',
    deliverables: [
      'Modélisation relationnelle en 3e forme normale',
      'Endpoints REST sécurisés avec Spring Security',
      'Gestion transactionnelle avec Spring Data JPA',
      'Tests unitaires avec JUnit et Mockito',
    ],
  },
  {
    id: 'proj-data-etl-dashboard',
    title: 'Pipeline ETL & Tableau de Bord Décisionnel',
    category: 'Data & Analytics',
    difficulty: 'Intermédiaire',
    description:
      'Pipeline de traitement de données automatisé : extraction de fichiers CSV/Excel, nettoyage et enrichissement avec Pandas, stockage dans une base SQL et création d’un rapport décisionnel interactif sous Power BI.',
    techStack: ['Python', 'Pandas', 'SQL', 'Power BI'],
    targetSkillNames: ['Python', 'Pandas', 'SQL', 'Power BI', 'Excel', 'ETL', 'SQL Analytics'],
    moroccanMarketContext:
      'Les secteurs de la grande distribution (Marjane, LabelVie) et les banques marocaines recherchent activement des profils capables d’automatiser leurs KPI opérationnels.',
    deliverables: [
      'Script Python modulaire de nettoyage de données',
      'Modèle en étoile (Star Schema) sous PostgreSQL/MySQL',
      'Rapport Power BI avec filtres dynamiques et DAX',
      'Documentation méthodologique du traitement des données',
    ],
  },
  {
    id: 'proj-mobile-services-app',
    title: 'Application Mobile de Services Géolocalisés',
    category: 'Mobile',
    difficulty: 'Avancé',
    description:
      'Application mobile cross-platform avec carte interactive, géolocalisation en temps réel, réservation de prestations de services de proximité, cache hors-ligne et tarifs en Dirhams (MAD).',
    techStack: ['React Native', 'TypeScript', 'Firebase', 'REST API'],
    targetSkillNames: ['React Native', 'Flutter', 'TypeScript', 'JavaScript', 'Firebase', 'Android SDK'],
    moroccanMarketContext:
      'Forte croissance des startups de livraison, transport et conciergerie à Casablanca, Marrakech et Tanger.',
    deliverables: [
      'Interface mobile fluide avec gestes tactiles',
      'Intégration de la cartographie et géolocalisation',
      'Persistance des données en mode hors-ligne',
      'Livrable exécutable prêt pour les démonstrations recruteurs',
    ],
  },
  {
    id: 'proj-devops-cicd-pipeline',
    title: 'Pipeline CI/CD Automatisé & Conteneurisation Multi-Stage',
    category: 'DevOps & Cloud',
    difficulty: 'Avancé',
    description:
      'Infrastructure de release automatisée pour une application web : Dockerfiles multi-stage optimisés, pipeline GitHub Actions avec linting, tests automatisés et reverse-proxy Nginx avec certificats SSL.',
    techStack: ['Docker', 'GitHub Actions', 'Linux', 'Nginx'],
    targetSkillNames: ['Docker', 'Git', 'Linux', 'CI/CD', 'GitHub Actions', 'Nginx', 'Kubernetes'],
    moroccanMarketContext:
      'Transformation Cloud accélérée dans les centres de services partagés et ESN internationales implantées au Maroc (Capgemini, Sopra Steria, SQLI).',
    deliverables: [
      'Images Docker optimisées (taille réduite < 150 Mo)',
      'Workflow GitHub Actions déclenché à chaque Pull Request',
      'Configuration Nginx sécurisée avec gestion de cache',
      'Guide pas-à-pas de déploiement en production',
    ],
  },
  {
    id: 'proj-fastapi-microservice',
    title: 'Microservice Asynchrone FastAPI & Cache Redis',
    category: 'Backend & Data',
    difficulty: 'Intermédiaire',
    description:
      'API web asynchrone haute performance développée avec FastAPI, validation stricte Pydantic, cache en mémoire Redis pour les requêtes répétées et métriques de latence.',
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
    targetSkillNames: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'SQL'],
    moroccanMarketContext:
      'Recherche croissante d’ingénieurs Python polyvalents pour les plateformes fintech et data à fort volume de trafic.',
    deliverables: [
      'Validation de requêtes avec Pydantic v2',
      'Stratégie d’invalidation de cache Redis',
      'Documentation Swagger générée automatiquement',
      'Benchmarks de performances comparatifs',
    ],
  },
  {
    id: 'proj-fullstack-flagship-saas',
    title: 'Plateforme SaaS Complète Full Stack (Projet Phare)',
    category: 'Full Stack',
    difficulty: 'Avancé',
    description:
      'Projet de fin d’études (PFE) ou projet portfolio d’envergure : frontend interactif en React/TypeScript, API sécurisée Node.js/Spring Boot, base de données managée, tableau de bord analytics et déploiement cloud complet.',
    techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS'],
    targetSkillNames: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Express', 'Git', 'Tailwind CSS'],
    moroccanMarketContext:
      'Le profil idéal pour décrocher un stage PFE pré-embauche ou un CDI junior dès la sortie de l’école d’ingénieurs ou de l’université.',
    deliverables: [
      'Architecture Monorepo ou Client/Serveur découplée',
      'Authentification sécurisée avec refresh tokens',
      'Design System soigné et responsive',
      'Lien de démo live en production opérationnelle',
    ],
  },
];

/**
 * Creates a concrete, interactive PortfolioProjectItem with clone of standard steps.
 */
export function instantiateProjectItem(
  template: Omit<PortfolioProjectItem, 'steps'>
): PortfolioProjectItem {
  return {
    ...template,
    steps: STANDARD_PROJECT_STEPS.map((s) => ({ ...s })),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Matches missing skills and target role title to recommended portfolio projects.
 * Always returns sorted projects where the most relevant is at index 0.
 */
export function getRecommendedProjectsForSkills(
  skills: string[],
  targetRoleTitle?: string
): PortfolioProjectItem[] {
  const normalizedSkills = new Set(skills.map((s) => s.trim().toLowerCase()));
  const normalizedTitle = (targetRoleTitle ?? '').toLowerCase();

  const scored = CURATED_PORTFOLIO_PROJECTS.map((proj) => {
    let score = 0;

    // Bonus for matching skills in techStack or targetSkillNames
    for (const tech of proj.techStack) {
      if (normalizedSkills.has(tech.toLowerCase())) score += 3;
    }
    for (const skill of proj.targetSkillNames) {
      if (normalizedSkills.has(skill.toLowerCase())) score += 2;
    }

    // Role bonus
    if (normalizedTitle.includes('front') && proj.category.includes('Frontend')) score += 4;
    if (normalizedTitle.includes('back') && proj.category.includes('Backend')) score += 4;
    if (normalizedTitle.includes('full') && proj.category.includes('Full Stack')) score += 5;
    if ((normalizedTitle.includes('data') || normalizedTitle.includes('bi')) && proj.category.includes('Data')) score += 5;
    if (normalizedTitle.includes('mobile') && proj.category.includes('Mobile')) score += 5;
    if ((normalizedTitle.includes('devops') || normalizedTitle.includes('cloud')) && proj.category.includes('DevOps')) score += 5;

    return { proj, score };
  });

  scored.sort((a, b) => b.score - a.score || a.proj.title.localeCompare(b.proj.title));

  return scored.map((item) => instantiateProjectItem(item.proj));
}
