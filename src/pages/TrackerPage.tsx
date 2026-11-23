import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import type {
  ApplicationStatus,
  InterviewPrepGuide,
  InterviewQuestionItem,
  JobApplication,
  MarketDataset,
  UserProfile,
} from '../types/career';
import {
  daysSince,
  formatDateFR,
  getSafeExternalUrl,
  STATUS_LABELS,
} from '../utils/formatters';
import { generateInterviewPrep } from '../utils/interviewPrep';

interface TrackerPageProps {
  dataset: MarketDataset;
  profile: UserProfile;
  applications: JobApplication[];
  staleReminderCount: number;
  autoMarkedCount: number;
  onAddNew: () => void;
  onEdit: (app: JobApplication) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onExportJSON: () => void;
  onImportJSON: (file: File) => Promise<void>;
  onShowToast?: (message: string) => void;
}

type FilterKey = 'all' | 'saved' | 'applied' | 'interview' | 'result';

const RESULT_STATUSES: ApplicationStatus[] = ['offer', 'rejected', 'no_response'];

const ALL_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'no_response',
];

function statusSelectStyle(status: ApplicationStatus): string {
  switch (status) {
    case 'offer':
      return 'bg-[#E6F4EC] text-[#1F6E4A] border-[#B7DFC8]';
    case 'interview':
      return 'bg-[#FDE8D3] text-[#9A4B16] border-[#F2A86F]';
    case 'applied':
      return 'bg-[#EAF0EC] text-[#2B4233] border-[#CBD8CF]';
    case 'rejected':
      return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
    case 'no_response':
      return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
    default:
      return 'bg-[#FAF7F2] text-[#5E6B62] border-[#E4DACB]';
  }
}

export const TrackerPage: React.FC<TrackerPageProps> = ({
  dataset,
  profile,
  applications,
  staleReminderCount,
  autoMarkedCount,
  onAddNew,
  onEdit,
  onStatusChange,
  onDelete,
  onExportJSON,
  onImportJSON,
  onShowToast,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<JobApplication | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Interview Prep state
  const [selectedPrepApp, setSelectedPrepApp] = useState<JobApplication | null>(null);
  const [prepGuide, setPrepGuide] = useState<InterviewPrepGuide | null>(null);
  const [prepTab, setPrepTab] = useState<'tech' | 'rh' | 'questions_to_ask' | 'checklist'>('tech');
  const [checkedChecklistIndices, setCheckedChecklistIndices] = useState<Set<number>>(() => new Set());
  const [loadingPrep, setLoadingPrep] = useState(false);

  const counts = useMemo(() => {
    let saved = 0;
    let applied = 0;
    let interview = 0;
    let offers = 0;
    let rejected = 0;
    let result = 0;

    for (const app of applications) {
      if (app.status === 'saved') saved++;
      else if (app.status === 'applied') applied++;
      else if (app.status === 'interview') interview++;
      else if (app.status === 'offer') {
        offers++;
        result++;
      } else if (app.status === 'rejected') {
        rejected++;
        result++;
      } else if (app.status === 'no_response') {
        result++;
      }
    }

    return {
      all: applications.length,
      saved,
      applied,
      interview,
      offers,
      rejected,
      result,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (activeFilter === 'all') return applications;
    if (activeFilter === 'result') {
      return applications.filter((a) => RESULT_STATUSES.includes(a.status));
    }
    return applications.filter((a) => a.status === activeFilter);
  }, [applications, activeFilter]);

  const toggleDetails = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      await onImportJSON(file);
    }
  };

  const handleOpenPrepModal = async (app: JobApplication) => {
    setSelectedPrepApp(app);
    setLoadingPrep(true);
    setPrepTab('tech');
    try {
      const userSkillNames = dataset.skills
        .filter((s) => profile.skillIds.includes(s.id))
        .map((s) => s.name);
      const guide = await generateInterviewPrep(app.role, app.company, userSkillNames);
      setPrepGuide(guide);
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleCopyPrep = () => {
    if (!prepGuide) return;
    const lines = [
      `# Guide de Préparation d'Entretien — ${prepGuide.roleTitle} @ ${prepGuide.company}`,
      `Généré le ${new Date(prepGuide.generatedAt).toLocaleDateString('fr-FR')} via Career Radar`,
      '',
      '## 1. Questions Techniques Clés :',
      ...prepGuide.questions
        .filter((q) => q.category === 'technique')
        .flatMap((q, idx) => [
          `### Q${idx + 1} : ${q.question}`,
          `Points clés à citer :`,
          ...q.keyPointsToCover.map((pt) => `  - ${pt}`),
          q.sampleAnswerHint ? `Conseil : ${q.sampleAnswerHint}` : '',
          '',
        ]),
      '## 2. Questions RH & Mises en Situation :',
      ...prepGuide.questions
        .filter((q) => q.category === 'culture_rh')
        .flatMap((q, idx) => [
          `### Q${idx + 1} : ${q.question}`,
          ...q.keyPointsToCover.map((pt) => `  - ${pt}`),
          '',
        ]),
      '## 3. Questions Stratégiques à Poser au Recruteur :',
      ...prepGuide.questions
        .filter((q) => q.category === 'question_au_recruteur')
        .flatMap((q, idx) => [
          `### Q${idx + 1} : ${q.question}`,
          ...q.keyPointsToCover.map((pt) => `  - ${pt}`),
          '',
        ]),
      '## 4. Checklist Le Jour J :',
      ...prepGuide.checklistDayJ.map((item) => `- [ ] ${item}`),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    onShowToast?.('Guide de préparation copié dans le presse-papiers.');
  };

  const toggleChecklistDayJ = (idx: number) => {
    setCheckedChecklistIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const FILTER_TABS: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: 'all', label: 'Tout', count: counts.all },
    { key: 'saved', label: 'Sauvegardé', count: counts.saved },
    { key: 'applied', label: 'Postulé', count: counts.applied },
    { key: 'interview', label: 'Entretien', count: counts.interview },
    { key: 'result', label: 'Résultat', count: counts.result },
  ];

  return (
    <div className="px-5 pt-5 pb-28 space-y-5">
      {/* Section 5.1: Header & Action Bar */}
      <header className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D2A22]">
              Mes Candidatures
            </h1>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#1F6E4A]">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Hors-ligne prêt · Stockage privé</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-[#2B4233] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#203327] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#F2A86F]" />
            Ajouter
          </button>
        </div>

        {/* Backup Bar (US-22) */}
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white border border-[#E8E0D2] px-3.5 py-2.5">
          <div className="min-w-0 text-xs text-[#5E6B62]">
            <span className="block truncate">
              Dernière sauvegarde :{' '}
              <strong className="text-[#1D2A22]">
                {formatDateFR(profile.lastBackupDate)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onExportJSON}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-xl bg-[#FAF7F2] border border-[#E4DACB] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-xl bg-[#FAF7F2] border border-[#E4DACB] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Importer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFileSelected(e)}
              className="hidden"
              aria-label="Importer une sauvegarde JSON"
            />
          </div>
        </div>
      </header>

      {/* Sleek Application Statistics Bar (Phase 5) */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white border border-[#E8E0D2] p-3 text-center space-y-0.5 shadow-xs">
          <span className="text-[10px] font-semibold text-[#5E6B62] block truncate">Total</span>
          <span className="font-mono text-base font-bold text-[#1D2A22] tabular-nums">
            {counts.all}
          </span>
          <span className="text-[9px] text-[#8A948D] block truncate">postulations</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E8E0D2] p-3 text-center space-y-0.5 shadow-xs">
          <span className="text-[10px] font-semibold text-[#5E6B62] block truncate">Postulé</span>
          <span className="font-mono text-base font-bold text-[#2B4233] tabular-nums">
            {counts.applied}
          </span>
          <span className="text-[9px] text-[#8A948D] block truncate">en attente</span>
        </div>

        <div className="rounded-2xl bg-[#FDE8D3] border border-[#F2A86F] p-3 text-center space-y-0.5 shadow-xs relative overflow-hidden">
          <span className="text-[10px] font-bold text-[#9A4B16] block truncate">Entretiens</span>
          <span className="font-mono text-base font-bold text-[#9A4B16] tabular-nums">
            {counts.interview}
          </span>
          <span className="text-[9px] font-semibold text-[#D97E3E] block truncate">à préparer</span>
        </div>

        <div className="rounded-2xl bg-[#E6F4EC] border border-[#B7DFC8] p-3 text-center space-y-0.5 shadow-xs">
          <span className="text-[10px] font-bold text-[#1F6E4A] block truncate">Offres</span>
          <span className="font-mono text-base font-bold text-[#1F6E4A] tabular-nums">
            {counts.offers}
          </span>
          <span className="text-[9px] font-semibold text-[#1F6E4A] block truncate">reçues</span>
        </div>
      </div>

      {/* Section 5.2: Status Filter Tabs with Counters (US-20) */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1"
        role="tablist"
        aria-label="Filtrer les candidatures par statut"
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveFilter(tab.key)}
              className={`min-h-[42px] shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                active
                  ? 'bg-[#2B4233] border-[#2B4233] text-white shadow-xs'
                  : 'bg-white border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Section 5.3: In-App Smart Reminders Banner (US-13) */}
      {(staleReminderCount > 0 || autoMarkedCount > 0) && (
        <section className="rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/40 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#78350F] leading-relaxed">
            {staleReminderCount > 0 && (
              <p className="font-semibold">
                {staleReminderCount} candidature{staleReminderCount > 1 ? 's' : ''} sans réponse
                depuis plus de 7 jours. Pense à relancer !
              </p>
            )}
            {autoMarkedCount > 0 && (
              <p>
                {autoMarkedCount} candidature{autoMarkedCount > 1 ? 's' : ''} de plus de 14 jours
                passée{autoMarkedCount > 1 ? 's' : ''} automatiquement en « Sans réponse ».
              </p>
            )}
          </div>
        </section>
      )}

      {/* Section 5.4: Application Cards List */}
      {applications.length === 0 ? (
        <section className="relative overflow-hidden rounded-[32px] bg-white border border-[#E8E0D2] p-8 text-center space-y-5 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F2A86F]/15" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#2B4233]/5" />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FAF7F2] text-[#2B4233] border border-[#E8E0D2] shadow-xs">
            <Briefcase className="h-9 w-9 text-[#D97E3E]" />
          </div>

          <div className="relative space-y-2 max-w-xs mx-auto">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE8D3] px-3 py-1 text-[11px] font-bold text-[#D97E3E]">
              <Sparkles className="h-3 w-3" />
              Suivi 100% Hors-Ligne
            </span>
            <h2 className="font-display text-lg font-bold text-[#1D2A22]">
              Aucune candidature enregistrée
            </h2>
            <p className="text-xs text-[#5E6B62] leading-relaxed">
              Organise tes postulations, active les alertes de relance automatique à 7 jours et prépare tes entretiens techniques.
            </p>
          </div>

          <div className="relative pt-1">
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#203327] active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#F2A86F] stroke-[2.5]" />
              Ajouter ma première candidature
            </button>
          </div>
        </section>
      ) : filteredApplications.length === 0 ? (
        <section className="rounded-[28px] bg-white border border-[#E8E0D2] p-7 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#5E6B62] border border-[#E8E0D2]">
            <Briefcase className="h-5 w-5 text-[#5E6B62]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1D2A22]">
              Aucune opportunité dans « {FILTER_TABS.find((t) => t.key === activeFilter)?.label} »
            </p>
            <p className="text-xs text-[#5E6B62]">
              Change de filtre ou ajoute une nouvelle candidature pour la suivre ici.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="text-xs font-semibold text-[#2B4233] underline cursor-pointer hover:text-[#1D2A22]"
            >
              Voir toutes ({counts.all})
            </button>
            <span className="text-[#E8E0D2]">·</span>
            <button
              type="button"
              onClick={onAddNew}
              className="text-xs font-bold text-[#D97E3E] cursor-pointer hover:underline"
            >
              + Ajouter une offre
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const safeUrl = getSafeExternalUrl(app.url);
            const hasExtra = Boolean(app.notes || app.hrContact);
            const isExpanded = expandedIds.has(app.id);
            const ageDays = daysSince(app.date);
            const isStale = app.status === 'applied' && ageDays >= 7;

            return (
              <article
                key={app.id}
                className="rounded-3xl bg-white border border-[#E8E0D2] p-4 space-y-3"
              >
                {/* Top row: Company + 1-tap Status Dropdown */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-[#1D2A22] truncate">
                      {app.company}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-[#34453B] leading-snug">
                      {app.role}
                    </p>
                  </div>

                  <select
                    aria-label={`Statut pour ${app.company}`}
                    value={app.status}
                    onChange={(e) =>
                      void onStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
                    className={`min-h-[36px] shrink-0 rounded-xl border px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${statusSelectStyle(
                      app.status
                    )}`}
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & age metadata line */}
                <div className="flex items-center justify-between text-xs text-[#5E6B62]">
                  <span>
                    Ajouté le {formatDateFR(app.date)}
                    {isStale && (
                      <span className="font-semibold text-[#B45309]"> · J+{ageDays} à relancer</span>
                    )}
                  </span>
                </div>

                {/* Collapsible Notes & HR Contact */}
                {hasExtra && isExpanded && (
                  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFE9DD] p-3 space-y-1.5 text-xs">
                    {app.hrContact && (
                      <p className="text-[#1D2A22]">
                        <span className="font-semibold text-[#5E6B62]">Contact RH : </span>
                        {app.hrContact}
                      </p>
                    )}
                    {app.notes && (
                      <p className="text-[#1D2A22] whitespace-pre-line leading-relaxed">
                        <span className="font-semibold text-[#5E6B62]">Notes : </span>
                        {app.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2ECE1]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[#FAF7F2] px-2.5 py-1.5 text-xs font-semibold text-[#2B4233] hover:bg-[#FDE8D3] transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Offre
                      </a>
                    )}
                    {app.status === 'interview' && (
                      <button
                        type="button"
                        onClick={() => void handleOpenPrepModal(app)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2B4233] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#203327] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        title="Préparer l'entretien technique pour ce poste"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#F2A86F]" />
                        <span>Prép. Entretien</span>
                      </button>
                    )}
                    {hasExtra && (
                      <button
                        type="button"
                        onClick={() => toggleDetails(app.id)}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[#FAF7F2] px-2.5 py-1.5 text-xs font-semibold text-[#5E6B62] hover:text-[#1D2A22] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Masquer notes <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Notes / RH <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(app)}
                      aria-label={`Modifier ${app.company}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5E6B62] hover:bg-[#FAF7F2] hover:text-[#1D2A22] transition-colors cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteApp(app)}
                      aria-label={`Supprimer ${app.company}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5E6B62] hover:bg-[#FEE2E2] hover:text-[#991B1B] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-[#1D2A22]">
              Supprimer cette candidature ?
            </h3>
            <p className="text-sm text-[#5E6B62] leading-relaxed">
              Tu es sur le point de supprimer{' '}
              <strong className="text-[#1D2A22]">
                {confirmDeleteApp.company} — {confirmDeleteApp.role}
              </strong>
              . Cette action est irréversible.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                className="min-h-[46px] rounded-2xl border border-[#D8CFC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1D2A22] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteApp.id;
                  setConfirmDeleteApp(null);
                  await onDelete(id);
                }}
                className="min-h-[46px] rounded-2xl bg-[#B91C1C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#991B1B] cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Interview Prep Modal (Phase 5) */}
      {selectedPrepApp && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Préparation d'entretien pour ${selectedPrepApp.company}`}
        >
          <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] bg-[#F7F3EB] border border-[#E8E0D2] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-[#E8E0D2] bg-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE8D3] px-2.5 py-0.5 text-[10px] font-bold text-[#D97E3E]">
                    <Sparkles className="h-3 w-3" />
                    Interview Prep Intelligence
                  </span>
                  <span className="text-[10px] text-[#5E6B62] font-mono">100% Hors-ligne</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#1D2A22] truncate">
                  {selectedPrepApp.company}
                </h3>
                <p className="text-xs font-medium text-[#5E6B62] truncate">
                  {selectedPrepApp.role}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPrep}
                  title="Copier toutes les questions"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E4DACB] text-[#2B4233] hover:bg-[#FDE8D3] transition-colors cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrepApp(null);
                    setPrepGuide(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E4DACB] text-[#5E6B62] hover:text-[#1D2A22] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-5 py-2.5 bg-[#FAF7F2] border-b border-[#E8E0D2]">
              <button
                type="button"
                onClick={() => setPrepTab('tech')}
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  prepTab === 'tech'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                Questions Tech ({prepGuide?.questions.filter((q) => q.category === 'technique').length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setPrepTab('rh')}
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  prepTab === 'rh'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                Culture &amp; RH ({prepGuide?.questions.filter((q) => q.category === 'culture_rh').length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setPrepTab('questions_to_ask')}
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  prepTab === 'questions_to_ask'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                À Poser ({prepGuide?.questions.filter((q) => q.category === 'question_au_recruteur').length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setPrepTab('checklist')}
                className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  prepTab === 'checklist'
                    ? 'bg-[#2B4233] text-white shadow-xs'
                    : 'bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22]'
                }`}
              >
                Checklist Jour J
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingPrep ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-6 w-36 bg-[#E8E0D2] rounded-full animate-pulse mx-auto" />
                  <p className="text-xs text-[#5E6B62]">
                    Analyse des exigences techniques pour {selectedPrepApp.role}...
                  </p>
                </div>
              ) : !prepGuide ? (
                <div className="py-8 text-center text-xs text-[#5E6B62]">
                  Guide introuvable pour ce poste.
                </div>
              ) : (
                <>
                  {/* Tab 1: Technical Questions */}
                  {prepTab === 'tech' && (
                    <div className="space-y-3.5">
                      {prepGuide.questions
                        .filter((q) => q.category === 'technique')
                        .map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-2xl bg-white border border-[#E8E0D2] p-4 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDE8D3] text-[10px] font-bold text-[#D97E3E]">
                                {idx + 1}
                              </span>
                              <h4 className="font-display text-xs font-bold text-[#1D2A22] leading-snug">
                                {q.question}
                              </h4>
                            </div>

                            <div className="pl-7 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F6E4A] block">
                                Points clés à citer en entretien :
                              </span>
                              <ul className="space-y-1">
                                {q.keyPointsToCover.map((pt, pIdx) => (
                                  <li
                                    key={pIdx}
                                    className="flex items-start gap-1.5 text-xs text-[#5E6B62] leading-relaxed"
                                  >
                                    <span className="text-[#F2A86F] font-bold">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                              {q.sampleAnswerHint && (
                                <p className="mt-2 text-[11px] italic text-[#2B4233] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E0D2]">
                                  💡 <strong>Conseil :</strong> {q.sampleAnswerHint}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tab 2: HR & Situational Questions */}
                  {prepTab === 'rh' && (
                    <div className="space-y-3.5">
                      {prepGuide.questions
                        .filter((q) => q.category === 'culture_rh')
                        .map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-2xl bg-white border border-[#E8E0D2] p-4 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4EC] text-[10px] font-bold text-[#1F6E4A]">
                                {idx + 1}
                              </span>
                              <h4 className="font-display text-xs font-bold text-[#1D2A22] leading-snug">
                                {q.question}
                              </h4>
                            </div>

                            <div className="pl-7 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6B62] block">
                                Ce que le recruteur évalue :
                              </span>
                              <ul className="space-y-1">
                                {q.keyPointsToCover.map((pt, pIdx) => (
                                  <li
                                    key={pIdx}
                                    className="flex items-start gap-1.5 text-xs text-[#5E6B62] leading-relaxed"
                                  >
                                    <span className="text-[#2B4233] font-bold">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                              {q.sampleAnswerHint && (
                                <p className="mt-2 text-[11px] italic text-[#2B4233] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E0D2]">
                                  💡 <strong>Astuce :</strong> {q.sampleAnswerHint}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tab 3: Questions to ask the recruiter */}
                  {prepTab === 'questions_to_ask' && (
                    <div className="space-y-3.5">
                      <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3 text-xs text-[#5E6B62] leading-relaxed">
                        Poser des questions pertinentes en fin d'entretien prouve votre maturité
                        technique et votre intérêt réel pour la mission.
                      </div>
                      {prepGuide.questions
                        .filter((q) => q.category === 'question_au_recruteur')
                        .map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-2xl bg-white border border-[#E8E0D2] p-4 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] text-[10px] font-bold text-[#2B4233] border border-[#E8E0D2]">
                                {idx + 1}
                              </span>
                              <h4 className="font-display text-xs font-bold text-[#1D2A22] leading-snug">
                                « {q.question} »
                              </h4>
                            </div>
                            <div className="pl-7">
                              <ul className="space-y-1">
                                {q.keyPointsToCover.map((pt, pIdx) => (
                                  <li
                                    key={pIdx}
                                    className="flex items-start gap-1.5 text-xs text-[#5E6B62]"
                                  >
                                    <span className="text-[#F2A86F] font-bold">✔</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tab 4: Day J Checklist */}
                  {prepTab === 'checklist' && (
                    <div className="space-y-3">
                      <div className="rounded-2xl bg-[#E6F4EC] border border-[#B7DFC8] p-3 text-xs text-[#1F6E4A]">
                        Cochez chaque élément avant le jour de l'entretien pour être prêt à 100%.
                      </div>
                      <div className="space-y-2">
                        {prepGuide.checklistDayJ.map((item, idx) => {
                          const isChecked = checkedChecklistIndices.has(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleChecklistDayJ(idx)}
                              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#EAF0EC] border-[#CBD8CF] text-[#1F6E4A]'
                                  : 'bg-white border-[#E8E0D2] text-[#1D2A22] hover:border-[#2B4233]/40'
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                  isChecked
                                    ? 'bg-[#2B4233] border-[#2B4233] text-white'
                                    : 'border-[#CBD8CF] bg-white'
                                }`}
                              >
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <span
                                className={`text-xs leading-relaxed ${
                                  isChecked ? 'line-through text-[#5E6B62]' : 'font-medium'
                                }`}
                              >
                                {item}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-[#E8E0D2] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyPrep}
                className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#FAF7F2] border border-[#E4DACB] px-4 py-2 text-xs font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] hover:border-[#F2A86F] transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copier le guide complet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPrepApp(null);
                  setPrepGuide(null);
                }}
                className="flex min-h-[44px] items-center justify-center rounded-2xl bg-[#2B4233] px-6 py-2 text-xs font-semibold text-white hover:bg-[#203327] transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
