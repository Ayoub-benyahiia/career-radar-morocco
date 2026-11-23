import React from 'react';
import { Radar } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E6DFD3] flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#F7F3EB] shadow-2xl px-5 py-6 flex flex-col gap-5">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#2B4233] flex items-center justify-center text-[#F2A86F]">
              <Radar className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded-md bg-[#E8E0D2] animate-pulse" />
              <div className="h-3 w-36 rounded-md bg-[#EFE9DD] animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#EFE9DD] animate-pulse" />
        </div>

        {/* Hero forest card skeleton */}
        <div className="rounded-3xl bg-[#2B4233] p-6 text-white/90 space-y-4">
          <div className="h-3.5 w-44 rounded bg-white/15 animate-pulse" />
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-full border-8 border-white/15 animate-pulse shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="h-5 w-28 rounded bg-white/20 animate-pulse" />
              <div className="h-3.5 w-full rounded bg-white/10 animate-pulse" />
              <div className="h-3.5 w-4/5 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="h-11 w-full rounded-2xl bg-[#F2A86F]/30 animate-pulse" />
        </div>

        {/* Status text */}
        <p className="text-center text-xs font-medium text-[#5E6B62]">
          Chargement des 4 774 offres IT qualifiées en mémoire locale...
        </p>

        {/* Role cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-[#E8E0D2] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-44 rounded bg-[#EFE9DD] animate-pulse" />
                <div className="h-4 w-16 rounded bg-[#FDE8D3] animate-pulse" />
              </div>
              <div className="h-3 w-3/4 rounded bg-[#F5F0E6] animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-[#F5F0E6] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
