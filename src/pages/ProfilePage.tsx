import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  MapPin,
  Moon,
  Pencil,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import type { MarketDataset, UserProfile } from '../types/career';
import type { StorageHealth } from '../db/storage';
import { formatDateFR, LEVEL_LABELS, WORK_MODE_LABELS } from '../utils/formatters';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface ProfilePageProps {
  dataset: MarketDataset;
  profile: UserProfile;
  applicationsCount: number;
  storageHealth: StorageHealth;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onEditProfile: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (file: File) => Promise<void>;
  onResetAll: () => Promise<void>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  dataset,
  profile,
  applicationsCount,
  storageHealth,
  theme = 'light',
  onToggleTheme,
  onEditProfile,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onResetAll,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cityName = useMemo(
    () => dataset.cities.find((c) => c.id === profile.cityId)?.name ?? 'Agadir',
    [dataset.cities, profile.cityId]
  );

  const ownedSkills = useMemo(() => {
    const ownedSet = new Set(profile.skillIds);
    return dataset.skills.filter((s) => ownedSet.has(s.id));
  }, [dataset.skills, profile.skillIds]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      await onImportJSON(file);
    }
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    try {
      await onResetAll();
      setShowResetModal(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="px-5 pt-5 pb-28 space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D2A22]">
          Mon Profil
        </h1>
        <p className="mt-0.5 text-sm text-[#5E6B62]">
          Critères de recherche, sauvegardes locales et installation PWA.
        </p>
      </header>

      {/* Section 6.1: My Profile Summary Card (inspired by reference 3-column stat profile card) */}
      <section className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 space-y-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F]">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-[#1D2A22] truncate">
                Candidat IT Maroc
              </h2>
              <p className="text-xs text-[#5E6B62] truncate">
                {profile.contractType.join(', ')} · {WORK_MODE_LABELS[profile.workMode]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#FAF7F2] border border-[#E4DACB] px-3 py-1.5 text-xs font-semibold text-[#2B4233] hover:bg-[#FDE8D3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        </div>

        {/* 3-column stat strip inspired directly by the reference card */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFE9DD] p-3 text-center">
            <MapPin className="mx-auto h-4 w-4 text-[#D97E3E] mb-1" />
            <span className="block text-xs font-bold text-[#1D2A22] truncate">{cityName}</span>
            <span className="block text-[10px] text-[#5E6B62]">Ville cible</span>
          </div>
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFE9DD] p-3 text-center">
            <Briefcase className="mx-auto h-4 w-4 text-[#2B4233] mb-1" />
            <span className="block text-xs font-bold text-[#1D2A22] truncate">
              {profile.experienceLevel === 'stage_pfe' ? 'Stage / PFE' : 'Junior'}
            </span>
            <span className="block text-[10px] text-[#5E6B62]">Niveau</span>
          </div>
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#EFE9DD] p-3 text-center">
            <span className="block font-mono text-base font-bold text-[#2B4233] leading-5 tabular-nums mb-0.5">
              {ownedSkills.length}
            </span>
            <span className="block text-xs font-bold text-[#1D2A22]">Skills</span>
            <span className="block text-[10px] text-[#5E6B62] tabular-nums">
              {applicationsCount} suivies
            </span>
          </div>
        </div>

        {/* Active skills list */}
        <div className="space-y-2 pt-1 border-t border-[#F2ECE1]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D2A22]">Compétences actives</span>
            <span className="text-[#5E6B62]">{LEVEL_LABELS[profile.experienceLevel]}</span>
          </div>

          {ownedSkills.length === 0 ? (
            <p className="text-xs text-[#5E6B62]">
              Aucune compétence sélectionnée pour l&apos;instant.
            </p>
          ) : (
            <p className="text-xs text-[#34453B] leading-relaxed">
              {ownedSkills.map((s) => s.name).join(' · ')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-4 py-3 text-sm font-semibold text-white hover:bg-[#203327] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Pencil className="h-4 w-4 text-[#F2A86F]" />
          Modifier mon profil / mes compétences
        </button>
      </section>

      {/* Section 6.2: Dark Mode Theme Switcher */}
      <section className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F]">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-[#1D2A22]">
                Thème Sombre (#111A14)
              </h2>
              <p className="text-xs text-[#5E6B62]">
                {theme === 'dark' ? 'Actif · Forêt profonde' : 'Inactif · Crème naturelle'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={onToggleTheme}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out cursor-pointer p-1 ${
              theme === 'dark' ? 'bg-[#2B4233]' : 'bg-[#E8E0D2]'
            }`}
          >
            <span className="sr-only">Activer le mode sombre</span>
            <span
              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-[#F2A86F] text-[#1D2A22] shadow-sm transition-transform duration-300 ease-in-out ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </span>
          </button>
        </div>
        <p className="text-[11px] text-[#5E6B62] leading-relaxed">
          Ambiance feutrée ardoise forêt conçue pour les sessions de travail prolongées, tout en préservant les contrastes des badges et boutons Paw &amp; Co.
        </p>
      </section>

      {/* Section 6.3: Data & Backup Management (TS-06 & US-22) */}
      <section className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-[#2B4233]" />
          <h2 className="font-display text-base font-bold text-[#1D2A22]">
            Données &amp; Sauvegardes
          </h2>
        </div>

        {/* Persistent Storage Status */}
        <div className="rounded-2xl bg-[#E6F4EC] border border-[#C3E5D2] p-3.5 flex items-start gap-2.5 text-xs text-[#1F6E4A]">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Stockage local persistant activé ({storageHealth.engine === 'indexeddb' ? 'IndexedDB' : 'LocalStorage'})
            </p>
            <p className="text-[#275A41]">
              Dernière sauvegarde : {formatDateFR(profile.lastBackupDate)}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onExportJSON}
            className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-[#FAF7F2] border border-[#E4DACB] px-4 py-3 text-sm font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] hover:border-[#F2A86F] transition-colors cursor-pointer"
          >
            <span>Exporter mes données (JSON)</span>
            <Download className="h-4 w-4 text-[#2B4233]" />
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-[#FAF7F2] border border-[#E4DACB] px-4 py-3 text-sm font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] hover:border-[#F2A86F] transition-colors cursor-pointer"
          >
            <span>Exporter mes candidatures (CSV)</span>
            <FileSpreadsheet className="h-4 w-4 text-[#2B4233]" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-[#FAF7F2] border border-[#E4DACB] px-4 py-3 text-sm font-semibold text-[#1D2A22] hover:bg-[#FDE8D3] hover:border-[#F2A86F] transition-colors cursor-pointer"
          >
            <span>Importer une sauvegarde (JSON)</span>
            <Upload className="h-4 w-4 text-[#2B4233]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
            aria-label="Importer une sauvegarde JSON"
          />
        </div>
      </section>

      {/* Section 6.3: PWA Install & Danger Zone (US-24 & US-17) */}
      <section className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="font-display text-base font-bold text-[#1D2A22]">
            Application Hors-Ligne (PWA)
          </h2>
          <p className="text-xs text-[#5E6B62] leading-relaxed">
            Installe Career Radar sur ton écran d&apos;accueil pour un accès instantané même en mode
            avion.
          </p>
        </div>

        <PWAInstallButton variant="card" />

        <div className="pt-3 border-t border-[#F2ECE1]">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#FCA5A5] bg-white px-4 py-3 text-sm font-semibold text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Réinitialiser toutes mes données
          </button>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Réinitialiser toutes les données"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#B91C1C]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1D2A22]">
                Tout réinitialiser ?
              </h3>
            </div>
            <p className="text-sm text-[#5E6B62] leading-relaxed">
              Ton profil, tes compétences et tes{' '}
              <strong className="text-[#1D2A22]">{applicationsCount} candidature(s)</strong> seront
              effacés de cet appareil. Pense à exporter un JSON avant de confirmer.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="min-h-[46px] rounded-2xl border border-[#D8CFC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1D2A22] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={() => void handleConfirmReset()}
                className="min-h-[46px] rounded-2xl bg-[#B91C1C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#991B1B] disabled:opacity-60 cursor-pointer"
              >
                {resetting ? 'Effacement...' : 'Tout effacer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
