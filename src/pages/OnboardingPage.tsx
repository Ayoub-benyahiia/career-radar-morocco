import React, { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Radar, ShieldCheck, TrendingUp } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  accentNote: string;
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    title: 'Mesure ta vraie valeur sur le marché IT marocain',
    subtitle:
      "Basé sur l'analyse réelle de 10 782 offres d'emploi au Maroc (Stage, PFE, Junior).",
    accentNote: '4 774 offres qualifiées analysées localement',
  },
  {
    id: 1,
    title: 'Découvre exactement quelles compétences apprendre',
    subtitle:
      'Identifie les technologies qui augmentent le plus ton score de compatibilité.',
    accentNote: 'Simulateur ROI en temps réel (< 100 ms)',
  },
  {
    id: 2,
    title: 'Suis tes candidatures 100% hors-ligne',
    subtitle:
      'Gère tes postulations sans connexion internet. Tes données restent privées sur ton téléphone.',
    accentNote: 'Stockage local sécurisé · Export JSON & CSV',
  },
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, onSkip }) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const isLast = index === SLIDES.length - 1;
  const current = SLIDES[index];

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex((prev) => Math.min(prev + 1, SLIDES.length - 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -40 && index < SLIDES.length - 1) {
      setIndex((prev) => prev + 1);
    } else if (delta > 40 && index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-6 py-6 bg-[#F7F3EB]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Section 1.1: Top Bar */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F] shadow-sm">
            <Radar className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[#1D2A22] whitespace-nowrap">
            Career Radar
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="min-h-[44px] px-3 text-sm font-medium text-[#5E6B62] hover:text-[#1D2A22] transition-colors whitespace-nowrap cursor-pointer"
        >
          Passer
        </button>
      </header>

      {/* Section 1.2: 3-Slide Interactive Carousel */}
      <main className="my-auto py-8 flex flex-col items-center text-center">
        {/* Visual Illustration Card inspired by the reference's organic forest/peach aesthetic */}
        <div className="w-full max-w-[320px] rounded-[32px] bg-[#2B4233] p-6 shadow-lg text-left relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#F2A86F]/15" />
          <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-white/5" />

          {index === 0 && (
            <div className="relative space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#C8D3CB]">Marché IT · Maroc</span>
                <span className="font-mono text-xs font-semibold text-[#F2A86F] tabular-nums">
                  10 782 offres
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="rgba(247,243,235,0.16)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="#F2A86F"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * 0.36}
                    />
                  </svg>
                  <span className="absolute font-mono text-lg font-bold text-white tabular-nums">
                    64%
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="font-display text-base font-bold text-white leading-snug">
                    Score objectif &amp; local
                  </p>
                  <p className="text-xs text-[#C8D3CB] leading-relaxed">
                    Stage, PFE et Junior comparés à tes vraies compétences.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-[#F7F3EB] px-4 py-3 flex items-center justify-between text-[#1D2A22]">
                <span className="text-xs font-semibold">Full Stack JS · Agadir</span>
                <span className="font-mono text-xs font-bold text-[#1F6E4A] tabular-nums">
                  82% match
                </span>
              </div>
            </div>
          )}

          {index === 1 && (
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#C8D3CB]">Simulation ROI</span>
                <TrendingUp className="h-4 w-4 text-[#F2A86F]" />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <div>
                  <span className="block text-[11px] text-[#C8D3CB]">Actuel</span>
                  <span className="font-mono text-xl font-bold text-white tabular-nums">24%</span>
                </div>
                <ArrowRight className="h-5 w-5 text-[#F2A86F]" />
                <div className="text-right">
                  <span className="block text-[11px] text-[#F2A86F]">Simulé</span>
                  <span className="font-mono text-xl font-bold text-[#F2A86F] tabular-nums">
                    38%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-2xl bg-[#FDE8D3] px-4 py-2.5 flex items-center justify-between text-[#1D2A22]">
                  <div>
                    <span className="block text-xs font-bold">Docker</span>
                    <span className="text-[11px] text-[#5E6B62]">Débloque +214 offres</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#2B4233] tabular-nums">
                    +4.5 pts
                  </span>
                </div>
                <div className="rounded-2xl bg-[#F7F3EB] px-4 py-2.5 flex items-center justify-between text-[#1D2A22]">
                  <div>
                    <span className="block text-xs font-bold">TypeScript</span>
                    <span className="text-[11px] text-[#5E6B62]">Débloque +186 offres</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1F6E4A] tabular-nums">
                    +3.9 pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {index === 2 && (
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#C8D3CB]">Mode Hors-Ligne</span>
                <ShieldCheck className="h-4 w-4 text-[#F2A86F]" />
              </div>
              <div className="space-y-2.5">
                <div className="rounded-2xl bg-[#F7F3EB] p-3.5 text-[#1D2A22]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">OCP Digital Solutions</span>
                    <span className="text-[11px] font-semibold text-[#1F6E4A]">Entretien</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#5E6B62]">
                    Stage PFE Full Stack · Enregistré localement
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FDE8D3] p-3.5 text-[#1D2A22]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#2B4233] shrink-0" />
                    <span className="text-xs font-semibold">
                      Rappels automatiques J+7 &amp; export JSON
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Copy */}
        <div className="mt-8 max-w-xs space-y-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D2A22] leading-tight">
            {current.title}
          </h1>
          <p className="text-sm text-[#5E6B62] leading-relaxed">{current.subtitle}</p>
          <p className="pt-1 text-xs font-medium text-[#2B4233]">{current.accentNote}</p>
        </div>
      </main>

      {/* Section 1.3: Bottom Controls */}
      <footer className="space-y-5 pb-safe">
        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Étapes de présentation">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Diapositive ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-8 bg-[#2B4233]' : 'w-2.5 bg-[#D4CBB9] hover:bg-[#B8AE9A]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#203327] active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>{isLast ? 'Configurer mon profil' : 'Suivant'}</span>
          <ArrowRight className="h-4 w-4 text-[#F2A86F]" />
        </button>
      </footer>
    </div>
  );
};
