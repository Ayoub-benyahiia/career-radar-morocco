import { GoogleGenAI } from '@google/genai';
import type {
  CareerPlan,
  CareerPlanConfig,
  CareerPlanMilestone,
  City,
  JobTitle,
  MarketDataset,
  Skill,
  UserProfile,
} from '../types/career';
import { calculateMarketCoverage, calculateSkillROI } from './matcher';

// Local storage key for optional BYOK persistence during session
export const LS_GEMINI_KEY = 'career_radar_gemini_api_key';

export function getStoredGeminiKey(): string {
  try {
    return window.localStorage.getItem(LS_GEMINI_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStoredGeminiKey(key: string): void {
  try {
    if (key.trim()) {
      window.localStorage.setItem(LS_GEMINI_KEY, key.trim());
    } else {
      window.localStorage.removeItem(LS_GEMINI_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Builds realistic, high-value project recommendations for Moroccan IT students.
 */
function getRecommendedProjectForRole(titleName: string, skills: string[]): {
  title: string;
  description: string;
  techStack: string[];
} {
  const primarySkills = skills.slice(0, 4);
  const normalized = titleName.toLowerCase();

  if (normalized.includes('data') || normalized.includes('bi')) {
    return {
      title: 'Tableau de bord décisionnel & Pipeline ETL pour le secteur bancaire / e-commerce',
      description:
        'Conception d’un pipeline de données complet : extraction, nettoyage, modélisation en étoile et visualisations interactives orientées KPI réels du marché marocain.',
      techStack: primarySkills.length > 0 ? primarySkills : ['Python', 'SQL', 'Power BI'],
    };
  }

  if (normalized.includes('mobile') || normalized.includes('flutter') || normalized.includes('react native')) {
    return {
      title: 'Application mobile de services de proximité au Maroc (Géolocalisation & Offline)',
      description:
        'Application mobile native/hybride avec gestion du cache hors-ligne, notifications push et synchronisation REST adaptée aux zones à connectivité variable.',
      techStack: primarySkills.length > 0 ? primarySkills : ['React Native', 'TypeScript', 'Node.js'],
    };
  }

  if (normalized.includes('devops') || normalized.includes('cloud')) {
    return {
      title: 'Pipeline CI/CD automatisé & Déploiement conteneurisé multi-environnement',
      description:
        'Automatisation complète du cycle de release : tests automatisés, conteneurisation Docker, orchestration et monitoring applicatif sur infrastructure cloud.',
      techStack: primarySkills.length > 0 ? primarySkills : ['Docker', 'Git', 'Linux', 'AWS'],
    };
  }

  return {
    title: 'Plateforme Web Full-Stack SaaS (Gestion de stages et candidatures bilingue FR/AR)',
    description:
      'Application web performante avec authentification sécurisée JWT, tableau de bord réactif, architecture modulaire et intégration d’API tierces.',
    techStack: primarySkills.length > 0 ? primarySkills : ['React', 'Node.js', 'SQL', 'Git'],
  };
}

/**
 * Deterministic offline planner: executes 100% locally in < 15ms.
 * Synthesizes data from matcher.ts, skills ROI, and pairings.json.
 */
export function generateOfflineCareerPlan(
  dataset: MarketDataset,
  profile: UserProfile,
  config: CareerPlanConfig
): CareerPlan {
  const skillMap = new Map<number, Skill>();
  for (const s of dataset.skills) {
    skillMap.set(s.id, s);
  }

  const cityMap = new Map<number, City>();
  for (const c of dataset.cities) {
    cityMap.set(c.id, c);
  }

  const userCity = cityMap.get(profile.cityId)?.name ?? 'Agadir';

  // 1. Target Role & Title Lookup
  let targetTitle: JobTitle | undefined = dataset.titles.find((t) => t.id === config.targetTitleId);
  if (!targetTitle) {
    targetTitle = dataset.titles[0] ?? {
      id: 1,
      title: 'Développeur Full Stack',
      domaine: 'Développement',
      core_skill_ids: [88, 77, 107, 44],
      offer_count: 500,
    };
  }

  const userSkillSet = new Set(profile.skillIds);
  const currentCoverage = calculateMarketCoverage(dataset.offers, userSkillSet);

  // 2. Compute Skill ROI for all missing skills
  const roiResults = calculateSkillROI(dataset.offers, dataset.skills, userSkillSet, 25);
  const roiMap = new Map<number, number>();
  for (const r of roiResults) {
    roiMap.set(r.skillId, r.gainPoints);
  }

  // 3. Identify Missing Role Skills & High-ROI Boosters
  const roleMissingIds = targetTitle.core_skill_ids.filter((id) => !userSkillSet.has(id));

  // Prioritize missing core skills, then highest ROI skills in the same domain
  const prioritizedSkillIds: number[] = [];

  for (const id of roleMissingIds) {
    if (!prioritizedSkillIds.includes(id)) {
      prioritizedSkillIds.push(id);
    }
  }

  // Add high-ROI skills that match the target domain or co-occur
  for (const roi of roiResults) {
    if (!prioritizedSkillIds.includes(roi.skillId)) {
      if (prioritizedSkillIds.length >= (config.durationWeeks === 4 ? 3 : 5)) break;
      prioritizedSkillIds.push(roi.skillId);
    }
  }

  // Calculate projected coverage with prioritized skills added
  const plannedSkillSet = new Set([...profile.skillIds, ...prioritizedSkillIds]);
  const projectedCoverage = calculateMarketCoverage(dataset.offers, plannedSkillSet);
  const scoreGainPoints = Math.max(0, projectedCoverage.score - currentCoverage.score);

  // 4. Generate structured weekly milestones
  const durationWeeks = config.durationWeeks === 4 ? 4 : 8;
  const milestonesCount = durationWeeks === 4 ? 4 : 4; // 4 balanced milestones
  const weeksPerMilestone = durationWeeks / milestonesCount;

  const milestones: CareerPlanMilestone[] = [];
  const plannedSkillNames = prioritizedSkillIds
    .map((id) => skillMap.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  for (let i = 0; i < milestonesCount; i++) {
    const startWeek = i * weeksPerMilestone + 1;
    const endWeek = (i + 1) * weeksPerMilestone;
    const weekLabel =
      weeksPerMilestone > 1 ? `Semaines ${startWeek}-${endWeek}` : `Semaine ${startWeek}`;

    const assignedSkillId = prioritizedSkillIds[i % prioritizedSkillIds.length];
    const skillObj = assignedSkillId ? skillMap.get(assignedSkillId) : null;
    const skillName = skillObj?.name ?? 'Architecture & Bonnes Pratiques';
    const skillGain = assignedSkillId ? (roiMap.get(assignedSkillId) ?? 1.5) : 1.0;

    const milestoneId = `m-${i + 1}`;
    let milestoneTitle = '';
    let milestoneDesc = '';
    let tasks: { id: string; label: string; completed: boolean }[] = [];

    if (i === 0) {
      milestoneTitle = `${weekLabel} : Fondations & Maîtrise de ${skillName}`;
      milestoneDesc = `Acquisition des fondamentaux de ${skillName} avec exercices ciblés (+${skillGain} pts de couverture marché).`;
      tasks = [
        {
          id: `${milestoneId}-t1`,
          label: `Consulter la documentation officielle et installer l'environnement de développement pour ${skillName}`,
          completed: false,
        },
        {
          id: `${milestoneId}-t2`,
          label: `Réaliser 3 exercices pratiques (syntaxe avancée, typage, gestion des flux de données)`,
          completed: false,
        },
        {
          id: `${milestoneId}-t3`,
          label: `Publier un premier mini-répertoire structuré sur GitHub avec README documenté`,
          completed: false,
        },
      ];
    } else if (i === 1) {
      milestoneTitle = `${weekLabel} : Projet Pratique & Intégration (${skillName})`;
      milestoneDesc = `Connexion de ${skillName} avec ton socle technique existant sur un module fonctionnel concret.`;
      tasks = [
        {
          id: `${milestoneId}-t1`,
          label: `Concevoir l'architecture d'un projet applicatif combinant ${skillName} et tes acquis`,
          completed: false,
        },
        {
          id: `${milestoneId}-t2`,
          label: `Implémenter les tests unitaires et gérer les cas limites (gestion des erreurs, temps de latence)`,
          completed: false,
        },
        {
          id: `${milestoneId}-t3`,
          label: `Déployer une première version de démonstration accessible en ligne (Vercel / Render / GitHub Pages)`,
          completed: false,
        },
      ];
    } else if (i === 2) {
      const secondSkill = prioritizedSkillIds[i] ? skillMap.get(prioritizedSkillIds[i])?.name : 'Qualité & CI/CD';
      milestoneTitle = `${weekLabel} : Perfectionnement & Synergies (${secondSkill})`;
      milestoneDesc = `Optimisation des performances, réutilisation des composants et standardisation du code selon les normes des ESN marocaines.`;
      tasks = [
        {
          id: `${milestoneId}-t1`,
          label: `Auditer le code avec ESLint / SonarQube et appliquer les principes Clean Code`,
          completed: false,
        },
        {
          id: `${milestoneId}-t2`,
          label: `Mettre en place un pipeline Git d'automatisation des vérifications à chaque commit`,
          completed: false,
        },
        {
          id: `${milestoneId}-t3`,
          label: `Rédiger une fiche technique récapitulative pour préparer les entretiens techniques`,
          completed: false,
        },
      ];
    } else {
      milestoneTitle = `${weekLabel} : Portfolio, CV & Campagne de Candidatures`;
      milestoneDesc = `Valorisation de tes projets, mise à niveau du CV avec mots-clés ATS et postulation ciblée.`;
      tasks = [
        {
          id: `${milestoneId}-t1`,
          label: `Mettre à jour ton profil LinkedIn et ton CV avec les technologies apprises et liens GitHub`,
          completed: false,
        },
        {
          id: `${milestoneId}-t2`,
          label: `Simuler 2 entretiens blancs en préparant la présentation de ton projet phare en 3 minutes`,
          completed: false,
        },
        {
          id: `${milestoneId}-t3`,
          label: `Enregistrer et postuler à 5 offres qualifiées sur Career Radar dans le Tracker`,
          completed: false,
        },
      ];
    }

    milestones.push({
      id: milestoneId,
      weekNumber: i + 1,
      title: milestoneTitle,
      description: milestoneDesc,
      skillIds: assignedSkillId ? [assignedSkillId] : [],
      tasks,
      recommendedProject: i === 1 ? `Prototype fonctionnel de ${skillName}` : undefined,
    });
  }

  // 5. Portfolio project & localized strategic advice
  const portfolioProject = getRecommendedProjectForRole(targetTitle.title, plannedSkillNames);

  const localCityNote =
    userCity.toLowerCase() === 'agadir'
      ? `À Agadir, 22 offres directes ont été identifiées. Les profils combinant ${plannedSkillNames.slice(0, 2).join(' et ')} sont très recherchés par les entreprises du Technopark Agadir et les équipes en télétravail/hybride pour Casablanca et Rabat.`
      : `Pour votre localisation (${userCity}), les opportunités valorisent particulièrement la maîtrise opérationnelle de ${plannedSkillNames.slice(0, 2).join(' et ')}, tant auprès des acteurs locaux que des pôles majeurs de Casablanca et Rabat.`;

  return {
    id: `plan-${Date.now()}`,
    targetTitleId: targetTitle.id,
    targetRoleTitle: targetTitle.title,
    targetDomaine: targetTitle.domaine,
    currentScore: currentCoverage.score,
    projectedScore: projectedCoverage.score,
    scoreGainPoints,
    weeklyHours: config.weeklyHours,
    durationWeeks,
    mode: 'offline_deterministic',
    generatedAt: new Date().toISOString(),
    strategicAdvice:
      `En consacrant ${config.weeklyHours}h par semaine pendant ${durationWeeks} semaines sur ${plannedSkillNames.slice(0, 3).join(', ')}, vous augmentez votre couverture du marché de +${scoreGainPoints} points. Sur le marché marocain des stages PFE et postes juniors, un projet GitHub complet et fonctionnel pèse souvent plus lourd qu'une longue liste de compétences théoriques.`,
    localMarketNote: localCityNote,
    interviewTips: [
      `Savoir expliquer l'architecture de ton projet en 2 minutes (problématique résolue, choix de stack, défis rencontrés).`,
      `Maîtriser les questions pièges sur la gestion d'état, l'asynchronisme (Promise / async/await) et la sécurité basique (JWT, CORS).`,
      `Démontrer une méthode de travail rigoureuse : Git branching, revues de code, tests automatisés et curiosité technologique.`,
    ],
    portfolioProject,
    milestones,
  };
}

/**
 * AI-powered career planner with Gemini 2.5 Flash via @google/genai.
 * Automatically falls back to generateOfflineCareerPlan if API key is missing or call fails.
 */
export async function generateGeminiCareerPlan(
  dataset: MarketDataset,
  profile: UserProfile,
  config: CareerPlanConfig
): Promise<CareerPlan> {
  const apiKey = config.apiKey?.trim() || getStoredGeminiKey() || (process.env.GEMINI_API_KEY ?? '');

  // Guard: if no key or offline, use deterministic offline engine directly
  if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return generateOfflineCareerPlan(dataset, profile, config);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const targetTitle =
      dataset.titles.find((t) => t.id === config.targetTitleId) ?? dataset.titles[0];
    const titleName = targetTitle?.title ?? 'Développeur Full Stack';
    const currentScore = calculateMarketCoverage(dataset.offers, profile.skillIds).score;

    const skillMap = new Map<number, string>();
    for (const s of dataset.skills) {
      skillMap.set(s.id, s.name);
    }
    const currentSkillNames = profile.skillIds
      .map((id) => skillMap.get(id))
      .filter((n): n is string => Boolean(n));

    const cityMap = new Map<number, string>();
    for (const c of dataset.cities) {
      cityMap.set(c.id, c.name);
    }
    const userCity = cityMap.get(profile.cityId) ?? 'Agadir';

    const topRoi = calculateSkillROI(dataset.offers, dataset.skills, profile.skillIds, 5);
    const boosterSuggestions = topRoi
      .map((r) => `${r.skillName} (+${r.gainPoints} pts, ${r.additionalOffers} offres débloquées)`)
      .join(', ');

    const prompt = `
Vous êtes l'Architecte Carrière IA de "Career Radar", la plateforme d'orientation IT au Maroc basée sur l'analyse réelle de 10 782 offres (4 774 offres éligibles).
Générez un plan de carrière personnalisé, concret et hautement actionnable pour un candidat marocain.

Profil du candidat :
- Ville cible : ${userCity} (Maroc)
- Objectif de poste : ${titleName}
- Niveau recherché : ${profile.experienceLevel === 'stage_pfe' ? 'Stage PFE / Fin d\'études' : 'Junior (0-2 ans)'}
- Compétences actuelles : ${currentSkillNames.join(', ') || 'Débutant motivé'}
- Score actuel de compatibilité marché : ${currentScore}%
- Compétences boosters identifiées à fort ROI : ${boosterSuggestions}
- Disponibilité : ${config.weeklyHours} heures d'étude par semaine
- Durée du plan : ${config.durationWeeks} semaines

Règles de génération :
1. Structurer exactement 4 jalons (milestones) progressifs couvrant les ${config.durationWeeks} semaines.
2. Pour chaque jalon, fournir un titre clair, une description motivante, et exactement 3 tâches spécifiques et vérifiables (checkboxes).
3. Inclure des conseils d'entretien spécifiques au marché marocain (Casablanca Nearshore, Technopark, cabinets de conseil, ESN).
4. Proposer une idée de projet de portfolio concret résolvant un cas d'usage crédible au Maroc.
5. Formater la réponse strictement en JSON conforme au schéma suivant :

{
  "strategicAdvice": "Conseil stratégique personnalisé sur le marché marocain...",
  "localMarketNote": "Analyse spécifique pour la ville de ${userCity} et opportunités locales / hybrides...",
  "interviewTips": [
    "Conseil d'entretien 1...",
    "Conseil d'entretien 2...",
    "Conseil d'entretien 3..."
  ],
  "portfolioProject": {
    "title": "Nom du projet",
    "description": "Description détaillée du projet",
    "techStack": ["Technologie 1", "Technologie 2", "Technologie 3"]
  },
  "milestones": [
    {
      "id": "m-1",
      "weekNumber": 1,
      "title": "Titre du jalon 1",
      "description": "Description du jalon",
      "tasks": [
        { "id": "m-1-t1", "label": "Tâche concrète 1", "completed": false },
        { "id": "m-1-t2", "label": "Tâche concrète 2", "completed": false },
        { "id": "m-1-t3", "label": "Tâche concrète 3", "completed": false }
      ]
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

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('Réponse vide du modèle Gemini.');
    }

    const parsed = JSON.parse(responseText);

    // Merge AI insights with rigorous local matcher calculations
    const offlineBaseline = generateOfflineCareerPlan(dataset, profile, config);

    const mergedMilestones: CareerPlanMilestone[] = Array.isArray(parsed.milestones)
      ? parsed.milestones.map((m: Record<string, unknown>, idx: number) => ({
          id: typeof m.id === 'string' ? m.id : `m-${idx + 1}`,
          weekNumber: typeof m.weekNumber === 'number' ? m.weekNumber : idx + 1,
          title: typeof m.title === 'string' ? m.title : `Jalon ${idx + 1}`,
          description: typeof m.description === 'string' ? m.description : '',
          skillIds: offlineBaseline.milestones[idx]?.skillIds ?? [],
          tasks: Array.isArray(m.tasks)
            ? m.tasks.map((t: Record<string, unknown>, tIdx: number) => ({
                id: typeof t.id === 'string' ? t.id : `m-${idx + 1}-t${tIdx + 1}`,
                label: typeof t.label === 'string' ? t.label : `Tâche ${tIdx + 1}`,
                completed: false,
              }))
            : offlineBaseline.milestones[idx]?.tasks ?? [],
          recommendedProject:
            typeof m.recommendedProject === 'string' ? m.recommendedProject : undefined,
        }))
      : offlineBaseline.milestones;

    return {
      id: `plan-ai-${Date.now()}`,
      targetTitleId: targetTitle.id,
      targetRoleTitle: targetTitle.title,
      targetDomaine: targetTitle.domaine,
      currentScore: currentScore,
      projectedScore: offlineBaseline.projectedScore,
      scoreGainPoints: offlineBaseline.scoreGainPoints,
      weeklyHours: config.weeklyHours,
      durationWeeks: config.durationWeeks,
      mode: 'gemini_ai',
      generatedAt: new Date().toISOString(),
      strategicAdvice:
        typeof parsed.strategicAdvice === 'string'
          ? parsed.strategicAdvice
          : offlineBaseline.strategicAdvice,
      localMarketNote:
        typeof parsed.localMarketNote === 'string'
          ? parsed.localMarketNote
          : offlineBaseline.localMarketNote,
      interviewTips:
        Array.isArray(parsed.interviewTips) && parsed.interviewTips.length > 0
          ? parsed.interviewTips.map(String)
          : offlineBaseline.interviewTips,
      portfolioProject:
        parsed.portfolioProject && typeof parsed.portfolioProject === 'object'
          ? {
              title: String(parsed.portfolioProject.title ?? offlineBaseline.portfolioProject.title),
              description: String(
                parsed.portfolioProject.description ?? offlineBaseline.portfolioProject.description
              ),
              techStack: Array.isArray(parsed.portfolioProject.techStack)
                ? parsed.portfolioProject.techStack.map(String)
                : offlineBaseline.portfolioProject.techStack,
            }
          : offlineBaseline.portfolioProject,
      milestones: mergedMilestones,
    };
  } catch (err) {
    console.warn('Gemini API planning failed, falling back to deterministic offline engine:', err);
    return generateOfflineCareerPlan(dataset, profile, config);
  }
}

/**
 * Unified entry point: attempts Gemini AI generation if available, otherwise runs offline engine.
 */
export async function generateHybridCareerPlan(
  dataset: MarketDataset,
  profile: UserProfile,
  config: CareerPlanConfig
): Promise<CareerPlan> {
  const key = config.apiKey?.trim() || getStoredGeminiKey();
  if (key && (typeof navigator === 'undefined' || navigator.onLine)) {
    return generateGeminiCareerPlan(dataset, profile, config);
  }
  return generateOfflineCareerPlan(dataset, profile, config);
}

/**
 * Deterministic plan adaptation: evaluates completed vs remaining tasks,
 * advances acquired competencies, re-ranks remaining tasks by market ROI,
 * and recalculates realistic score projections in < 15ms offline.
 */
export function adaptOfflineCareerPlan(
  currentPlan: CareerPlan,
  dataset: MarketDataset,
  profile: UserProfile
): CareerPlan {
  const skillMap = new Map<number, Skill>();
  for (const s of dataset.skills) {
    skillMap.set(s.id, s);
  }

  const cityMap = new Map<number, City>();
  for (const c of dataset.cities) {
    cityMap.set(c.id, c);
  }

  const userCity = cityMap.get(profile.cityId)?.name ?? 'Agadir';

  // 1. Completion metrics
  const totalTasks = currentPlan.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
  const completedTasks = currentPlan.milestones.flatMap((m) => m.tasks.filter((t) => t.completed));
  const completedCount = completedTasks.length;
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // 2. Identify skills effectively validated through completed tasks
  const validatedSkillIds = new Set<number>();
  for (const milestone of currentPlan.milestones) {
    const allDone = milestone.tasks.length > 0 && milestone.tasks.every((t) => t.completed);
    if (allDone) {
      milestone.skillIds.forEach((id) => validatedSkillIds.add(id));
    }
  }

  // Current combined skill set (profile + validated milestone skills)
  const effectiveSkillSet = new Set([...profile.skillIds, ...validatedSkillIds]);
  const updatedCurrentCoverage = calculateMarketCoverage(dataset.offers, effectiveSkillSet);

  // 3. Re-calculate ROI on all remaining missing skills
  const remainingROI = calculateSkillROI(dataset.offers, dataset.skills, effectiveSkillSet, 20);
  const roiMap = new Map<number, number>();
  for (const r of remainingROI) {
    roiMap.set(r.skillId, r.gainPoints);
  }

  // 4. Target role check
  const targetTitle =
    dataset.titles.find((t) => t.id === currentPlan.targetTitleId) ?? dataset.titles[0];
  const missingCoreIds = (targetTitle?.core_skill_ids ?? []).filter((id) => !effectiveSkillSet.has(id));

  // Prioritize remaining core skills, then highest remaining ROI boosters
  const nextPrioritizedSkillIds: number[] = [];
  for (const id of missingCoreIds) {
    if (!nextPrioritizedSkillIds.includes(id)) {
      nextPrioritizedSkillIds.push(id);
    }
  }
  for (const roi of remainingROI) {
    if (!nextPrioritizedSkillIds.includes(roi.skillId)) {
      if (nextPrioritizedSkillIds.length >= 4) break;
      nextPrioritizedSkillIds.push(roi.skillId);
    }
  }

  // 5. Re-sequence milestones while preserving completed tasks
  const adaptedMilestones: CareerPlanMilestone[] = currentPlan.milestones.map((m, idx) => {
    const allCompleted = m.tasks.length > 0 && m.tasks.every((t) => t.completed);
    const anyCompleted = m.tasks.some((t) => t.completed);

    // If milestone is fully validated, mark it cleanly
    if (allCompleted) {
      return {
        ...m,
        title: m.title.startsWith('✓ [Validé]') ? m.title : `✓ [Validé] ${m.title}`,
        description: `Ce jalon a été accompli avec succès. Les compétences sont désormais acquises dans votre profil actif.`,
      };
    }

    // If milestone is partially completed, keep completed tasks and re-prioritize uncompleted ones
    if (anyCompleted) {
      const completedList = m.tasks.filter((t) => t.completed);
      const uncompletedList = m.tasks.filter((t) => !t.completed);

      // Refresh remaining uncompleted tasks with clear urgency & ROI
      const nextSkillId = nextPrioritizedSkillIds[idx % nextPrioritizedSkillIds.length];
      const nextSkillName = nextSkillId ? skillMap.get(nextSkillId)?.name : 'Perfectionnement';

      const refreshedTasks = uncompletedList.map((t, tIdx) => ({
        ...t,
        label: t.label.includes('(Priorité Réajustée)')
          ? t.label
          : `${t.label} (Priorité Réajustée)`,
      }));

      return {
        ...m,
        title: m.title.replace('✓ [Validé] ', ''),
        description: `${m.description} — Réajusté : concentration sur les ${uncompletedList.length} tâche(s) restante(s) pour débloquer ${nextSkillName}.`,
        tasks: [...completedList, ...refreshedTasks],
      };
    }

    // If milestone has not started yet, assign the latest highest ROI missing skills
    const assignedSkillId = nextPrioritizedSkillIds[idx % nextPrioritizedSkillIds.length];
    const skillName = assignedSkillId ? skillMap.get(assignedSkillId)?.name ?? 'Avancé' : 'Avancé';
    const gain = assignedSkillId ? (roiMap.get(assignedSkillId) ?? 1.5) : 1.0;

    return {
      ...m,
      title: m.title.replace('✓ [Validé] ', ''),
      description: `Jalon repriorisé pour maximiser votre gain (+${gain} pts) avec ${skillName}.`,
      skillIds: assignedSkillId ? [assignedSkillId] : m.skillIds,
      tasks: m.tasks.map((t) => ({ ...t, completed: false })),
    };
  });

  // Calculate new projected score
  const futureSkillSet = new Set([...effectiveSkillSet, ...nextPrioritizedSkillIds]);
  const newProjectedCoverage = calculateMarketCoverage(dataset.offers, futureSkillSet);
  const newGainPoints = Math.max(0, newProjectedCoverage.score - updatedCurrentCoverage.score);

  // Strategic advice tailored to current progress
  let adaptedAdvice = '';
  if (completionPct === 0) {
    adaptedAdvice = `Aucune tâche n'a encore été cochée. Nous avons réordonné les jalons pour démarrer par les compétences à impact immédiat (+${remainingROI[0]?.gainPoints ?? 2} pts). Consacrez vos premières ${currentPlan.weeklyHours}h à valider le premier jalon pour enclencher la dynamique.`;
  } else if (completionPct < 50) {
    adaptedAdvice = `Bon démarrage : ${completedCount}/${totalTasks} tâches validées (${completionPct}%) ! Votre score réel estimé a progressé. Pour les semaines à venir, concentrez vos efforts sur ${nextPrioritizedSkillIds.map((id) => skillMap.get(id)?.name).filter(Boolean).slice(0, 2).join(' et ')}, indispensables pour décrocher des entretiens à ${userCity}.`;
  } else if (completionPct < 100) {
    adaptedAdvice = `Excellente cadence : ${completedCount}/${totalTasks} tâches validées (${completionPct}%) ! Vous approchez de la phase finale. La priorité est désormais de consolider votre projet portfolio GitHub et de lancer les candidatures ciblées.`;
  } else {
    adaptedAdvice = `Félicitations : 100% de vos tâches initiales sont validées ! Votre profil est prêt pour les entretiens techniques. Utilisez le Tracker pour postuler et préparez vos questions avec le module Prép. Entretien.`;
  }

  const adaptationNote = `${completedCount}/${totalTasks} tâches validées (${completionPct}%) — Plan rééquilibré et compétences restantes repriorisées.`;

  return {
    ...currentPlan,
    currentScore: updatedCurrentCoverage.score,
    projectedScore: newProjectedCoverage.score,
    scoreGainPoints: newGainPoints,
    adaptedAt: new Date().toISOString(),
    adaptationNote,
    strategicAdvice: adaptedAdvice,
    milestones: adaptedMilestones,
  };
}

/**
 * AI-powered plan adaptation with Gemini 2.5 Flash via BYOK.
 * Seamlessly falls back to adaptOfflineCareerPlan on network/API failure.
 */
export async function adaptGeminiCareerPlan(
  currentPlan: CareerPlan,
  dataset: MarketDataset,
  profile: UserProfile,
  apiKey?: string
): Promise<CareerPlan> {
  const effectiveKey = apiKey?.trim() || getStoredGeminiKey() || (process.env.GEMINI_API_KEY ?? '');

  if (!effectiveKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return adaptOfflineCareerPlan(currentPlan, dataset, profile);
  }

  try {
    const offlineAdapted = adaptOfflineCareerPlan(currentPlan, dataset, profile);
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const totalTasks = currentPlan.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
    const completedTasks = currentPlan.milestones.flatMap((m) => m.tasks.filter((t) => t.completed));
    const completedLabels = completedTasks.map((t) => t.label).join('\n- ');

    const prompt = `
Vous êtes le Mentor Carrière IA de "Career Radar" au Maroc.
Un candidat suit un plan de carrière pour le poste de "${currentPlan.targetRoleTitle}" (${currentPlan.durationWeeks} semaines, ${currentPlan.weeklyHours}h/semaine).

État d'avancement actuel :
- Progression : ${completedTasks.length} / ${totalTasks} tâches accomplies
- Tâches validées jusqu'ici :
- ${completedLabels || 'Aucune tâche validée pour le moment'}

Mission :
1. Réévaluer le plan pour réajuster la charge de travail et la stratégie pour les semaines restantes.
2. Formuler un conseil stratégique motivant et ultra-précis pour le marché marocain (Casablanca, Rabat, Agadir).
3. Donner 3 conseils d'entretien spécifiques basés sur les acquis et les lacunes restantes.

Répondez STRICTEMENT en JSON :
{
  "strategicAdvice": "Conseil réadapté pour le candidat...",
  "interviewTips": [
    "Conseil d'entretien adapté 1...",
    "Conseil d'entretien adapté 2...",
    "Conseil d'entretien adapté 3..."
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

    const responseText = response.text?.trim();
    if (!responseText) {
      return offlineAdapted;
    }

    const parsed = JSON.parse(responseText);

    return {
      ...offlineAdapted,
      mode: 'gemini_ai',
      strategicAdvice:
        typeof parsed.strategicAdvice === 'string'
          ? parsed.strategicAdvice
          : offlineAdapted.strategicAdvice,
      interviewTips:
        Array.isArray(parsed.interviewTips) && parsed.interviewTips.length > 0
          ? parsed.interviewTips.map(String)
          : offlineAdapted.interviewTips,
    };
  } catch (err) {
    console.warn('Gemini Plan Adaptation failed, falling back to deterministic offline adapter:', err);
    return adaptOfflineCareerPlan(currentPlan, dataset, profile);
  }
}

/**
 * Unified plan adaptation handler: chooses Gemini BYOK when available or runs instant offline adapter.
 */
export async function adaptHybridCareerPlan(
  currentPlan: CareerPlan,
  dataset: MarketDataset,
  profile: UserProfile,
  apiKey?: string
): Promise<CareerPlan> {
  const key = apiKey?.trim() || getStoredGeminiKey();
  if (key && (typeof navigator === 'undefined' || navigator.onLine)) {
    return adaptGeminiCareerPlan(currentPlan, dataset, profile, key);
  }
  return adaptOfflineCareerPlan(currentPlan, dataset, profile);
}
