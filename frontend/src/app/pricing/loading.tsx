'use client';

import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <section className="relative w-full overflow-hidden bg-transparent py-16 sm:py-24 animate-window-slide-up">
      <div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6 space-y-14">
        
        {/* Header Wireframe */}
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton variant="text" className="mx-auto h-7 w-32 rounded-full bg-[#003a5e]/10" />
          <Skeleton variant="text" className="mx-auto h-12 w-4/5 max-w-2xl bg-[#003a5e]/15" />
          <Skeleton variant="text" className="mx-auto h-5 w-3/4 max-w-lg bg-[#1e2c3a]/10" />
          
          {/* Torch Switcher Pill Wireframe */}
          <div className="pt-3 flex justify-center">
            <Skeleton variant="button" className="h-14 w-80 rounded-[26px] bg-white border border-slate-200/70 shadow-sm" />
          </div>
        </div>

        {/* 🌟 Unified Deck Container Card Wireframe (Matches Pricing.tsx exact 3-card deck architecture) 🌟 */}
        <div className="rounded-[36px] bg-white/80 backdrop-blur-2xl p-4 md:p-6 border border-white/90 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            
            {/* Column 1: Starter Left Panel */}
            <div className="rounded-[28px] bg-[#eef4fa] border border-[#dce6f2] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton variant="avatar" className="h-10 w-10 rounded-2xl bg-[#003a5e]/15" />
                  <Skeleton variant="text" className="h-6 w-24 rounded-full bg-[#10b981]/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-9 w-28 bg-[#003a5e]/20" />
                  <Skeleton variant="text" className="h-12 w-full bg-[#1e2c3a]/10" />
                </div>
                <div className="space-y-3 pt-3 border-t border-[#dce6f2]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="avatar" className="h-4 w-4 rounded-full bg-[#003a5e]/20" />
                      <Skeleton variant="text" className="h-4 flex-1 bg-[#003a5e]/10" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton variant="button" className="h-12 w-full rounded-2xl bg-[#001e33]/80" />
            </div>

            {/* Column 2: Professional Center Panel */}
            <div className="rounded-[28px] bg-white border border-hairline p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton variant="avatar" className="h-10 w-10 rounded-2xl bg-[#0ea5e9]/15" />
                  <Skeleton variant="text" className="h-6 w-24 rounded-full bg-[#0ea5e9]/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-9 w-36 bg-[#003a5e]/20" />
                  <Skeleton variant="text" className="h-12 w-full bg-[#1e2c3a]/10" />
                </div>
                <div className="space-y-3 pt-3 border-t border-hairline/60">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="avatar" className="h-4 w-4 rounded-full bg-[#0ea5e9]/30" />
                      <Skeleton variant="text" className="h-4 flex-1 bg-[#003a5e]/10" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton variant="button" className="h-12 w-full rounded-2xl bg-slate-100" />
            </div>

            {/* Column 3: Organization Right Panel */}
            <div className="rounded-[28px] bg-white border border-hairline p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton variant="avatar" className="h-10 w-10 rounded-2xl bg-[#003a5e]/15" />
                  <Skeleton variant="text" className="h-6 w-24 rounded-full bg-slate-200" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-9 w-36 bg-[#003a5e]/20" />
                  <Skeleton variant="text" className="h-12 w-full bg-[#1e2c3a]/10" />
                </div>
                <div className="space-y-3 pt-3 border-t border-hairline/60">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="avatar" className="h-4 w-4 rounded-full bg-[#003a5e]/20" />
                      <Skeleton variant="text" className="h-4 flex-1 bg-[#003a5e]/10" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton variant="button" className="h-12 w-full rounded-2xl bg-slate-100" />
            </div>

          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className="mx-auto max-w-3xl space-y-4 pt-4">
          <Skeleton variant="text" className="mx-auto h-8 w-64 bg-[#003a5e]/15" />
          <div className="rounded-[26px] bg-white/85 p-6 space-y-4 shadow-xl border border-white/90">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-3 border-b border-hairline/60 last:border-b-0 flex justify-between items-center">
                <Skeleton variant="text" className="h-5 w-3/4 bg-[#003a5e]/10" />
                <Skeleton variant="avatar" className="h-4 w-4 bg-[#0ea5e9]/30" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
