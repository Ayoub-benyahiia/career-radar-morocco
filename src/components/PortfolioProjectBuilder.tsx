import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Code2,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { PortfolioProjectItem } from '../types/career';
import {
  CURATED_PORTFOLIO_PROJECTS,
  getRecommendedProjectsForSkills,
  instantiateProjectItem,
} from '../data/portfolioProjects';
import { storage } from '../db/storage';
import { getSafeExternalUrl } from '../utils/formatters';

interface PortfolioProjectBuilderProps {
  targetRoleTitle: string;
  missingSkills: string[];
  onShowToast: (message: string) => void;
}

export const PortfolioProjectBuilder: React.FC<PortfolioProjectBuilderProps> = ({
  targetRoleTitle,
  missingSkills,
  onShowToast,
}) => {
  const [activeProject, setActiveProject] = useState<PortfolioProjectItem | null>(null);
  const [storedProjects, setStoredProjects] = useState<PortfolioProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);

  // Edit link states
  const [editingLinks, setEditingLinks] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [demoInput, setDemoInput] = useState('');

  // 1. Initial load from IndexedDB
  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      try {
        const list = await storage.getPortfolioProjects();
        if (!active) return;
        setStoredProjects(list);

        if (list.length > 0) {
          // Use first stored project
          setActiveProject(list[0]);
          setRepoInput(list[0].repoUrl ?? '');
          setDemoInput(list[0].liveDemoUrl ?? '');
        } else {
          // Compute default recommendation from missing skills & target role
          const recommended = getRecommendedProjectsForSkills(missingSkills, targetRoleTitle);
          const initial = recommended[0] ?? instantiateProjectItem(CURATED_PORTFOLIO_PROJECTS[0]);
          setActiveProject(initial);
          setRepoInput(initial.repoUrl ?? '');
          setDemoInput(initial.liveDemoUrl ?? '');
          void storage.upsertPortfolioProject(initial);
        }
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    const setLoadingInitial = (val: boolean) => {
      if (active) setLoading(val);
    };

    void loadProjects();
    return () => {
      active = false;
    };
  }, [missingSkills, targetRoleTitle]);

  // Update inputs whenever activeProject changes
  useEffect(() => {
    if (activeProject) {
      setRepoInput(activeProject.repoUrl ?? '');
      setDemoInput(activeProject.liveDemoUrl ?? '');
    }
  }, [activeProject]);

  const allAvailableProjects = useMemo(() => {
    return getRecommendedProjectsForSkills(missingSkills, targetRoleTitle);
  }, [missingSkills, targetRoleTitle]);

  const handleSelectProject = async (templateId: string) => {
    // Check if we already have progress saved for this project
    const existing = storedProjects.find((p) => p.id === templateId);
    if (existing) {
      setActiveProject(existing);
    } else {
      const template = CURATED_PORTFOLIO_PROJECTS.find((p) => p.id === templateId);
      if (template) {
        const instantiated = instantiateProjectItem(template);
        setActiveProject(instantiated);
        const updatedList = await storage.upsertPortfolioProject(instantiated);
        setStoredProjects(updatedList);
      }
    }
    setShowCatalog(false);
    onShowToast('Projet sélectionné pour ton portfolio.');
  };

  const handleToggleStep = async (stepId: string) => {
    if (!activeProject) return;

    // Optimistic UI update
    const updated = {
      ...activeProject,
      steps: activeProject.steps.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    setActiveProject(updated);

    const saved = await storage.toggleProjectStep(activeProject.id, stepId);
    if (saved) {
      setActiveProject(saved);
      const list = await storage.getPortfolioProjects();
      setStoredProjects(list);
      onShowToast('Étape du projet mise à jour.');
    }
  };

  const handleSaveLinks = async () => {
    if (!activeProject) return;
    const saved = await storage.updateProjectLinks(activeProject.id, repoInput, demoInput);
    if (saved) {
      setActiveProject(saved);
      const list = await storage.getPortfolioProjects();
      setStoredProjects(list);
      setEditingLinks(false);
      onShowToast('Liens GitHub & Démo enregistrés localement.');
    }
  };

  if (loading || !activeProject) {
    return (
      <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 shadow-sm space-y-3">
        <div className="h-6 w-48 bg-[#E8E0D2] rounded-full animate-pulse" />
        <div className="h-32 bg-[#FAF7F2] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const completedStepsCount = activeProject.steps.filter((s) => s.completed).length;
  const totalStepsCount = activeProject.steps.length;
  const progressPct =
    totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;
  const isAllReady = totalStepsCount > 0 && completedStepsCount === totalStepsCount;

  const safeRepoUrl = getSafeExternalUrl(activeProject.repoUrl);
  const safeDemoUrl = getSafeExternalUrl(activeProject.liveDemoUrl);

  return (
    <div className="rounded-[28px] bg-white border border-[#E8E0D2] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2B4233] text-[#F2A86F] shadow-xs">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xs font-bold text-[#1D2A22]">
              Portfolio &amp; Project Builder
            </h2>
            <span className="text-[10px] text-[#5E6B62] block">
              Prêt pour les recruteurs au Maroc
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCatalog(!showCatalog)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2B4233] hover:text-[#1D2A22] bg-[#FAF7F2] border border-[#E8E0D2] rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors"
        >
          <span>Changer de projet</span>
          {showCatalog ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Catalog Selector Accordion */}
      {showCatalog && (
        <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3 space-y-2">
          <span className="text-[11px] font-bold text-[#1D2A22] block">
            Projets concrets adaptés à tes compétences manquantes :
          </span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
            {allAvailableProjects.map((p) => {
              const isSelected = p.id === activeProject.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProject(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2B4233] text-white border-[#2B4233]'
                      : 'bg-white border-[#E8E0D2] text-[#1D2A22] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{p.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ml-1.5 ${
                        isSelected ? 'bg-white/20 text-[#F2A86F]' : 'bg-[#FAF7F2] text-[#5E6B62]'
                      }`}
                    >
                      {p.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] block mt-0.5 truncate ${
                      isSelected ? 'text-[#C8D3CB]' : 'text-[#5E6B62]'
                    }`}
                  >
                    {p.techStack.join(' · ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Project Card */}
      <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="inline-block rounded-md bg-[#FDE8D3] px-2 py-0.5 text-[9px] font-bold text-[#D97E3E]">
              {activeProject.difficulty} · {activeProject.category}
            </span>
            <h3 className="font-display text-sm font-bold text-[#1D2A22] leading-snug">
              {activeProject.title}
            </h3>
          </div>

          {isAllReady && (
            <span className="flex items-center gap-1 rounded-full bg-[#EDF8F1] border border-[#D3ECDA] px-2 py-1 text-[10px] font-bold text-[#1F6E4A] shrink-0">
              <Award className="h-3.5 w-3.5" />
              Prêt CV !
            </span>
          )}
        </div>

        <p className="text-xs text-[#5E6B62] leading-relaxed">
          {activeProject.description}
        </p>

        {/* Moroccan Context Badge */}
        <div className="rounded-xl bg-white border border-[#E8E0D2] p-2.5 text-[11px] text-[#1D2A22] flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#D97E3E] shrink-0 mt-0.5" />
          <span className="text-[#5E6B62] leading-tight">
            <strong className="text-[#1D2A22]">Impact Marché Maroc : </strong>
            {activeProject.moroccanMarketContext}
          </span>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {activeProject.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg bg-white border border-[#E8E0D2] px-2 py-0.5 text-[10px] font-bold text-[#2B4233]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-bold text-[#1D2A22] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#1F6E4A]" />
            Checklist de Finalisation du Projet
          </span>
          <span className="font-mono text-xs font-bold text-[#2B4233] tabular-nums">
            {completedStepsCount} / {totalStepsCount} ({progressPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[#E8E0D2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2B4233] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 5 Milestones */}
        <div className="space-y-1.5 pt-1">
          {activeProject.steps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => handleToggleStep(step.id)}
              className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                step.completed
                  ? 'bg-[#FAFBF9] border-[#1F6E4A]/30 text-[#1D2A22]'
                  : 'bg-[#FAF7F2] border-[#E8E0D2] hover:bg-white text-[#1D2A22]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1F6E4A]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#5E6B62]" />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className={`text-xs block leading-snug ${
                    step.completed
                      ? 'line-through text-[#5E6B62]'
                      : 'font-semibold text-[#1D2A22]'
                  }`}
                >
                  {idx + 1}. {step.label}
                </span>
                <span className="text-[10px] text-[#5E6B62] block mt-0.5 leading-tight">
                  {step.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GitHub Repo & Live Demo Links Section */}
      <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1D2A22] flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-[#D97E3E]" />
            Liens du Projet (Pour ton CV &amp; LinkedIn)
          </span>
          <button
            type="button"
            onClick={() => setEditingLinks(!editingLinks)}
            className="text-[10px] font-semibold text-[#5E6B62] hover:text-[#1D2A22] underline cursor-pointer"
          >
            {editingLinks ? 'Fermer' : 'Éditer les liens'}
          </button>
        </div>

        {/* Quick Links Preview if set */}
        {!editingLinks && (
          <div className="flex flex-wrap items-center gap-2">
            {safeRepoUrl ? (
              <a
                href={safeRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#E8E0D2] px-2.5 py-1 text-xs font-semibold text-[#1D2A22] hover:bg-[#F2ECE1] transition-colors"
              >
                <Github className="h-3 w-3" />
                <span>Code GitHub</span>
                <ExternalLink className="h-2.5 w-2.5 text-[#5E6B62]" />
              </a>
            ) : (
              <span className="text-[10px] text-[#5E6B62] italic">
                Aucun lien GitHub renseigné
              </span>
            )}

            {safeDemoUrl ? (
              <a
                href={safeDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2B4233] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#203327] transition-colors"
              >
                <Globe className="h-3 w-3 text-[#F2A86F]" />
                <span>Démo en ligne</span>
                <ExternalLink className="h-2.5 w-2.5 text-[#F2A86F]" />
              </a>
            ) : (
              <span className="text-[10px] text-[#5E6B62] italic">
                · Aucune démo en ligne renseignée
              </span>
            )}
          </div>
        )}

        {/* Inputs View */}
        {editingLinks && (
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-[#5E6B62] block mb-1">
                Lien du dépôt GitHub :
              </label>
              <input
                type="url"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="https://github.com/votre-nom/projet"
                className="w-full rounded-xl border border-[#E8E0D2] bg-white px-3 py-1.5 text-xs text-[#1D2A22] placeholder:text-[#5E6B62]/50 focus:border-[#2B4233] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#5E6B62] block mb-1">
                Lien du déploiement en ligne (Vercel / Netlify) :
              </label>
              <input
                type="url"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="https://mon-projet.vercel.app"
                className="w-full rounded-xl border border-[#E8E0D2] bg-white px-3 py-1.5 text-xs text-[#1D2A22] placeholder:text-[#5E6B62]/50 focus:border-[#2B4233] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveLinks}
              className="w-full rounded-xl bg-[#2B4233] py-2 text-xs font-bold text-white hover:bg-[#203327] cursor-pointer transition-colors shadow-2xs"
            >
              Enregistrer mes liens
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
