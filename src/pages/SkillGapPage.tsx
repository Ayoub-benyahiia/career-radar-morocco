import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type {
  AppRoute,
  MarketCoverageResult,
  MarketDataset,
  Skill,
  UserProfile,
} from '../types/career';
import { calculateMarketCoverage, calculateSkillROI } from '../utils/matcher';
import { formatNumberFR } from '../utils/formatters';
import { LearningResourceBlock } from '../components/LearningResourceBlock';

interface SkillGapPageProps {
  dataset: MarketDataset;
  profile: UserProfile;
  baseCoverage: MarketCoverageResult;
  onAddSkillsToProfile: (newSkillIds: number[]) => Promise<void>;
  onNavigate?: (route: AppRoute) => void;
}

export const SkillGapPage: React.FC<SkillGapPageProps> = ({
  dataset,
  profile,
  baseCoverage,
  onAddSkillsToProfile,
  onNavigate,
}) => {
  const [simulatedIds, setSimulatedIds] = useState<number[]>([]);
  const [committing, setCommitting] = useState(false);

  const skillById = useMemo(() => {
    const map = new Map<number, Skill>();
    dataset.skills.forEach((s) => map.set(s.id, s));
    return map;
  }, [dataset.skills]);

  const simulatedSet = useMemo(() => new Set(simulatedIds), [simulatedIds]);

  const combinedSkillIds = useMemo(
    () => Array.from(new Set([...profile.skillIds, ...simulatedIds])),
    [profile.skillIds, simulatedIds]
  );

  const simulatedCoverage = useMemo(
    () =>
      simulatedIds.length === 0
        ? baseCoverage
        : calculateMarketCoverage(dataset.offers, combinedSkillIds),
    [dataset.offers, combinedSkillIds, simulatedIds.length, baseCoverage]
  );

  // Baseline ROI ranked against current profile so toggled cards remain stable & interactive
  const topMissingROI = useMemo(() => {
    const baseTop = calculateSkillROI(dataset.offers, dataset.skills, profile.skillIds, 10);
    // If user simulated a skill from pairings that wasn't in top 10, compute its baseline ROI too
    const inTopSet = new Set(baseTop.map((r) => r.skillId));
    const extraSimIds = simulatedIds.filter((id) => !inTopSet.has(id) && !profile.skillIds.includes(id));

    if (extraSimIds.length === 0) return baseTop;

    const allROI = calculateSkillROI(dataset.offers, dataset.skills, profile.skillIds, 0);
    const extras = allROI.filter((r) => extraSimIds.includes(r.skillId));
    return [...extras, ...baseTop];
  }, [dataset.offers, dataset.skills, profile.skillIds, simulatedIds]);

  const toggleSimulate = (skillId: number) => {
    if (profile.skillIds.includes(skillId)) return;
    setSimulatedIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleReset = () => setSimulatedIds([]);

  const handleCommitSimulated = async () => {
    if (simulatedIds.length === 0) return;
    setCommitting(true);
    try {
      await onAddSkillsToProfile(simulatedIds);
      setSimulatedIds([]);
    } finally {
      setCommitting(false);
    }
  };

  // Section 4.3: Skill Co-occurrences / Pairings (US-08)
  const pairingCards = useMemo(() => {
    const ownedSet = new Set(profile.skillIds);
    // Prioritize user's owned skills that have pairing data; fallback to top market skills if empty
    const anchorSkillIds =
      profile.skillIds.length > 0
        ? profile.skillIds.filter((id) => Boolean(dataset.pairings[String(id)]?.length)).slice(0, 4)
        : dataset.aggregates.top_skills
            .slice(0, 3)
            .map((entry) => entry.skill_id)
            .filter((id) => Boolean(dataset.pairings[String(id)]?.length));

    return anchorSkillIds
      .map((anchorId) => {
        const anchorSkill = skillById.get(anchorId);
        const entries = (dataset.pairings[String(anchorId)] ?? [])
          .filter((e) => !ownedSet.has(e.skill_id))
          .slice(0, 4)
          .map((e) => ({
            ...e,
            skill: skillById.get(e.skill_id),
          }))
          .filter((e): e is typeof e & { skill: Skill } => Boolean(e.skill));

        if (!anchorSkill || entries.length === 0) return null;
        return { anchorSkill, entries };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [profile.skillIds, dataset.pairings, dataset.aggregates.top_skills, skillById]);

  const deltaPts = simulatedCoverage.score - baseCoverage.score;
  const deltaOffers = simulatedCoverage.matchingOffersCount - baseCoverage.matchingOffersCount;
  const isSimulating = simulatedIds.length > 0;

  return (
    <div className="px-5 pt-5 pb-28 space-y-6">
      {/* Section 4.1: Header & Interactive Simulator Banner (US-09) */}
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D2A22]">
          Booster mon Score (ROI)
        </h1>
        <p className="text-sm text-[#5E6B62]">
          Simule l&apos;apprentissage d&apos;une compétence pour voir son impact immédiat.
        </p>
      </header>

      {/* Live Simulator Comparison Box */}
      <section className="rounded-[28px] bg-[#2B4233] p-5 text-white shadow-md space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Left: Current Score */}
          <div className="rounded-2xl bg-white/10 p-3.5 text-center">
            <span className="block text-[11px] font-medium text-[#C8D3CB]">Score Actuel</span>
            <span className="mt-1 block font-mono text-2xl font-bold text-white tabular-nums">
              {baseCoverage.score}%
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-[#C8D3CB] tabular-nums">
              {formatNumberFR(baseCoverage.matchingOffersCount)} offres
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2A86F]/20 text-[#F2A86F]">
            <ArrowRight className="h-4 w-4" />
          </div>

          {/* Right: Simulated Score */}
          <div
            className={`rounded-2xl p-3.5 text-center transition-colors ${
              isSimulating
                ? 'bg-[#E6F4EC] text-[#1D2A22]'
                : 'bg-white/10 text-white'
            }`}
          >
            <span
              className={`block text-[11px] font-semibold ${
                isSimulating ? 'text-[#1F6E4A]' : 'text-[#C8D3CB]'
              }`}
            >
              Score Simulé
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1.5">
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  isSimulating ? 'text-[#1F6E4A]' : 'text-white'
                }`}
              >
                {simulatedCoverage.score}%
              </span>
              {isSimulating && (
                <span className="font-mono text-xs font-bold text-[#1F6E4A] tabular-nums">
                  +{deltaPts} pts
                </span>
              )}
            </div>
            <span
              className={`mt-0.5 block font-mono text-[11px] tabular-nums ${
                isSimulating ? 'text-[#1F6E4A]' : 'text-[#C8D3CB]'
              }`}
            >
              {isSimulating
                ? `+${formatNumberFR(deltaOffers)} offres`
                : 'Active un skill'}
            </span>
          </div>
        </div>

        {/* Simulation Actions */}
        {isSimulating && (
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/12 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser simulation
            </button>
            <button
              type="button"
              disabled={committing}
              onClick={() => void handleCommitSimulated()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F2A86F] px-3.5 py-2 text-xs font-bold text-[#1D2A22] hover:bg-[#EAA064] transition-colors whitespace-nowrap disabled:opacity-60 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              {committing ? 'Ajout...' : `Ajouter au profil (${simulatedIds.length})`}
            </button>
          </div>
        )}
      </section>

      {/* AI Career Planner Bridge Banner */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate('career-planner')}
          className="w-full flex items-center justify-between p-4 rounded-[26px] bg-white border border-[#E8E0D2] shadow-sm hover:border-[#F2A86F]/60 active:scale-[0.99] transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2B4233] text-[#F2A86F] shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xs font-bold block text-[#1D2A22]">
                Transformer ces compétences en feuille de route IA
              </span>
              <span className="text-[11px] text-[#5E6B62] block leading-tight">
                Planifier l'apprentissage sur 4 ou 8 semaines avec jalons et projet.
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#5E6B62] group-hover:text-[#1D2A22] shrink-0" />
        </button>
      )}

      {/* Section 4.2: Top Missing Skills Ranked by ROI Impact (US-07) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[#1D2A22]">
            Compétences les plus rentables à apprendre
          </h2>
          <TrendingUp className="h-4 w-4 text-[#2B4233] shrink-0" />
        </div>

        {topMissingROI.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#E8E0D2] p-6 text-center text-sm text-[#5E6B62]">
            Tu maîtrises déjà toutes les compétences référencées sur le marché !
          </div>
        ) : (
          <div className="space-y-2.5">
            {topMissingROI.map((item) => {
              const isSelected = simulatedSet.has(item.skillId);
              return (
                <div
                  key={item.skillId}
                  onClick={() => toggleSimulate(item.skillId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSimulate(item.skillId);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDE8D3] border-[#F2A86F] shadow-xs'
                      : 'bg-white border-[#E8E0D2] hover:border-[#CFC4B2]'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-sm font-bold text-[#1D2A22]">
                        {item.skillName}
                      </span>
                      <span className="text-xs text-[#5E6B62]">· {item.domaine}</span>
                    </div>
                    <p className="text-xs text-[#5E6B62]">
                      Débloque{' '}
                      <strong className="font-mono text-[#1D2A22] tabular-nums">
                        +{formatNumberFR(item.additionalOffers)}
                      </strong>{' '}
                      offres supplémentaires
                    </p>
                    <LearningResourceBlock skillName={item.skillName} compact={true} />
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-xs font-bold text-[#1F6E4A] tabular-nums whitespace-nowrap">
                      +{item.gainPoints.toFixed(1)} pts
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSimulate(item.skillId);
                      }}
                      className={`inline-flex min-h-[38px] items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[#2B4233] text-white'
                          : 'bg-[#FAF7F2] border border-[#DFD6C7] text-[#1D2A22] hover:bg-[#FDE8D3]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#F2A86F] stroke-[2.5]" />
                          Simulé
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Simuler
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 4.3: Skill Co-occurrences / Pairings (US-08) */}
      {pairingCards.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D97E3E]" />
            <h2 className="font-display text-lg font-bold text-[#1D2A22]">
              Souvent demandés avec tes skills
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
            {pairingCards.map(({ anchorSkill, entries }) => (
              <article
                key={anchorSkill.id}
                className="w-[276px] shrink-0 rounded-3xl bg-white border border-[#E8E0D2] p-4 space-y-3"
              >
                <p className="text-xs text-[#5E6B62] leading-relaxed">
                  Avec <strong className="text-[#1D2A22]">{anchorSkill.name}</strong>, les
                  recruteurs demandent aussi :
                </p>

                <div className="space-y-2">
                  {entries.map((entry) => {
                    const isSim = simulatedSet.has(entry.skill_id);
                    return (
                      <div
                        key={entry.skill_id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-[#1D2A22] truncate">
                            {entry.skill.name}
                          </span>
                          <span className="font-mono text-[#5E6B62] tabular-nums shrink-0">
                            ({entry.pct}%)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSimulate(entry.skill_id)}
                          className={`min-h-[32px] rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isSim
                              ? 'bg-[#2B4233] text-white'
                              : 'bg-[#FAF7F2] border border-[#E4DACB] text-[#2B4233] hover:bg-[#FDE8D3]'
                          }`}
                        >
                          {isSim ? 'Simulé ✓' : '+ Simuler'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
