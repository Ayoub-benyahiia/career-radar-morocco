import React from 'react';
import { Briefcase, Plus, Radar, TrendingUp, User } from 'lucide-react';
import type { AppRoute } from '../types/career';

interface BottomNavProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onQuickAddApplication: () => void;
  staleCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeRoute,
  onNavigate,
  onQuickAddApplication,
  staleCount = 0,
}) => {
  const renderTab = (
    route: AppRoute,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    badge?: number
  ) => {
    const active = activeRoute === route;
    return (
      <button
        key={route}
        type="button"
        onClick={() => onNavigate(route)}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center min-h-[48px] px-1 transition-colors cursor-pointer ${
          active ? 'text-[#F2A86F]' : 'text-[#C8D3CB] hover:text-white'
        }`}
      >
        <div className="relative">
          <Icon className={`h-[21px] w-[21px] transition-transform ${active ? 'scale-105' : ''}`} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F2A86F] px-1 text-[10px] font-bold text-[#1D2A22] tabular-nums">
              {badge}
            </span>
          )}
        </div>
        <span className="mt-1 text-[11px] font-medium tracking-tight whitespace-nowrap">
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 pb-safe pointer-events-none">
      <nav
        aria-label="Navigation principale"
        className="pointer-events-auto relative mb-2 grid grid-cols-5 items-center h-[66px] rounded-[26px] bg-[#2B4233] px-2 shadow-[0_10px_30px_rgba(32,51,39,0.32)] border border-white/10"
      >
        {renderTab('dashboard', 'Score', Radar)}
        {renderTab('skill-gap', 'Skill Gap', TrendingUp)}

        {/* Signature raised circular Peach center Quick-Add button (inspired by reference) */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onQuickAddApplication}
            aria-label="Ajouter une candidature rapidement"
            title="Nouvelle candidature"
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#F2A86F] text-[#1D2A22] shadow-[0_8px_20px_rgba(242,168,111,0.45)] ring-4 ring-[#F7F3EB] hover:bg-[#E8985B] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {renderTab('tracker', 'Tracker', Briefcase, staleCount)}
        {renderTab('profile', 'Profil', User)}
      </nav>
    </div>
  );
};
