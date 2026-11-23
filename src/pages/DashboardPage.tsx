import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  ChevronRight,
  Globe,
  Info,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AppRoute,
  MarketCoverageResult,
  MarketDataset,
  MatchedJobRole,
  UserProfile,
} from '../types/career';
import { getTopMatchingJobs } from '../utils/matcher';
import { formatNumberFR, WORK_MODE_LABELS } from '../utils/formatters';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface DashboardPageProps {
  dataset: MarketDataset;
  profile: UserProfile;
  coverage: MarketCoverageResult;
  onNavigate: (route: AppRoute) => void;
  onTrackRole: (roleTitle: string) => void;
  onNavigateToPlanner?: (titleId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  dataset,
  profile,
  coverage,
  onNavigate,
  onTrackRole,
  onNavigateToPlanner,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [includeNational, setIncludeNational] = useState(false);

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

  const currentCityName = cityMap.get(profile.cityId) ?? 'Agadir';
  const primaryContract = profile.contractType[0] ?? 'Stage';

  const topJobsOutput = useMemo(
    () =>
      getTopMatchingJobs(dataset.offers, dataset.titles, dataset.cities, profile, {
        includeNational,
        limit: 5,
      }),
    [dataset.offers, dataset.titles, dataset.cities, profile, includeNational]
  );

  // SVG Gauge math
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(100, Math.max(0, coverage.score)) / 100) * circumference;

  const needsMoreSkills = coverage.score < 30 || profile.skillIds.length < 3;

  return (
    <div className="px-5 pt-5 pb-28 space-y-6">
      {/* Section 3.1: Compact Top Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D2A22]">
            Bonjour
          </h1>
          <button
            type="button"
            onClick={() => onNavigate('setup')}
            className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6B62] hover:text-[#2B4233] transition-colors cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-[#D97E3E] shrink-0" />
            <span className="truncate">
              {currentCityName} · {primaryContract}
              {profile.contractType.length > 1 ? ` +${profile.contractType.length - 1}` : ''}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            aria-label="Transparence des données"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#2B4233] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Section 3.2: Hero Market Coverage Card (US-04) — Inspired by reference Forest Green card */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#2B4233] p-6 text-white shadow-md">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#F2A86F]/12" />
        <div className="pointer-events-none absolute -left-8 -bottom-12 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-[#E8E0D2]">
              Compatibilité Marché National
            </h2>
            <span className="font-mono text-xs text-[#F2A86F] tabular-nums whitespace-nowrap">
              {profile.skillIds.length} skills actifs
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Radial Gauge */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="rgba(247,243,235,0.16)"
                  strokeWidth="10"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="#F2A86F"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold leading-none text-white tabular-nums">
                  {coverage.score}%
                </span>
                <span className="mt-1 font-mono text-[10px] text-[#C8D3CB] tabular-nums">
                  {coverage.score} / 100
                </span>
              </div>
            </div>

            {/* Plain-language explanation */}
            <div className="space-y-2 min-w-0">
              <p className="text-sm text-[#F7F3EB] leading-relaxed">
                Tu réponds à <strong className="text-[#F2A86F]">≥ 50%</strong> des critères
                techniques de{' '}
                <strong className="font-mono text-white tabular-nums">
                  {formatNumberFR(coverage.matchingOffersCount)}
                </strong>{' '}
                offres sur{' '}
                <span className="font-mono tabular-nums">
                  {formatNumberFR(coverage.eligibleOffersCount)}
                </span>{' '}
                offres qualifiées au Maroc.
              </p>
            </div>
          </div>

          {/* CTA inside hero card */}
          <button
            type="button"
            onClick={() => onNavigate('skill-gap')}
            className="flex min-h-[48px] w-full items-center justify-between rounded-2xl bg-[#F2A86F] px-5 py-3 text-sm font-bold text-[#1D2A22] hover:bg-[#EAA064] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Comment augmenter ce score ?</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* AI Career Planner Highlight Banner */}
      <button
        type="button"
        onClick={() => onNavigate('career-planner')}
        className="w-full flex items-center justify-between p-4 rounded-[26px] bg-white border border-[#E8E0D2] shadow-sm hover:border-[#F2A86F]/60 active:scale-[0.99] transition-all cursor-pointer text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F] shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-bold text-[#1D2A22]">
                AI Career Planner
              </span>
              <span className="rounded-full bg-[#FDE8D3] px-2 py-0.5 text-[9px] font-bold text-[#D97E3E]">
                Nouveau
              </span>
            </div>
            <p className="text-[11px] text-[#5E6B62] mt-0.5 leading-snug">
              Feuille de route 4-8 semaines avec jalons d'apprentissage &amp; portfolio.
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[#5E6B62] group-hover:text-[#1D2A22] shrink-0" />
      </button>

      {/* Section 3.3: Quick Action Banner (if score < 30% or skills < 3) */}
      {needsMoreSkills && (
        <section className="rounded-2xl bg-[#FDE8D3] border border-[#F2A86F]/60 p-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#D97E3E]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1D2A22] leading-snug">
              Ajoute encore quelques compétences clés pour débloquer plus d&apos;offres compatibles.
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('setup')}
                className="text-xs font-bold text-[#2B4233] underline underline-offset-2 cursor-pointer"
              >
                Compléter mes skills
              </button>
              <span className="text-[#B89F88]" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => onNavigate('skill-gap')}
                className="text-xs font-bold text-[#2B4233] underline underline-offset-2 cursor-pointer"
              >
                Simuler le ROI
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section 3.4: Top 5 Matching Roles / Opportunities (US-05) */}
      <section className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1D2A22]">
              Top 5 des postes faits pour toi
            </h2>
            <p className="text-xs text-[#5E6B62] mt-0.5">
              Filtre : {includeNational ? 'Tout le Maroc' : currentCityName} ·{' '}
              {profile.experienceLevel === 'stage_pfe' ? 'Stage / PFE' : 'Junior'}
            </p>
          </div>
        </div>

        {/* Interactive Scope Toggle Control (City vs National) */}
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white border border-[#E8E0D2] p-1.5">
          <button
            type="button"
            onClick={() => setIncludeNational(false)}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              !includeNational
                ? 'bg-[#2B4233] text-white'
                : 'text-[#5E6B62] hover:text-[#1D2A22]'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{currentCityName}</span>
          </button>
          <button
            type="button"
            onClick={() => setIncludeNational(true)}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              includeNational
                ? 'bg-[#2B4233] text-white'
                : 'text-[#5E6B62] hover:text-[#1D2A22]'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Inclure tout le Maroc</span>
          </button>
        </div>

        {!includeNational && topJobsOutput.localMatchCount < 5 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] px-4 py-3 text-xs text-[#5E6B62]">
            <span>
              Seulement {topJobsOutput.localMatchCount} poste(s) actif(s) à {currentCityName} avec
              ces filtres.
            </span>
            <button
              type="button"
              onClick={() => setIncludeNational(true)}
              className="font-bold text-[#2B4233] underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Élargir au Maroc
            </button>
          </div>
        )}

        {/* Role Cards List */}
        {topJobsOutput.roles.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#E8E0D2] p-6 text-center space-y-3">
            <p className="text-sm font-medium text-[#1D2A22]">
              Aucun poste trouvé pour cette combinaison de critères.
            </p>
            <button
              type="button"
              onClick={() => setIncludeNational(true)}
              className="min-h-[44px] rounded-xl bg-[#2B4233] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              Inclure tout le Maroc
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {topJobsOutput.roles.map((role: MatchedJobRole) => {
              const matchTone =
                role.matchPct >= 65
                  ? 'text-[#1F6E4A]'
                  : role.matchPct >= 40
                    ? 'text-[#B45309]'
                    : 'text-[#5E6B62]';

              const contractsText = role.contracts.slice(0, 2).join(' / ');
              const modeText = role.workModes
                .slice(0, 2)
                .map((m) => WORK_MODE_LABELS[m] ?? m)
                .join(', ');

              return (
                <article
                  key={role.titleId}
                  className="rounded-3xl bg-white border border-[#E8E0D2] p-4 space-y-3 transition-colors hover:border-[#D5C9B6]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-[#1D2A22] leading-snug">
                        {role.title}
                      </h3>
                      {/* Clean unboxed metadata with typographic separators */}
                      <p className="mt-1 text-xs text-[#5E6B62]">
                        {contractsText}
                        <span aria-hidden="true"> · </span>
                        {modeText}
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{role.totalRoleOffers}</span>{' '}
                        offres
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-base font-bold tabular-nums ${matchTone}`}>
                        {role.matchPct}%
                      </span>
                      <span className="block text-[10px] font-medium text-[#5E6B62]">match</span>
                    </div>
                  </div>

                  {/* Skills requis breakdown */}
                  <div className="pt-2 border-t border-[#F2ECE1] space-y-1.5">
                    <span className="block text-[11px] font-semibold text-[#5E6B62]">
                      Skills requis :
                    </span>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs">
                      {role.ownedSkillIds.map((id) => (
                        <span
                          key={`owned-${id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#1F6E4A]"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          {skillMap.get(id)}
                        </span>
                      ))}
                      {role.missingSkillIds.map((id) => (
                        <span key={`missing-${id}`} className="text-[#858F88]">
                          {skillMap.get(id)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[11px] text-[#5E6B62] truncate">
                      {role.cityNames.join(', ')}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onNavigateToPlanner ? onNavigateToPlanner(role.titleId) : onNavigate('career-planner')}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[#2B4233] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#203327] active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                        title="Créer un plan de carrière pour ce poste"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#F2A86F]" />
                        <span>Plan IA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onTrackRole(role.title)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] px-3 py-1.5 text-xs font-semibold text-[#2B4233] hover:bg-[#FDE8D3] hover:border-[#F2A86F] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>Suivre</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Data Transparency Modal (US-15) */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Transparence des données"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F]">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1D2A22]">
                  Transparence des données
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-[#1D2A22] leading-relaxed">
              Données issues de{' '}
              <strong className="font-mono tabular-nums">
                {formatNumberFR(dataset.meta.total_analyzed_offers)}
              </strong>{' '}
              offres IT au Maroc ({dataset.meta.period}). Calcul 100% local sur ton appareil.
              Limite : biais vers les grandes entreprises de Casablanca et Rabat.
            </p>

            <div className="rounded-2xl bg-white border border-[#E8E0D2] p-3.5 space-y-1.5 text-xs text-[#5E6B62]">
              <div className="flex justify-between">
                <span>Offres qualifiées (≥ 3 skills)</span>
                <span className="font-mono font-bold text-[#1D2A22] tabular-nums">
                  {formatNumberFR(dataset.meta.eligible_offers)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Compétences référencées</span>
                <span className="font-mono font-bold text-[#1D2A22] tabular-nums">
                  {dataset.meta.total_skills}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Villes couvertes</span>
                <span className="font-mono font-bold text-[#1D2A22] tabular-nums">
                  {dataset.meta.total_cities}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="min-h-[46px] w-full rounded-2xl bg-[#2B4233] py-3 text-sm font-semibold text-white hover:bg-[#203327] transition-colors cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
