import { GoogleGenAI } from '@google/genai';
import type { InterviewPrepGuide, InterviewQuestionItem } from '../types/career';
import { getStoredGeminiKey } from './aiPlanner';

interface TechQuestionTemplate {
  keywords: string[];
  skills: string[];
  questions: Array<{
    question: string;
    keyPointsToCover: string[];
    sampleAnswerHint?: string;
  }>;
}

const TECH_CATALOG: TechQuestionTemplate[] = [
  {
    keywords: ['react', 'next', 'frontend', 'front-end', 'front end', 'web'],
    skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
    questions: [
      {
        question:
          'Comment optimisez-vous les performances de rendu dans une application React (useMemo, useCallback, React.memo, Virtual DOM) ?',
        keyPointsToCover: [
          'Différenciation et réconciliation du Virtual DOM',
          'Utilisation raisonnée de useMemo et useCallback pour stabiliser les références',
          'Fractionnement du code (Code Splitting avec lazy & Suspense)',
          'Éviter les re-renders inutiles via une bonne structure de l’arbre des composants',
        ],
        sampleAnswerHint:
          'Expliquez que le re-render prématuré provient souvent de props d’objets ou callbacks recréés à chaque render, et citez React DevTools Profiler.',
      },
      {
        question:
          'Quelle est votre approche pour la gestion d’état global (Context API vs Redux Toolkit vs Zustand) ?',
        keyPointsToCover: [
          'Context API idéal pour états à faible fréquence (thème, auth)',
          'Redux Toolkit / Zustand pour états complexes et scalables',
          'Normalisation des données et gestion des états asynchrones (React Query / RTK Query)',
        ],
        sampleAnswerHint:
          'Privilégiez la simplicité : "J’utilise Context pour l’auth utilisateur et Zustand ou TanStack Query pour le cache serveur".',
      },
      {
        question:
          'Comment gérez-vous le typage strict et les génériques en TypeScript dans vos composants ?',
        keyPointsToCover: [
          'Typage strict des Props et Events synthétiques React',
          'Utilisation des Generics pour les composants réutilisables (ex: Tableaux, Listes)',
          'Différence entre Type et Interface et utilitaires TypeScript (Partial, Pick, Omit)',
        ],
      },
    ],
  },
  {
    keywords: ['node', 'express', 'nest', 'backend', 'back-end', 'api', 'rest'],
    skills: ['Node.js', 'Express', 'TypeScript', 'REST API', 'SQL'],
    questions: [
      {
        question:
          'Comment fonctionne l’Event Loop dans Node.js et comment gérez-vous les opérations asynchrones bloquantes ?',
        keyPointsToCover: [
          'Compréhension des phases : Timers, I/O polling, Check (setImmediate), Microtasks',
          'Single-threaded pour le code JS utilisateur, threadpool libuv en arrière-plan',
          'Délégation des tâches CPU-intensives (Worker Threads, Child Processes)',
        ],
        sampleAnswerHint:
          'Soulignez qu’il ne faut jamais bloquer l’Event Loop avec du calcul lourd (ex: parsing JSON géant synchrone).',
      },
      {
        question:
          'Comment sécurisez-vous une API REST en production (authentification, rate-limiting, injection) ?',
        keyPointsToCover: [
          'Auth JWT avec Refresh Token en cookie HttpOnly / SameSite',
          'Validation stricte des payloads (Zod, Joi, class-validator)',
          'Protection contre les attaques courantes : Helmet, CORS strict, Rate-limiting, requêtes paramétrées SQL',
        ],
      },
      {
        question:
          'Quelle est votre stratégie pour la gestion des transactions et des erreurs dans une API Node.js ?',
        keyPointsToCover: [
          'Middleware centralisé de capture d’erreurs',
          'Codes de statut HTTP normalisés (400, 401, 403, 404, 500)',
          'Transactions ACID au niveau de la base de données (rollback automatique en cas d’erreur)',
        ],
      },
    ],
  },
  {
    keywords: ['java', 'spring', 'springboot', 'jee', 'j2ee', 'hibernate'],
    skills: ['Java', 'Spring Boot', 'SQL', 'Hibernate', 'Docker'],
    questions: [
      {
        question:
          'Expliquez le principe de l’Inversion de Contrôle (IoC) et de l’Injection de Dépendances dans Spring Boot.',
        keyPointsToCover: [
          'Le conteneur Spring gère le cycle de vie des Beans (@Component, @Service, @Repository)',
          'Injection par constructeur recommandée (immuabilité, facilité de test unitaire)',
          'Scopes des beans (@Scope singleton vs prototype)',
        ],
      },
      {
        question:
          'Comment résolvez-vous le problème N+1 requêtes avec Hibernate / Spring Data JPA ?',
        keyPointsToCover: [
          'Identification via les logs SQL (show-sql)',
          'Utilisation de JOIN FETCH dans les requêtes JPQL',
          '@EntityGraph pour déclarer le graphe de chargement à la demande',
          'Différence entre FetchType.LAZY et EAGER',
        ],
      },
      {
        question:
          'Comment structurez-vous les tests unitaires et d’intégration avec JUnit 5 et Mockito ?',
        keyPointsToCover: [
          'Mocks des dépendances de service avec @Mock et @InjectMocks',
          'Tests d’intégration d’API avec @SpringBootTest et MockMvc ou Testcontainers',
          'Principe Arrange-Act-Assert (AAA)',
        ],
      },
    ],
  },
  {
    keywords: ['python', 'django', 'fastapi', 'data', 'pandas', 'analytics', 'bi'],
    skills: ['Python', 'SQL', 'Pandas', 'FastAPI', 'Docker'],
    questions: [
      {
        question:
          'Quelle est la différence entre liste et générateur en Python et quand privilégier les générateurs ?',
        keyPointsToCover: [
          'Évaluation paresseuse (lazy evaluation) avec le mot-clé yield',
          'Optimisation mémoire drastique sur les flux de données volumineux',
          'Différence de syntaxe : compréhensions de listes [] vs générateurs ()',
        ],
      },
      {
        question:
          'Comment manipulez-vous efficacement de gros volumes de données avec Pandas et SQL ?',
        keyPointsToCover: [
          'Vectorisation des calculs plutôt que d’itérer avec des boucles for',
          'Filtrage et aggrégations directement en amont via SQL dans la base',
          'Gestion des types de colonnes (categories, int32) pour économiser la RAM',
        ],
      },
      {
        question:
          'Dans FastAPI / Django, comment gérez-vous l’asynchronisme (async/await) et la validation des modèles ?',
        keyPointsToCover: [
          'Validation déclarative avec Pydantic',
          'Gestion des requêtes I/O asynchrones vers la base de données',
          'Documentation automatique interactive Swagger / OpenAPI',
        ],
      },
    ],
  },
  {
    keywords: ['devops', 'docker', 'ci', 'cd', 'cloud', 'linux', 'aws', 'kubernetes'],
    skills: ['Docker', 'Git', 'Linux', 'CI/CD', 'Nginx'],
    questions: [
      {
        question:
          'Quelles sont les meilleures pratiques pour concevoir une image Docker de production légère et sécurisée ?',
        keyPointsToCover: [
          'Utilisation du Multi-Stage Build (séparation build et runtime)',
          'Images de base minimales (Alpine, Distroless)',
          'Ne pas exécuter en tant que root (USER node / nonroot)',
          'Optimisation du cache des calques (.dockerignore, ordre des commandes)',
        ],
      },
      {
        question:
          'Comment configurez-vous un pipeline CI/CD moderne (GitHub Actions / GitLab CI) ?',
        keyPointsToCover: [
          'Stages séquentiels : Lint -> Tests unitaires -> Build image -> Scan vulnérabilités -> Déploiement',
          'Gestion sécurisée des secrets d’environnement',
          'Stratégie de rollback en cas d’échec du déploiement',
        ],
      },
    ],
  },
];

const MOROCCAN_HR_QUESTIONS: Array<{
  question: string;
  keyPointsToCover: string[];
  sampleAnswerHint?: string;
}> = [
  {
    question:
      'Parlez-moi de votre projet le plus marquant (PFE, stage ou projet personnel) : quel était le défi et comment l’avez-vous surmonté ?',
    keyPointsToCover: [
      'Structure STAR : Situation, Tâche, Action concrète, Résultat mesurable',
      'Mentionner les choix technologiques et les compromis assumés',
      'Expliquer un problème réel (bug bloquant, latence, architecture) et votre méthode de résolution',
    ],
    sampleAnswerHint:
      'Ne récitez pas une liste d’outils. Racontez une histoire : "Notre projet devait synchroniser des offres hors-ligne, nous avons opté pour IndexedDB et une politique de cache..."',
  },
  {
    question:
      'En ESN / cabinet de conseil au Maroc, les spécifications client changent souvent en cours de sprint. Comment réagissez-vous ?',
    keyPointsToCover: [
      'Agilité, écoute active et communication transparente sans frustration',
      'Évaluation de l’impact technique et communication immédiate avec le Scrum Master / Tech Lead',
      'Priorisation collective pour réajuster le périmètre du sprint',
    ],
  },
  {
    question:
      'Pourquoi avoir postulé chez nous et comment envisagez-vous votre évolution au cours de vos 2 premières années ?',
    keyPointsToCover: [
      'Connaissance des projets ou clients de l’entreprise (banque, télécom, offshore)',
      'Volonté d’acquérir rapidement de l’autonomie technique',
      'Objectif réaliste : junior autonome en 6 mois, puis montée en compétences vers la conception et l’aide aux nouveaux arrivants',
    ],
  },
];

const CANDIDATE_STRATEGIC_QUESTIONS: Array<{
  question: string;
  keyPointsToCover: string[];
}> = [
  {
    question:
      'Quelle est la composition de l’équipe technique et quel est le parcours d’intégration (onboarding / mentorat) prévu pour un junior ?',
    keyPointsToCover: [
      'Montre votre volonté d’apprendre méthodiquement',
      'Permet d’évaluer si vous aurez un senior référent pour progresser',
    ],
  },
  {
    question:
      'Quel est votre cycle de release et votre politique de revue de code (pull requests obligatoires, tests automatisés en CI) ?',
    keyPointsToCover: [
      'Démontre une culture de la qualité logicielle et de l’exigence technique',
    ],
  },
  {
    question:
      'Quels sont les plus grands défis techniques que l’équipe doit relever au cours des 6 prochains mois ?',
    keyPointsToCover: [
      'Montre votre vision projet et votre intérêt pour l’avenir de l’entreprise',
    ],
  },
];

const CHECKLIST_DAY_J: string[] = [
  'Avoir son dépôt GitHub ouvert avec un commit récent propre et README structuré.',
  'Avoir l’URL de démonstration en direct (Vercel / Netlify / Render) prête pour partage d’écran.',
  'Préparer une présentation fluide de soi et de son projet en 90 secondes chrono.',
  'Tester micro, webcam et connexion réseau 10 minutes avant l’appel (Teams / Google Meet).',
  'Avoir un carnet de notes et stylo pour noter les questions et feedbacks du jury technique.',
  'Préparer 2 questions ciblées à poser au recruteur en fin d’entretien.',
];

/**
 * Deterministic offline generator for interview preparation questions.
 */
export function generateOfflineInterviewPrep(
  role: string,
  company: string,
  profileSkills: string[] = []
): InterviewPrepGuide {
  const normalizedRole = role.toLowerCase();
  const detectedSkills = new Set<string>();

  // Find matching technical categories: role keyword match has highest priority
  const roleDirectMatches: TechQuestionTemplate[] = [];
  const skillSecondaryMatches: TechQuestionTemplate[] = [];

  for (const template of TECH_CATALOG) {
    const matchesRole = template.keywords.some((kw) => normalizedRole.includes(kw));
    const matchesSkills = template.skills.some((sk) =>
      profileSkills.some((pSk) => pSk.toLowerCase() === sk.toLowerCase())
    );

    if (matchesRole) {
      roleDirectMatches.push(template);
      template.skills.forEach((s) => detectedSkills.add(s));
    } else if (matchesSkills) {
      skillSecondaryMatches.push(template);
      template.skills.forEach((s) => detectedSkills.add(s));
    }
  }

  const matchedTemplates =
    roleDirectMatches.length > 0
      ? [...roleDirectMatches, ...skillSecondaryMatches]
      : skillSecondaryMatches.length > 0
      ? skillSecondaryMatches
      : [TECH_CATALOG[0], TECH_CATALOG[1]];

  const technicalQuestions: InterviewQuestionItem[] = [];
  let qIdx = 1;

  for (const template of matchedTemplates) {
    for (const q of template.questions) {
      if (technicalQuestions.length >= 4) break;
      technicalQuestions.push({
        id: `q-tech-${qIdx++}`,
        category: 'technique',
        question: q.question,
        keyPointsToCover: q.keyPointsToCover,
        sampleAnswerHint: q.sampleAnswerHint,
      });
    }
    if (technicalQuestions.length >= 4) break;
  }

  const hrQuestions: InterviewQuestionItem[] = MOROCCAN_HR_QUESTIONS.map((q, idx) => ({
    id: `q-rh-${idx + 1}`,
    category: 'culture_rh',
    question: q.question,
    keyPointsToCover: q.keyPointsToCover,
    sampleAnswerHint: q.sampleAnswerHint,
  }));

  const candidateQuestions: InterviewQuestionItem[] = CANDIDATE_STRATEGIC_QUESTIONS.map(
    (q, idx) => ({
      id: `q-cand-${idx + 1}`,
      category: 'question_au_recruteur',
      question: q.question,
      keyPointsToCover: q.keyPointsToCover,
    })
  );

  return {
    roleTitle: role,
    company: company || 'Entreprise IT Maroc',
    detectedSkills: Array.from(detectedSkills),
    questions: [...technicalQuestions, ...hrQuestions, ...candidateQuestions],
    checklistDayJ: CHECKLIST_DAY_J,
    generatedAt: new Date().toISOString(),
    mode: 'offline_deterministic',
  };
}

/**
 * AI-enhanced interview prep generator using Gemini BYOK.
 * Falls back automatically to offline generator on error or disconnect.
 */
export async function generateGeminiInterviewPrep(
  role: string,
  company: string,
  profileSkills: string[] = [],
  apiKey?: string
): Promise<InterviewPrepGuide> {
  const effectiveKey = apiKey?.trim() || getStoredGeminiKey() || (process.env.GEMINI_API_KEY ?? '');

  if (!effectiveKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return generateOfflineInterviewPrep(role, company, profileSkills);
  }

  try {
    const offlineGuide = generateOfflineInterviewPrep(role, company, profileSkills);
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `
Vous êtes le Lead Recruteur Technique & Coach Carrière chez un grand acteur IT au Maroc.
Générez un guide de préparation d'entretien technique hyper personnalisé pour le profil suivant :

- Entreprise cible : ${company || 'Entreprise IT Maroc'}
- Poste visé : ${role}
- Compétences du candidat : ${profileSkills.join(', ') || 'Stack web standard'}

Exigences :
1. Générer 3 questions techniques pointues et spécifiques à la stack du poste, avec les points clés indispensables à citer.
2. Générer 2 questions de mise en situation RH / culture d'équipe (ESN, client grand compte, PFE).
3. Générer 2 questions percutantes que le candidat doit poser au recruteur pour démontrer sa maturité.

Répondez STRICTEMENT en JSON :
{
  "questions": [
    {
      "id": "q-1",
      "category": "technique",
      "question": "Question technique...",
      "keyPointsToCover": ["Point 1", "Point 2", "Point 3"],
      "sampleAnswerHint": "Conseil de formulation..."
    },
    {
      "id": "q-2",
      "category": "culture_rh",
      "question": "Question comportementale...",
      "keyPointsToCover": ["Point 1", "Point 2"],
      "sampleAnswerHint": "Conseil..."
    },
    {
      "id": "q-3",
      "category": "question_au_recruteur",
      "question": "Question au recruteur...",
      "keyPointsToCover": ["Pourquoi poser cette question", "Ce que cela valorise"]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) return offlineGuide;

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return offlineGuide;
    }

    const aiQuestions: InterviewQuestionItem[] = parsed.questions.map(
      (q: Record<string, unknown>, idx: number) => ({
        id: typeof q.id === 'string' ? q.id : `q-ai-${idx + 1}`,
        category:
          q.category === 'culture_rh' || q.category === 'question_au_recruteur'
            ? q.category
            : 'technique',
        question: typeof q.question === 'string' ? q.question : 'Question d’entretien',
        keyPointsToCover: Array.isArray(q.keyPointsToCover)
          ? q.keyPointsToCover.map(String)
          : ['Démontrer méthode et rigueur'],
        sampleAnswerHint:
          typeof q.sampleAnswerHint === 'string' ? q.sampleAnswerHint : undefined,
      })
    );

    return {
      ...offlineGuide,
      questions: aiQuestions,
      mode: 'gemini_ai',
    };
  } catch (err) {
    console.warn('Gemini Interview Prep failed, falling back to deterministic generator:', err);
    return generateOfflineInterviewPrep(role, company, profileSkills);
  }
}

/**
 * Unified entry point for interview prep.
 */
export async function generateInterviewPrep(
  role: string,
  company: string,
  profileSkills: string[] = [],
  apiKey?: string
): Promise<InterviewPrepGuide> {
  const key = apiKey?.trim() || getStoredGeminiKey();
  if (key && (typeof navigator === 'undefined' || navigator.onLine)) {
    return generateGeminiInterviewPrep(role, company, profileSkills, key);
  }
  return generateOfflineInterviewPrep(role, company, profileSkills);
}
