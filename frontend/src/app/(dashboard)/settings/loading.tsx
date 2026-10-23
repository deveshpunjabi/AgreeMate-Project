'use client';

import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-window-slide-up w-full">
      {/* Header Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[22px] p-6 shadow-xl space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-6 w-32 bg-[#003a5e]/15" />
          <Skeleton variant="text" className="h-3.5 w-60 bg-[#1e2c3a]/10" />
        </div>
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-white/60 border border-hairline/80 rounded-xl w-fit">
          <Skeleton variant="button" className="h-8 w-24 rounded-lg bg-[#003a5e]/20" />
          <Skeleton variant="button" className="h-8 w-20 rounded-lg bg-slate-100" />
        </div>
      </div>

      {/* Settings Panel Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[22px] p-6 md:p-8 shadow-xl space-y-6 divide-y divide-hairline/60">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pt-5 first:pt-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="avatar" className="h-8 w-8 rounded-lg shrink-0 bg-[#0ea5e9]/20" />
              <div className="space-y-1.5">
                <Skeleton variant="text" className="h-4 w-32 bg-[#003a5e]/15" />
                <Skeleton variant="text" className="h-3 w-48 bg-[#1e2c3a]/10" />
              </div>
            </div>
            <Skeleton variant="text" className="h-6 w-12 rounded-full shrink-0 bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
