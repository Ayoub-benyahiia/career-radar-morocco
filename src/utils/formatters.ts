import type { ApplicationStatus, JobApplication, UserProfile } from '../types/career';
import type { CareerRadarBackupPayload } from '../db/storage';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Sauvegardé',
  applied: 'Postulé',
  interview: 'Entretien',
  offer: 'Offre',
  rejected: 'Refus',
  no_response: 'Sans réponse',
};

export const WORK_MODE_LABELS: Record<string, string> = {
  all: 'Tous',
  onsite: 'Présentiel',
  hybrid_remote: 'Hybride / Remote',
  hybrid: 'Hybride',
  remote: 'Remote',
};

export const LEVEL_LABELS: Record<string, string> = {
  stage_pfe: 'Stage / PFE',
  junior: 'Junior (0-2 ans)',
};

export function formatNumberFR(n: number): string {
  return new Intl.NumberFormat('fr-MA').format(n);
}

export function formatDateFR(isoDate?: string): string {
  if (!isoDate) return 'Jamais';
  const date = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function daysSince(isoDate: string): number {
  const start = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * US-13 Smart Reminders:
 * - Auto-marks 'applied' applications >= 14 days old as 'no_response'.
 * - Counts remaining 'applied' applications >= 7 days old for the reminder banner.
 */
export function applySmartReminderRules(applications: JobApplication[]): {
  updated: JobApplication[];
  autoMarkedCount: number;
  staleReminderCount: number;
} {
  let autoMarkedCount = 0;
  let staleReminderCount = 0;

  const updated = applications.map((app) => {
    if (app.status !== 'applied') return app;
    const age = daysSince(app.date);
    if (age >= 14) {
      autoMarkedCount++;
      return { ...app, status: 'no_response' as ApplicationStatus };
    }
    if (age >= 7) {
      staleReminderCount++;
    }
    return app;
  });

  return { updated, autoMarkedCount, staleReminderCount };
}

/**
 * Validate external URL safely (http/https only) before rendering an anchor.
 */
export function getSafeExternalUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(profile: UserProfile, applications: JobApplication[]): string {
  const exportedAt = new Date().toISOString();
  const payload: CareerRadarBackupPayload = {
    version: 1,
    exportedAt,
    userProfile: { ...profile, lastBackupDate: exportedAt },
    applications,
  };
  const stamp = exportedAt.slice(0, 10);
  triggerFileDownload(
    `career-radar-backup-${stamp}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
  return exportedAt;
}

function escapeCsvCell(value?: string): string {
  const safe = (value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

export function exportApplicationsCSV(applications: JobApplication[]): void {
  const headers = ['Entreprise', 'Poste', 'Statut', 'Date', 'Lien', 'Contact RH', 'Notes'];
  const rows = applications.map((app) =>
    [
      escapeCsvCell(app.company),
      escapeCsvCell(app.role),
      escapeCsvCell(STATUS_LABELS[app.status]),
      escapeCsvCell(app.date),
      escapeCsvCell(app.url),
      escapeCsvCell(app.hrContact),
      escapeCsvCell(app.notes),
    ].join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const stamp = new Date().toISOString().slice(0, 10);
  triggerFileDownload(
    `career-radar-candidatures-${stamp}.csv`,
    csvContent,
    'text/csv;charset=utf-8'
  );
}
