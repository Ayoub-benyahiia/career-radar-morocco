import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ApplicationStatus, JobApplication } from '../types/career';
import { STATUS_LABELS } from '../utils/formatters';

interface ApplicationModalProps {
  isOpen: boolean;
  editingApp: JobApplication | null;
  prefillRole?: string;
  onClose: () => void;
  onSave: (app: JobApplication) => Promise<void>;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'no_response',
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  editingApp,
  prefillRole = '',
  onClose,
  onSave,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<ApplicationStatus>('saved');
  const [hrContact, setHrContact] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingApp) {
      setCompany(editingApp.company);
      setRole(editingApp.role);
      setUrl(editingApp.url);
      setDate(editingApp.date);
      setStatus(editingApp.status);
      setHrContact(editingApp.hrContact ?? '');
      setNotes(editingApp.notes ?? '');
    } else {
      setCompany('');
      setRole(prefillRole);
      setUrl('');
      setDate(new Date().toISOString().slice(0, 10));
      setStatus('applied');
      setHrContact('');
      setNotes('');
    }
  }, [isOpen, editingApp, prefillRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("L'entreprise et le poste sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const id =
        editingApp?.id ??
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

      await onSave({
        id,
        company: company.trim(),
        role: role.trim(),
        url: url.trim(),
        date: date || new Date().toISOString().slice(0, 10),
        status,
        hrContact: hrContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={editingApp ? 'Modifier la candidature' : 'Nouvelle candidature'}
    >
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-t-[30px] sm:rounded-[30px] bg-[#F7F3EB] border border-[#E8E0D2] shadow-2xl overflow-hidden">
        {/* Grab handle & header */}
        <div className="px-5 pt-3 pb-4 border-b border-[#E8E0D2] bg-white/60">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D6CEBF] sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#1D2A22]">
              {editingApp ? 'Modifier la candidature' : 'Ajouter une candidature'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] px-4 py-2.5 text-xs font-medium text-[#991B1B]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="app-company" className="block text-xs font-semibold text-[#1D2A22]">
              Entreprise <span className="text-[#D97E3E]">*</span>
            </label>
            <input
              id="app-company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ex: Capgemini Engineering, SQLI, OCP..."
              className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-4 py-2.5 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none focus:ring-2 focus:ring-[#2B4233]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-role" className="block text-xs font-semibold text-[#1D2A22]">
              Poste <span className="text-[#D97E3E]">*</span>
            </label>
            <input
              id="app-role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Stage PFE Développeur Full Stack"
              className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-4 py-2.5 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none focus:ring-2 focus:ring-[#2B4233]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="app-date" className="block text-xs font-semibold text-[#1D2A22]">
                Date
              </label>
              <input
                id="app-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-3 py-2.5 text-sm text-[#1D2A22] focus:border-[#2B4233] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="app-status" className="block text-xs font-semibold text-[#1D2A22]">
                Statut
              </label>
              <select
                id="app-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-3 py-2.5 text-sm text-[#1D2A22] focus:border-[#2B4233] focus:outline-none"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-url" className="block text-xs font-semibold text-[#1D2A22]">
              Lien de l&apos;offre
            </label>
            <input
              id="app-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/..."
              className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-4 py-2.5 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-hr" className="block text-xs font-semibold text-[#1D2A22]">
              Contact RH (optionnel)
            </label>
            <input
              id="app-hr"
              type="text"
              value={hrContact}
              onChange={(e) => setHrContact(e.target.value)}
              placeholder="Ex: Salma B. · rh@entreprise.ma"
              className="min-h-[46px] w-full rounded-2xl border border-[#DFD6C7] bg-white px-4 py-2.5 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-notes" className="block text-xs font-semibold text-[#1D2A22]">
              Notes (optionnel)
            </label>
            <textarea
              id="app-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Stack mentionnée, retour d'entretien, date de relance..."
              className="w-full rounded-2xl border border-[#DFD6C7] bg-white px-4 py-2.5 text-sm text-[#1D2A22] placeholder:text-[#8A948D] focus:border-[#2B4233] focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-2xl border border-[#D8CFC0] bg-white px-4 py-3 text-sm font-semibold text-[#1D2A22] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] rounded-2xl bg-[#2B4233] px-4 py-3 text-sm font-semibold text-white hover:bg-[#203327] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
