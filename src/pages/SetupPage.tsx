import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Search, Sparkles, X } from 'lucide-react';
import type {
  City,
  ContractType,
  ExperienceLevel,
  Skill,
  UserProfile,
  WorkMode,
} from '../types/career';

interface SetupPageProps {
  cities: City[];
  skills: Skill[];
  initialProfile: UserProfile;
  isEditing?: boolean;
  onSave: (profile: UserProfile) => Promise<void>;
  onCancel?: () => void;
}

interface StackPreset {
  name: string;
  subtitle: string;
  skillNames: string[];
}

const STACK_PRESETS: StackPreset[] = [
  {
    name: 'MERN Stack',
    subtitle: 'Web JS Full Stack',
    skillNames: ['MongoDB', 'Express', 'React', 'Node.js', 'JavaScript', 'Git'],
  },
  {
    name: 'Java Spring',
    subtitle: 'Backend Entreprise',
    skillNames: ['Java', 'Spring Boot', 'SQL', 'Git', 'Docker', 'REST API'],
  },
  {
    name: '.NET',
    subtitle: 'Écosystème Microsoft',
    skillNames: ['C#', '.NET', 'SQL Server', 'Git', 'Azure', 'REST API'],
  },
  {
    name: 'Python Data',
    subtitle: 'Analyse & BI',
    skillNames: ['Python', 'SQL', 'Pandas', 'Power BI', 'Git', 'Excel'],
  },
];

const CONTRACT_OPTIONS: ContractType[] = ['Stage', 'Alternance', 'CDI', 'CDD / Freelance'];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'stage_pfe', label: 'Stage / PFE' },
  { value: 'junior', label: 'Junior (0-2 ans)' },
];

const WORK_MODE_OPTIONS: Array<{ value: WorkMode; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'onsite', label: 'Présentiel' },
  { value: 'hybrid_remote', label: 'Hybride / Remote' },
];

export const SetupPage: React.FC<SetupPageProps> = ({
  cities,
  skills,
  initialProfile,
  isEditing = false,
  onSave,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [cityId, setCityId] = useState<number>(initialProfile.cityId);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialProfile.experienceLevel
  );
  const [contractType, setContractType] = useState<ContractType[]>(
    initialProfile.contractType.length > 0 ? initialProfile.contractType : ['Stage']
  );
  const [workMode, setWorkMode] = useState<WorkMode>(initialProfile.workMode);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(
    () => new Set(initialProfile.skillIds)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const skillIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of skills) {
      map.set(s.name.toLowerCase(), s.id);
    }
    return map;
  }, [skills]);

  const toggleContract = (contract: ContractType) => {
    setContractType((prev) => {
      if (prev.includes(contract)) {
        // Keep at least one selected contract
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== contract);
      }
      return [...prev, contract];
    });
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const applyPreset = (preset: StackPreset) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      const presetIds = preset.skillNames
        .map((n) => skillIdByName.get(n.toLowerCase()))
        .filter((id): id is number => typeof id === 'number');

      const allAlreadySelected = presetIds.every((id) => next.has(id));
      if (allAlreadySelected) {
        presetIds.forEach((id) => next.delete(id));
      } else {
        presetIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isPresetActive = (preset: StackPreset): boolean => {
    const presetIds = preset.skillNames
      .map((n) => skillIdByName.get(n.toLowerCase()))
      .filter((id): id is number => typeof id === 'number');
    return presetIds.length > 0 && presetIds.every((id) => selectedSkillIds.has(id));
  };

  const groupedSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? skills.filter(
          (s) => s.name.toLowerCase().includes(q) || s.domaine.toLowerCase().includes(q)
        )
      : skills;

    const groups = new Map<string, Skill[]>();
    for (const skill of filtered) {
      const list = groups.get(skill.domaine) ?? [];
      list.push(skill);
      groups.set(skill.domaine, list);
    }
    return Array.from(groups.entries());
  }, [skills, searchQuery]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onSave({
        ...initialProfile,
        cityId,
        experienceLevel,
        contractType,
        workMode,
        skillIds: Array.from(selectedSkillIds),
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EB]">
      {/* Top Progress Header */}
      <header className="sticky top-0 z-30 bg-[#F7F3EB]/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#E8E0D2]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                aria-label="Revenir aux critères"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#1D2A22] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : isEditing && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                aria-label="Annuler la modification"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#1D2A22] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <span className="font-mono text-xs font-semibold text-[#5E6B62] tabular-nums">
              Étape {step} / 2
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-[#2B4233] tabular-nums">
            {step === 1 ? '50%' : '100%'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-[#E8E0D2] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2B4233] transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <h1 className="mt-4 font-display text-xl font-bold text-[#1D2A22]">
          {step === 1 ? 'Ton profil candidat' : 'Quelles sont tes compétences ?'}
        </h1>
        <p className="mt-1 text-sm text-[#5E6B62]">
          {step === 1
            ? 'Ces critères filtrent tes opportunités recommandées.'
            : 'Sélectionne au moins 3 compétences pour un calcul précis.'}
        </p>
      </header>

      {/* Main Content */}
      {step === 1 ? (
        <main className="flex-1 px-5 py-6 space-y-6 pb-28">
          {/* 1. Ville cible */}
          <section className="rounded-3xl bg-white border border-[#E8E0D2] p-5 space-y-3">
            <label
              htmlFor="city-select"
              className="flex items-center gap-2 text-sm font-semibold text-[#1D2A22]"
            >
              <MapPin className="h-4 w-4 text-[#2B4233]" />
              Ville cible <span className="text-[#D97E3E]">*</span>
            </label>
            <select
              id="city-select"
              required
              value={cityId}
              onChange={(e) => setCityId(Number(e.target.value))}
              className="min-h-[48px] w-full rounded-2xl border border-[#DFD6C7] bg-[#FAF7F2] px-4 py-3 text-sm font-medium text-[#1D2A22] focus:border-[#2B4233] focus:outline-none focus:ring-2 focus:ring-[#2B4233]/15"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.offer_count} offres)
                </option>
              ))}
            </select>
            <p className="text-xs text-[#5E6B62]">
              Ton score global reste calculé sur tout le Maroc.
            </p>
          </section>

          {/* 2. Niveau d'expérience */}
          <section className="rounded-3xl bg-white border border-[#E8E0D2] p-5 space-y-3">
            <span className="block text-sm font-semibold text-[#1D2A22]">
              Niveau d&apos;expérience
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const active = experienceLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperienceLevel(opt.value)}
                    className={`min-h-[48px] rounded-2xl border px-3 py-3 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#2B4233] border-[#2B4233] text-white shadow-sm'
                        : 'bg-[#FAF7F2] border-[#E4DACB] text-[#1D2A22] hover:border-[#2B4233]/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Type de contrat (Multi-select) */}
          <section className="rounded-3xl bg-white border border-[#E8E0D2] p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-[#1D2A22]">Type de contrat</span>
              <span className="text-xs text-[#5E6B62]">Choix multiples</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {CONTRACT_OPTIONS.map((contract) => {
                const active = contractType.includes(contract);
                return (
                  <button
                    key={contract}
                    type="button"
                    onClick={() => toggleContract(contract)}
                    className={`flex min-h-[48px] items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FDE8D3] border-[#F2A86F] text-[#1D2A22] font-semibold'
                        : 'bg-[#FAF7F2] border-[#E4DACB] text-[#5E6B62] hover:text-[#1D2A22]'
                    }`}
                  >
                    <span className="truncate">{contract}</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        active
                          ? 'bg-[#2B4233] border-[#2B4233] text-white'
                          : 'border-[#CFC5B4] bg-white'
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Mode de travail */}
          <section className="rounded-3xl bg-white border border-[#E8E0D2] p-5 space-y-3">
            <span className="block text-sm font-semibold text-[#1D2A22]">Mode de travail</span>
            <div className="grid grid-cols-3 gap-2">
              {WORK_MODE_OPTIONS.map((opt) => {
                const active = workMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWorkMode(opt.value)}
                    className={`min-h-[46px] rounded-2xl border px-2 py-2.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#2B4233] border-[#2B4233] text-white shadow-sm'
                        : 'bg-[#FAF7F2] border-[#E4DACB] text-[#1D2A22] hover:border-[#2B4233]/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      ) : (
        <main className="flex-1 px-5 py-5 space-y-5 pb-32">
          {/* Section 2.1: Stack Presets (Quick Fill) */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6B62]">
              <Sparkles className="h-3.5 w-3.5 text-[#D97E3E]" />
              <span>Démarrage rapide :</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
              {STACK_PRESETS.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer min-w-[144px] ${
                      active
                        ? 'bg-[#FDE8D3] border-[#F2A86F] text-[#1D2A22] shadow-xs'
                        : 'bg-white border-[#E8E0D2] text-[#1D2A22] hover:border-[#2B4233]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold whitespace-nowrap">{preset.name}</span>
                      {active && (
                        <Check className="h-4 w-4 text-[#2B4233] stroke-[2.5] shrink-0" />
                      )}
                    </div>
                    <span className="mt-0.5 block text-[11px] text-[#5E6B62] whitespace-nowrap">
                      {preset.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2.2: Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5E6B62]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Rechercher parmi ${skills.length} skills (ex: React, Docker, SQL)...`}
              className="min-h-[48px] w-full rounded-2xl border border-[#DFD6C7] bg-white pl-11 pr-11 py-3 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none focus:ring-2 focus:ring-[#2B4233]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-[#5E6B62] hover:bg-[#F7F3EB] hover:text-[#1D2A22] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Section 2.3: Categorized Skill Toggles */}
          {groupedSkills.length === 0 ? (
            <div className="rounded-3xl bg-white border border-[#E8E0D2] p-8 text-center">
              <p className="text-sm font-medium text-[#1D2A22]">
                Aucune compétence trouvée pour « {searchQuery} ».
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-semibold text-[#2B4233] underline cursor-pointer"
              >
                Afficher toutes les compétences
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedSkills.map(([domaine, list]) => {
                const selectedInDomain = list.filter((s) => selectedSkillIds.has(s.id)).length;
                return (
                  <section
                    key={domaine}
                    className="rounded-3xl bg-white border border-[#E8E0D2] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-sm font-bold text-[#1D2A22]">{domaine}</h2>
                      <span className="font-mono text-xs text-[#5E6B62] tabular-nums">
                        {selectedInDomain}/{list.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {list.map((skill) => {
                        const selected = selectedSkillIds.has(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            aria-pressed={selected}
                            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs transition-all whitespace-nowrap cursor-pointer ${
                              selected
                                ? 'bg-[#2B4233] border-[#2B4233] text-white font-semibold shadow-xs'
                                : 'bg-[#FAF7F2] border-[#E4DACB] text-[#1D2A22] font-medium hover:border-[#2B4233]/40'
                            }`}
                          >
                            {selected && <Check className="h-3.5 w-3.5 text-[#F2A86F] stroke-[2.5]" />}
                            <span>{skill.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md bg-gradient-to-t from-[#F7F3EB] via-[#F7F3EB] to-[#F7F3EB]/85 px-5 pt-3 pb-4 pb-safe border-t border-[#E8E0D2]">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-5 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#203327] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Continuer vers mes compétences</span>
            <ArrowRight className="h-4 w-4 text-[#F2A86F]" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex flex-col shrink-0">
              <span className="font-mono text-sm font-bold text-[#1D2A22] tabular-nums">
                {selectedSkillIds.size} {selectedSkillIds.size > 1 ? 'skills' : 'skill'}
              </span>
              <span className="text-[11px] text-[#5E6B62]">
                {selectedSkillIds.size < 3 ? 'Min. 3 conseillés' : 'Prêt au calcul'}
              </span>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleFinish()}
              className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#203327] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{saving ? 'Enregistrement...' : 'Calculer mon score'}</span>
              <ArrowRight className="h-4 w-4 text-[#F2A86F]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
