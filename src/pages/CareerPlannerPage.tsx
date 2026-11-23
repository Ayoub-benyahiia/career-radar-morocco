import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  Key,
  Layers,
  Lightbulb,
  MapPin,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  AppRoute,
  CareerPlan,
  CareerPlanConfig,
  MarketDataset,
  UserProfile,
} from '../types/career';
import {
  adaptHybridCareerPlan,
  generateHybridCareerPlan,
  getStoredGeminiKey,
  setStoredGeminiKey,
} from '../utils/aiPlanner';
import { storage } from '../db/storage';
import { calculateJobMatch } from '../utils/matcher';
import { LearningResourceBlock } from '../components/LearningResourceBlock';
import { PortfolioProjectBuilder } from '../components/PortfolioProjectBuilder';
import { triggerConfetti } from '../utils/confetti';

interface CareerPlannerPageProps {
  dataset: MarketDataset;
  profile: UserProfile;
  initialTargetTitleId?: number;
  onNavigate: (route: AppRoute) => void;
  onShowToast: (message: string) => void;
}

export const CareerPlannerPage: React.FC<CareerPlannerPageProps> = ({
  dataset,
  profile,
  initialTargetTitleId,
  onNavigate,
  onShowToast,
}) => {
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Configuration state
  const defaultTitleId =
    initialTargetTitleId ??
    (dataset.titles.length > 0 ? dataset.titles[0].id : 1);

  const [selectedTitleId, setSelectedTitleId] = useState<number>(defaultTitleId);
  const [weeklyHours, setWeeklyHours] = useState<number>(10);
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [plannerMode, setPlannerMode] = useState<'offline' | 'gemini'>('offline');
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Segmented navigation tab state ('roadmap' | 'portfolio' | 'adapt')
  const [activeTab, setActiveTab] = useState<'roadmap' | 'portfolio' | 'adapt'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('career_radar_planner_tab');
      if (saved === 'roadmap' || saved === 'portfolio' || saved === 'adapt') {
        return saved;
      }
    }
    return 'roadmap';
  });

  const handleTabChange = (tab: 'roadmap' | 'portfolio' | 'adapt') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('career_radar_planner_tab', tab);
    }
  };

  // Accordion state for milestones (default all open)
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    'm-1': true,
    'm-2': true,
    'm-3': true,
    'm-4': true,
  });

  // Load existing plan from IndexedDB on mount
  useEffect(() => {
    let active = true;
    const fetchPlan = async () => {
      try {
        const stored = await storage.getCareerPlan();
        if (active) {
          setPlan(stored);
          setShowConfig(!stored);
        }
      } finally {
        if (active) setLoadingInitial(false);
      }
    };
    void fetchPlan();
    return () => {
      active = false;
    };
  }, []);

  const cityMap = useMemo(() => {
    const map = new Map<number, string>();
    dataset.cities.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [dataset.cities]);

  const skillMap = useMemo(() => {
    const map = new Map<number, string>();
    dataset.skills.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [dataset.skills]);

  const userCityName = cityMap.get(profile.cityId) ?? 'Agadir';

  // Calculate current match % for each title so user sees recommendations
  const userSkillSet = useMemo(() => new Set(profile.skillIds), [profile.skillIds]);

  const titleOptions = useMemo(() => {
    return dataset.titles
      .map((t) => {
        const dummyOffer = {
          id: 0,
          title_id: t.id,
          city_id: 0,
          contract: 'Stage' as const,
          level: 'stage_pfe' as const,
          work_mode: 'onsite' as const,
          skill_ids: t.core_skill_ids,
        };
        const matchPct = Math.round(calculateJobMatch(dummyOffer, userSkillSet));
        return {
          id: t.id,
          title: t.title,
          domaine: t.domaine,
          matchPct,
          offerCount: t.offer_count,
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct || b.offerCount - a.offerCount);
  }, [dataset.titles, userSkillSet]);

  const handleToggleTask = async (milestoneId: string, taskId: string) => {
    // Check if completing this task finishes the full milestone week
    if (plan) {
      const milestone = plan.milestones.find((m) => m.id === milestoneId);
      if (milestone) {
        const willBeAllDone = milestone.tasks.every((t) =>
          t.id === taskId ? !t.completed : t.completed
        );
        if (willBeAllDone) {
          triggerConfetti({ count: 70 });
          onShowToast(`🎉 Semaine ${milestone.weekNumber} complétée à 100% ! Bravo !`);
        }
      }
    }

    // Optimistic UI update
    if (plan) {
      const updated = {
        ...plan,
        milestones: plan.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
          };
        }),
      };
      setPlan(updated);
    }

    const savedPlan = await storage.toggleMilestoneTask(milestoneId, taskId);
    if (savedPlan) {
      setPlan(savedPlan);
      onShowToast('Progression enregistrée localement.');
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      if (apiKey.trim()) {
        setStoredGeminiKey(apiKey.trim());
      }

      const config: CareerPlanConfig = {
        targetTitleId: selectedTitleId,
        weeklyHours,
        durationWeeks,
        apiKey: plannerMode === 'gemini' ? apiKey : '',
      };

      const newPlan = await generateHybridCareerPlan(dataset, profile, config);
      await storage.saveCareerPlan(newPlan);
      setPlan(newPlan);
      setShowConfig(false);
      onShowToast(
        newPlan.mode === 'gemini_ai'
          ? 'Plan IA généré avec Gemini et sauvegardé.'
          : 'Plan hors-ligne généré et sauvegardé.'
      );
    } catch {
      onShowToast('Erreur lors de la génération du plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdaptPlan = async () => {
    if (!plan) return;
    setIsAdapting(true);
    try {
      const adapted = await adaptHybridCareerPlan(plan, dataset, profile, apiKey);
      await storage.saveCareerPlan(adapted);
      setPlan(adapted);
      onShowToast('Plan réadapté avec succès selon ta progression.');
    } catch {
      onShowToast('Erreur lors de la réadaptation du plan.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handleCopyPlan = () => {
    if (!plan) return;
    const textLines = [
      `# Plan de Carrière — ${plan.targetRoleTitle}`,
      `Généré le ${new Date(plan.generatedAt).toLocaleDateString('fr-FR')} via Career Radar (${plan.mode === 'gemini_ai' ? 'Gemini AI' : 'Moteur Hors-Ligne'})`,
      `Score actuel : ${plan.currentScore}% ➔ Score cible : ${plan.projectedScore}% (+${plan.scoreGainPoints} pts)`,
      `Rythme : ${plan.weeklyHours}h/semaine pendant ${plan.durationWeeks} semaines`,
      '',
      `## Conseil Stratégique :`,
      plan.strategicAdvice,
      '',
      `## Contexte Marché (${userCityName}) :`,
      plan.localMarketNote,
      '',
      `## Jalons d'Apprentissage :`,
      ...plan.milestones.flatMap((m) => [
        `### ${m.title}`,
        m.description,
        ...m.tasks.map((t) => `- [${t.completed ? 'x' : ' '}] ${t.label}`),
        '',
      ]),
      `## Projet Portfolio Conseillé :`,
      `**${plan.portfolioProject.title}**`,
      plan.portfolioProject.description,
      `Stack : ${plan.portfolioProject.techStack.join(', ')}`,
      '',
      `## Conseils d'Entretien :`,
      ...plan.interviewTips.map((tip, i) => `${i + 1}. ${tip}`),
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    onShowToast('Plan copié dans le presse-papiers.');
  };

  const toggleMilestoneAccordion = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Progress metrics
  const totalTasks = useMemo(() => {
    if (!plan) return 0;
    return plan.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
  }, [plan]);

  const completedTasks = useMemo(() => {
    if (!plan) return 0;
    return plan.milestones.reduce((acc, m) => acc + m.tasks.filter((t) => t.completed).length, 0);
  }, [plan]);

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loadingInitial) {
    return (
      <div className="px-5 pt-8 pb-28 text-center space-y-4">
        <div className="h-6 w-48 bg-[#E8E0D2] rounded-full animate-pulse mx-auto" />
        <div className="h-44 bg-white/70 rounded-[28px] animate-pulse border border-[#E8E0D2]" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 pb-32 space-y-6">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          aria-label="Retour au tableau de bord"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#E8E0D2] text-[#2B4233] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <span className="font-display text-sm font-bold tracking-tight text-[#1D2A22] block">
            AI Career Planner
          </span>
          <span className="text-[11px] font-medium text-[#5E6B62] flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-[#D97E3E]" />
            Feuille de route ciblée Maroc
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* GENERATING SKELETON STATE */}
      {isGenerating && (
        <div className="rounded-[32px] bg-[#2B4233] p-8 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#F2A86F]/20 animate-pulse" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5 animate-pulse" />

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2A86F]/20 text-[#F2A86F] mx-auto animate-bounce">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold">
              Génération de ton plan en cours...
            </h2>
            <p className="text-xs text-[#C8D3CB] leading-relaxed max-w-xs mx-auto">
              Analyse de 4 774 offres éligibles, calcul des compétences boosters et structuration
              des jalons pour le marché de {userCityName}.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#F2A86F] rounded-full animate-indeterminate" />
            </div>
            <span className="text-[11px] font-mono text-[#F2A86F]">Optimisation algorithmique...</span>
          </div>
        </div>
      )}

      {/* CONFIGURATION VIEW (Shown if no plan or editing config) */}
      {!isGenerating && showConfig && (
        <div className="space-y-5">
          {/* Hero Feature Card */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#2B4233] p-6 text-white shadow-md">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#F2A86F]/15" />
            <div className="relative space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#F2A86F]">
                <Sparkles className="h-3.5 w-3.5" />
                Nouveau · Intelligence Carrière
              </div>
              <h1 className="font-display text-xl font-bold leading-snug">
                Construis ton plan d'action personnalisé
              </h1>
              <p className="text-xs text-[#C8D3CB] leading-relaxed">
                Transforme ton score de compatibilité en une feuille de route hebdomadaire concrète,
                axée sur les compétences qui débloquent le plus d'offres au Maroc.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-6 space-y-6 shadow-sm">
            {/* Step 1: Target Role */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1D2A22]">
                <Target className="h-4 w-4 text-[#D97E3E]" />
                1. Poste cible visé
              </label>
              <div className="relative">
                <select
                  value={selectedTitleId}
                  onChange={(e) => setSelectedTitleId(Number(e.target.value))}
                  className="w-full appearance-none rounded-2xl border border-[#E8E0D2] bg-[#FAF7F2] px-4 py-3 text-xs font-semibold text-[#1D2A22] focus:border-[#2B4233] focus:outline-none cursor-pointer"
                >
                  {titleOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.matchPct}% de match actuel · {t.offerCount} offres)
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5E6B62]" />
              </div>
              <p className="text-[11px] text-[#5E6B62]">
                Classé par compatibilité avec tes {profile.skillIds.length} compétences actives.
              </p>
            </div>

            {/* Step 2: Duration & Weekly Hours */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1D2A22]">
                <Calendar className="h-4 w-4 text-[#D97E3E]" />
                2. Durée &amp; Disponibilité
              </label>

              {/* Duration Pills */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { weeks: 4, label: '4 semaines', desc: 'Sprint Intensif' },
                  { weeks: 8, label: '8 semaines', desc: 'Parcours Complet' },
                ].map((item) => {
                  const active = durationWeeks === item.weeks;
                  return (
                    <button
                      key={item.weeks}
                      type="button"
                      onClick={() => setDurationWeeks(item.weeks)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-[#2B4233] text-white border-[#2B4233] shadow-sm'
                          : 'bg-[#FAF7F2] text-[#1D2A22] border-[#E8E0D2] hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          active ? 'text-[#F2A86F]' : 'text-[#5E6B62]'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hours Pills */}
              <div className="pt-1">
                <span className="text-[11px] font-medium text-[#5E6B62] block mb-2">
                  Temps d'étude hebdomadaire :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { hours: 5, label: '5h / sem', tag: 'Léger' },
                    { hours: 10, label: '10h / sem', tag: 'Conseillé' },
                    { hours: 15, label: '15h+ / sem', tag: 'Boost' },
                  ].map((item) => {
                    const active = weeklyHours === item.hours;
                    return (
                      <button
                        key={item.hours}
                        type="button"
                        onClick={() => setWeeklyHours(item.hours)}
                        className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-[#F2A86F] text-[#1D2A22] border-[#F2A86F] font-bold shadow-sm'
                            : 'bg-[#FAF7F2] text-[#1D2A22] border-[#E8E0D2] text-xs'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className="text-[9px] block text-[#5E6B62]">{item.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Planner Mode (Offline vs Gemini) */}
            <div className="space-y-3 pt-1 border-t border-[#E8E0D2]">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1D2A22]">
                <Sparkles className="h-4 w-4 text-[#D97E3E]" />
                3. Moteur de planification
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlannerMode('offline')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    plannerMode === 'offline'
                      ? 'bg-[#2B4233] text-white border-[#2B4233]'
                      : 'bg-[#FAF7F2] text-[#1D2A22] border-[#E8E0D2]'
                  }`}
                >
                  <WifiOff className="h-4 w-4 mb-1 text-[#F2A86F]" />
                  <span className="text-xs font-bold">100% Hors-Ligne</span>
                  <span className="text-[10px] text-[#C8D3CB]">Instantané · TS-11</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlannerMode('gemini');
                    setShowApiKeyInput(true);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    plannerMode === 'gemini'
                      ? 'bg-[#2B4233] text-white border-[#2B4233]'
                      : 'bg-[#FAF7F2] text-[#1D2A22] border-[#E8E0D2]'
                  }`}
                >
                  <Sparkles className="h-4 w-4 mb-1 text-[#F2A86F]" />
                  <span className="text-xs font-bold">Gemini 2.5 Flash</span>
                  <span className="text-[10px] text-[#C8D3CB]">Conseils Cloud IA</span>
                </button>
              </div>

              {plannerMode === 'gemini' && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1D2A22]">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[#D97E3E]" />
                      Clé API Gemini (BYOK)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="text-[10px] text-[#5E6B62] underline"
                    >
                      {showApiKeyInput ? 'Masquer' : 'Modifier'}
                    </button>
                  </div>
                  {showApiKeyInput && (
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Colle ta clé API Gemini (AI Studio)..."
                      className="w-full rounded-xl border border-[#E8E0D2] bg-white px-3 py-2 text-xs font-mono text-[#1D2A22] placeholder:text-[#5E6B62]/60 focus:border-[#2B4233] focus:outline-none"
                    />
                  )}
                  <p className="text-[10px] text-[#5E6B62] leading-tight">
                    Ta clé reste stockée localement sur ton appareil. En cas de coupure réseau,
                    le plan bascule automatiquement sur le moteur déterministe hors-ligne.
                  </p>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="button"
              onClick={handleGeneratePlan}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F2A86F] py-3.5 px-4 text-sm font-bold text-[#1D2A22] shadow-md hover:bg-[#E8985B] active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
              Générer mon plan d'action
            </button>

            {plan && (
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="w-full text-center text-xs font-semibold text-[#5E6B62] hover:text-[#1D2A22] py-1 cursor-pointer"
              >
                Annuler et voir le plan existant
              </button>
            )}
          </div>
        </div>
      )}

      {/* PLAN DETAILS VIEW (When plan exists and not editing config) */}
      {!isGenerating && !showConfig && plan && (
        <div className="space-y-5">
          {/* Hero Plan Header Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#2B4233] p-6 text-white shadow-lg space-y-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#F2A86F]/15" />
            <div className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#F2A86F] mb-1.5">
                  {plan.mode === 'gemini_ai' ? (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Gemini 2.5 Flash IA
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Moteur Hors-Ligne
                    </>
                  )}
                </span>
                <h1 className="font-display text-xl font-bold leading-tight">
                  {plan.targetRoleTitle}
                </h1>
                <p className="text-xs text-[#C8D3CB] mt-0.5">
                  {plan.durationWeeks} semaines · {plan.weeklyHours}h/semaine
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#C8D3CB] block">Gain estimé</span>
                <span className="font-mono text-lg font-bold text-[#F2A86F] tabular-nums">
                  +{plan.scoreGainPoints} pts
                </span>
              </div>
            </div>

            {/* Score Progression Comparison */}
            <div className="relative rounded-2xl bg-white/10 p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-[#C8D3CB] block">Score Actuel</span>
                <span className="font-mono text-base font-bold text-white tabular-nums">
                  {plan.currentScore}%
                </span>
              </div>
              <TrendingUp className="h-5 w-5 text-[#F2A86F]" />
              <div className="text-right">
                <span className="text-[11px] text-[#C8D3CB] block">Score Cible</span>
                <span className="font-mono text-base font-bold text-[#F2A86F] tabular-nums">
                  {plan.projectedScore}%
                </span>
              </div>
            </div>

            {/* Overall Checklist Progress Bar */}
            <div className="relative space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C8D3CB] text-[11px]">Progression globale</span>
                <span className="font-mono text-xs font-bold text-[#F2A86F] tabular-nums">
                  {completedTasks} / {totalTasks} tâches ({completionPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F2A86F] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sticky Segmented Navigation Tabs */}
          <div className="sticky top-0 z-20 -mx-5 px-5 py-2.5 bg-[#F7F3EB]/95 dark:bg-[#111A14]/95 backdrop-blur-md border-y border-[#E8E0D2] dark:border-[#263C2E] transition-colors">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#18261E] border border-[#E8E0D2] dark:border-[#263C2E] shadow-2xs">
              <button
                type="button"
                onClick={() => handleTabChange('roadmap')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'roadmap'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                <span>🗺️</span>
                <span className="truncate">Route</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('portfolio')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                <span>🛠️</span>
                <span className="truncate">Portfolio</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('adapt')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'adapt'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                <span>⚡</span>
                <span className="truncate">Adapter</span>
              </button>
            </div>
          </div>

          {/* TAB 1: FEUILLE DE ROUTE (Weekly Milestones & Task Checklists) */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-sm font-bold text-[#1D2A22] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#2B4233]" />
                  Jalons &amp; Tâches Hebdomadaires
                </h2>
                <span className="text-[11px] text-[#5E6B62]">
                  {plan.milestones.length} étapes
                </span>
              </div>

              {plan.milestones.map((milestone) => {
                const isExpanded = expandedMilestones[milestone.id] ?? true;
                const milestoneDoneCount = milestone.tasks.filter((t) => t.completed).length;
                const isAllDone =
                  milestone.tasks.length > 0 && milestoneDoneCount === milestone.tasks.length;

                const milestoneSkillNames = milestone.skillIds
                  .map((id) => skillMap.get(id))
                  .filter((n): n is string => Boolean(n));

                const displaySkillNames =
                  milestoneSkillNames.length > 0
                    ? milestoneSkillNames
                    : plan.portfolioProject.techStack.slice(0, 2);

                return (
                  <div
                    key={milestone.id}
                    className={`rounded-[26px] bg-white border transition-all shadow-sm ${
                      isAllDone ? 'border-[#1F6E4A]/30 bg-[#FAFBF9]' : 'border-[#E8E0D2]'
                    }`}
                  >
                    {/* Milestone Header Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleMilestoneAccordion(milestone.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            isAllDone
                              ? 'bg-[#1F6E4A] text-white'
                              : 'bg-[#FAF7F2] text-[#2B4233] border border-[#E8E0D2]'
                          }`}
                        >
                          {isAllDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span>{milestone.weekNumber}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-xs font-bold text-[#1D2A22] truncate">
                            {milestone.title}
                          </h3>
                          <span className="text-[11px] text-[#5E6B62]">
                            {milestoneDoneCount} / {milestone.tasks.length} validées
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-[#5E6B62]">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* Milestone Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-[#E8E0D2]/60">
                        <p className="text-[11px] text-[#5E6B62] leading-relaxed">
                          {milestone.description}
                        </p>

                        {/* Interactive Tasks Checklist */}
                        <div className="space-y-2">
                          {milestone.tasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => handleToggleTask(milestone.id, task.id)}
                              className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                task.completed
                                  ? 'bg-[#1F6E4A]/5 text-[#1D2A22]'
                                  : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#1D2A22]'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-[#2B4233]">
                                {task.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-[#1F6E4A]" />
                                ) : (
                                  <Circle className="h-4 w-4 text-[#5E6B62]" />
                                )}
                              </div>
                              <span
                                className={`text-xs leading-snug ${
                                  task.completed
                                    ? 'line-through text-[#5E6B62]'
                                    : 'font-medium text-[#1D2A22]'
                                }`}
                              >
                                {task.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {milestone.recommendedProject && (
                          <div className="rounded-xl bg-[#FDE8D3]/40 border border-[#F2A86F]/30 p-2.5 text-[11px] text-[#1D2A22] flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-[#D97E3E] shrink-0" />
                            <span>
                              <strong>Projet clé :</strong> {milestone.recommendedProject}
                            </span>
                          </div>
                        )}

                        {/* 1-Tap Learning Resources (YouTube, W3Schools, GeeksforGeeks, Official Docs) */}
                        {displaySkillNames.length > 0 && (
                          <div className="pt-2 border-t border-[#E8E0D2]/60 space-y-2">
                            <span className="text-[11px] font-bold text-[#1D2A22] flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-[#D97E3E]" />
                              Tutoriels &amp; Documentation 1-tap :
                            </span>
                            <div className="space-y-2">
                              {displaySkillNames.map((sName) => (
                                <LearningResourceBlock key={sName} skillName={sName} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PROJETS PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <PortfolioProjectBuilder
                targetRoleTitle={plan.targetRoleTitle}
                missingSkills={plan.portfolioProject.techStack}
                onShowToast={onShowToast}
              />
            </div>
          )}

          {/* TAB 3: ADAPTER & STATS (AI Adaptation, Moroccan Advice & Interview Prep) */}
          {activeTab === 'adapt' && (
            <div className="space-y-5">
              {/* AI Plan Adaptation Control */}
              <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F] shadow-xs">
                      <RefreshCw className={`h-4 w-4 ${isAdapting ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xs font-bold text-[#1D2A22]">
                          Adaptation Continue du Plan
                        </h2>
                        <span className="rounded-full bg-[#FDE8D3] px-2 py-0.5 text-[9px] font-bold text-[#D97E3E]">
                          IA Dynamique
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5E6B62] block mt-0.5">
                        Évalue tes acquis et repriorise les semaines restantes
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-[#2B4233] tabular-nums">
                      {completedTasks}/{totalTasks} faits
                    </span>
                  </div>
                </div>

                {/* Adaptation note if already adapted */}
                {plan.adaptationNote && (
                  <div className="rounded-2xl bg-[#EAF0EC] border border-[#CBD8CF] p-3 text-xs text-[#2B4233] space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-[#1F6E4A]">
                      <span>Dernière réadaptation</span>
                      {plan.adaptedAt && (
                        <span>{new Date(plan.adaptedAt).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">{plan.adaptationNote}</p>
                  </div>
                )}

                <p className="text-xs text-[#5E6B62] leading-relaxed">
                  Tu avances plus vite ou tu bloques sur un sujet ? Le moteur réanalyse les 4 774 offres,
                  recalcule ton score cible et réorganise les tâches restantes selon leur ROI immédiat.
                </p>

                <button
                  type="button"
                  disabled={isAdapting}
                  onClick={() => void handleAdaptPlan()}
                  className="w-full flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#203327] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#F2A86F]" />
                  <span>
                    {isAdapting
                      ? 'Réadaptation du plan en cours...'
                      : 'Adapter mon plan selon ma progression'}
                  </span>
                </button>
              </div>

              {/* Strategic Moroccan Market Advice Card */}
              <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1D2A22]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#D97E3E] border border-[#E8E0D2]">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  Conseil Stratégique Marché Maroc
                </div>
                <p className="text-xs text-[#5E6B62] leading-relaxed">
                  {plan.strategicAdvice}
                </p>

                <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3 text-[11px] text-[#1D2A22] flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#D97E3E] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#1D2A22] block">Focus {userCityName}</span>
                    <span className="text-[#5E6B62] leading-tight block">
                      {plan.localMarketNote}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interview Preparation Tips */}
              <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 shadow-sm space-y-3">
                <h2 className="font-display text-xs font-bold text-[#1D2A22] flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#D97E3E]" />
                  Questions Clés en Entretien Technique (Maroc)
                </h2>
                <div className="space-y-2">
                  {plan.interviewTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#FAF7F2] p-3 text-xs text-[#1D2A22] leading-snug flex items-start gap-2.5 border border-[#E8E0D2]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2B4233] text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] text-[#5E6B62]">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyPlan}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-[#E8E0D2] py-3 px-3 text-xs font-semibold text-[#1D2A22] hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Copy className="h-3.5 w-3.5 text-[#5E6B62]" />
              Copier le plan
            </button>

            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#2B4233] py-3 px-3 text-xs font-semibold text-white hover:bg-[#203327] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#F2A86F]" />
              Régénérer
            </button>
          </div>
        </div>
      )}

      {/* WARM EMPTY STATE (No plan active and not generating or editing config) */}
      {!isGenerating && !showConfig && !plan && (
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#E8E0D2] p-8 text-center space-y-5 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F2A86F]/15" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#2B4233]/5" />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FAF7F2] text-[#2B4233] border border-[#E8E0D2] shadow-xs">
            <Sparkles className="h-9 w-9 text-[#D97E3E]" />
          </div>

          <div className="relative space-y-2 max-w-xs mx-auto">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE8D3] px-3 py-1 text-[11px] font-bold text-[#D97E3E]">
              <Sparkles className="h-3 w-3" />
              Intelligence Marché Maroc
            </span>
            <h2 className="font-display text-lg font-bold text-[#1D2A22]">
              Aucune feuille de route active
            </h2>
            <p className="text-xs text-[#5E6B62] leading-relaxed">
              Sélectionne ton poste cible et génère ton plan d&apos;action personnalisé avec jalons hebdomadaires et projet portfolio adapté.
            </p>
          </div>

          <div className="relative pt-1">
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#203327] active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#F2A86F] stroke-[2.5]" />
              Créer ma feuille de route
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
