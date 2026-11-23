/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, WifiOff } from 'lucide-react';
import type {
  ApplicationStatus,
  AppRoute,
  JobApplication,
  UserProfile,
} from './types/career';
import {
  DEFAULT_USER_PROFILE,
  storage,
  type StorageHealth,
  validateBackupPayload,
} from './db/storage';
import { useMarketData } from './hooks/useMarketData';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { calculateMarketCoverage } from './utils/matcher';
import {
  applySmartReminderRules,
  exportApplicationsCSV,
  exportBackupJSON,
} from './utils/formatters';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { BottomNav } from './components/BottomNav';
import { ApplicationModal } from './components/ApplicationModal';
import { OnboardingPage } from './pages/OnboardingPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillGapPage } from './pages/SkillGapPage';

const CareerPlannerPage = React.lazy(() =>
  import('./pages/CareerPlannerPage').then((m) => ({ default: m.CareerPlannerPage }))
);
const TrackerPage = React.lazy(() =>
  import('./pages/TrackerPage').then((m) => ({ default: m.TrackerPage }))
);
const ProfilePage = React.lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

function CareerRadarApp() {
  const { dataset, loading: dataLoading, error: dataError, reload } = useMarketData();
  const isOnline = useOnlineStatus();

  const [hydratingLocal, setHydratingLocal] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [storageHealth, setStorageHealth] = useState<StorageHealth>({
    engine: 'indexeddb',
    persisted: false,
  });
  const [route, setRoute] = useState<AppRoute>('onboarding');
  const [staleReminderCount, setStaleReminderCount] = useState(0);
  const [autoMarkedCount, setAutoMarkedCount] = useState(0);

  // Global Application Modal state (accessible via center FAB, Tracker, and Dashboard)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [prefillRole, setPrefillRole] = useState('');

  // AI Career Planner active target title (prefilled if navigated from role card)
  const [targetTitleIdForPlanner, setTargetTitleIdForPlanner] = useState<number | undefined>(undefined);

  const handleNavigateToPlanner = (titleId?: number) => {
    setTargetTitleIdForPlanner(titleId);
    setRoute('career-planner');
  };

  // Lightweight toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 3200);
  }, []);

  // Hydrate IndexedDB (or fallback localStorage) on first boot
  useEffect(() => {
    let active = true;
    const boot = async () => {
      const health = await storage.initPersistence();
      const [loadedProfile, loadedApps] = await Promise.all([
        storage.getProfile(),
        storage.getApplications(),
      ]);

      // Apply US-13 Smart Reminder rules (>=14d auto no_response, >=7d banner count)
      const reminderResult = applySmartReminderRules(loadedApps);
      if (reminderResult.autoMarkedCount > 0) {
        await storage.saveApplications(reminderResult.updated);
      }

      if (!active) return;
      setStorageHealth(health);
      setProfile(loadedProfile);
      setApplications(reminderResult.updated);
      setStaleReminderCount(reminderResult.staleReminderCount);
      setAutoMarkedCount(reminderResult.autoMarkedCount);
      setRoute(loadedProfile.onboardingCompleted ? 'dashboard' : 'onboarding');
      setHydratingLocal(false);
    };

    void boot();
    return () => {
      active = false;
    };
  }, []);

  // Recalculate stale reminder count whenever applications change
  useEffect(() => {
    const { staleReminderCount: count } = applySmartReminderRules(applications);
    setStaleReminderCount(count);
  }, [applications]);

  // Memoized national MarketCoverage (<10ms on 4,774 offers)
  const coverage = useMemo(() => {
    if (!dataset) {
      return { score: 0, exactPct: 0, matchingOffersCount: 0, eligibleOffersCount: 0 };
    }
    return calculateMarketCoverage(dataset.offers, profile.skillIds);
  }, [dataset, profile.skillIds]);

  const handleSaveProfile = async (nextProfile: UserProfile) => {
    await storage.saveProfile(nextProfile);
    setProfile(nextProfile);
    setRoute('dashboard');
    showToast('Profil enregistré localement.');
  };

  const handleAddSkillsToProfile = async (newSkillIds: number[]) => {
    const updated: UserProfile = {
      ...profile,
      skillIds: Array.from(new Set([...profile.skillIds, ...newSkillIds])),
    };
    await storage.saveProfile(updated);
    setProfile(updated);
    showToast(`${newSkillIds.length} compétence(s) ajoutée(s) à ton profil.`);
  };

  const handleSaveApplication = async (app: JobApplication) => {
    const updated = await storage.upsertApplication(app);
    setApplications(updated);
    showToast(editingApp ? 'Candidature mise à jour.' : 'Candidature enregistrée.');
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    const updated = applications.map((app) => (app.id === id ? { ...app, status } : app));
    setApplications(updated);
    await storage.saveApplications(updated);
  };

  const handleDeleteApplication = async (id: string) => {
    const updated = await storage.deleteApplication(id);
    setApplications(updated);
    showToast('Candidature supprimée.');
  };

  const handleExportJSON = async () => {
    const exportedAt = exportBackupJSON(profile, applications);
    const updatedProfile: UserProfile = { ...profile, lastBackupDate: exportedAt };
    setProfile(updatedProfile);
    await storage.saveProfile(updatedProfile);
    showToast('Sauvegarde JSON exportée.');
  };

  const handleExportCSV = () => {
    if (applications.length === 0) {
      showToast('Aucune candidature à exporter en CSV.');
      return;
    }
    exportApplicationsCSV(applications);
    showToast('Candidatures exportées en CSV.');
  };

  const handleImportJSON = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const valid = validateBackupPayload(parsed);
      if (!valid) {
        showToast('Fichier JSON invalide ou incompatible.');
        return;
      }
      await storage.saveProfile(valid.userProfile);
      await storage.saveApplications(valid.applications);
      setProfile(valid.userProfile);
      setApplications(valid.applications);
      if (valid.userProfile.onboardingCompleted && route === 'onboarding') {
        setRoute('dashboard');
      }
      showToast(`Sauvegarde importée (${valid.applications.length} candidatures).`);
    } catch {
      showToast("Impossible de lire ce fichier de sauvegarde.");
    }
  };

  const handleResetAll = async () => {
    await storage.clearAllData();
    setProfile({ ...DEFAULT_USER_PROFILE });
    setApplications([]);
    setAutoMarkedCount(0);
    setStaleReminderCount(0);
    setRoute('onboarding');
    showToast('Toutes les données ont été réinitialisées.');
  };

  const openQuickAdd = (roleTitle = '') => {
    setEditingApp(null);
    setPrefillRole(roleTitle);
    setModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setPrefillRole('');
    setModalOpen(true);
  };

  if (dataLoading || hydratingLocal) {
    return <LoadingSkeleton />;
  }

  if (dataError || !dataset) {
    return (
      <div className="min-h-screen bg-[#E6DFD3] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-8 shadow-xl text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#1D2A22]">
            Données du marché indisponibles
          </h1>
          <p className="text-sm text-[#5E6B62]">
            {dataError || 'Impossible de charger les fichiers statiques du marché IT.'}
          </p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-5 py-3 text-sm font-semibold text-white hover:bg-[#203327] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const showBottomNav =
    route === 'dashboard' ||
    route === 'skill-gap' ||
    route === 'career-planner' ||
    route === 'tracker' ||
    route === 'profile';

  return (
    <div className="min-h-screen bg-[#E6DFD3] flex justify-center">
      {/* Centered Native-Style Mobile App Shell */}
      <div className="relative w-full max-w-md min-h-screen bg-[#F7F3EB] shadow-[0_0_50px_rgba(32,51,39,0.16)] flex flex-col">
        {/* Non-intrusive Offline Banner when disconnected */}
        {!isOnline && (
          <div
            role="status"
            className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-[#2B4233] px-4 py-2 text-xs font-medium text-[#FDE8D3]"
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Mode hors-ligne actif — Données locales utilisées</span>
          </div>
        )}

        {/* Active Screen */}
        <div className="flex-1">
          <React.Suspense fallback={<LoadingSkeleton />}>
            {route === 'onboarding' && (
              <OnboardingPage
                onComplete={() => setRoute('setup')}
                onSkip={() => setRoute('setup')}
              />
            )}

            {route === 'setup' && (
              <SetupPage
                cities={dataset.cities}
                skills={dataset.skills}
                initialProfile={profile}
                isEditing={profile.onboardingCompleted}
                onSave={handleSaveProfile}
                onCancel={() => setRoute('dashboard')}
              />
            )}

            {route === 'dashboard' && (
              <DashboardPage
                dataset={dataset}
                profile={profile}
                coverage={coverage}
                onNavigate={setRoute}
                onTrackRole={(roleTitle) => openQuickAdd(roleTitle)}
                onNavigateToPlanner={handleNavigateToPlanner}
              />
            )}

            {route === 'skill-gap' && (
              <SkillGapPage
                dataset={dataset}
                profile={profile}
                baseCoverage={coverage}
                onAddSkillsToProfile={handleAddSkillsToProfile}
                onNavigate={setRoute}
              />
            )}

            {route === 'career-planner' && (
              <CareerPlannerPage
                dataset={dataset}
                profile={profile}
                initialTargetTitleId={targetTitleIdForPlanner}
                onNavigate={setRoute}
                onShowToast={showToast}
              />
            )}

            {route === 'tracker' && (
              <TrackerPage
                dataset={dataset}
                profile={profile}
                applications={applications}
                staleReminderCount={staleReminderCount}
                autoMarkedCount={autoMarkedCount}
                onAddNew={() => openQuickAdd()}
                onEdit={openEditModal}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteApplication}
                onExportJSON={() => void handleExportJSON()}
                onImportJSON={handleImportJSON}
                onShowToast={showToast}
              />
            )}

            {route === 'profile' && (
              <ProfilePage
                dataset={dataset}
                profile={profile}
                applicationsCount={applications.length}
                storageHealth={storageHealth}
                onEditProfile={() => setRoute('setup')}
                onExportJSON={() => void handleExportJSON()}
                onExportCSV={handleExportCSV}
                onImportJSON={handleImportJSON}
                onResetAll={handleResetAll}
              />
            )}
          </React.Suspense>
        </div>

        {/* Curved Dark Forest Green Bottom Navigation Bar */}
        {showBottomNav && (
          <BottomNav
            activeRoute={route}
            onNavigate={setRoute}
            onQuickAddApplication={() => openQuickAdd()}
            staleCount={staleReminderCount}
          />
        )}

        {/* Global Add/Edit Application Modal */}
        <ApplicationModal
          isOpen={modalOpen}
          editingApp={editingApp}
          prefillRole={prefillRole}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveApplication}
        />

        {/* Toast feedback */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-[#203327] px-4 py-2.5 text-xs font-semibold text-white shadow-lg border border-white/10 max-w-[90vw]"
          >
            <CheckCircle2 className="h-4 w-4 text-[#F2A86F] shrink-0" />
            <span className="truncate">{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CareerRadarApp />
    </ErrorBoundary>
  );
}
