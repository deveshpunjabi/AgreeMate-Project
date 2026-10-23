'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { isAdminUser } from '@/lib/api/admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, hydrateAuth, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(() => typeof window !== 'undefined' && !!useAuthStore.getState().accessToken);

  useEffect(() => {
    hydrateAuth();
    setHydrated(true);
  }, [hydrateAuth]);

  const isAuthenticated = Boolean(accessToken);
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (hydrated) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=%2Fadmin');
      } else if (!isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  const handleAdminLogout = async () => {
    await logout();
  };

  // While authenticating / hydrating, show a clean, brand-consistent loading screen
  if (!hydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#003a5e] text-white shadow-lg mb-4 animate-pulse">
          <ShieldCheck className="size-7 text-[#0ea5e9]" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#003a5e]">
          <Loader2 className="size-4 animate-spin text-[#0ea5e9]" />
          <span>Verifying Administrative Authority...</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-mono">
          AgreeMate Executive Command Gateway
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-body selection:bg-sky-500/20 selection:text-[#003a5e]">
      {/* Executive Command Center Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e8ecf3] bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Command Center Tag */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#003a5e] to-sky-600 text-white shadow-sm">
                <ShieldCheck className="size-5 text-sky-200" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-base tracking-tight text-[#003a5e]">
                    Agree<span className="text-[#0ea5e9]">Mate</span>
                  </span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0068a3]">
                    Executive Admin
                  </span>
                </div>
                <p className="text-[10.5px] font-medium text-slate-500 hidden sm:block">
                  Master Ledger &amp; Platform Telemetry
                </p>
              </div>
            </Link>
          </div>

          {/* Subtle System Status Chip */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span>All Systems Operational</span>
          </div>

          {/* Right User & Actions */}
          <div className="flex items-center gap-3">
            {/* Admin User Badge */}
            <div className="flex items-center gap-2.5">
              <div className="size-8.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-xs font-bold text-[#003a5e] shadow-xs">
                {(user?.full_name || user?.email || 'AD').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#003a5e] leading-tight truncate max-w-[150px]">
                  {user?.full_name || 'System Admin'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                  Administrator
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleAdminLogout}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer shadow-xs"
              title="Sign out of Admin Portal"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Command Center Content Pane */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#e8ecf3] bg-white px-4 sm:px-8 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 AgreeMate Technologies · Executive Administration Gateway</span>
          <span className="text-slate-400">Section 65B Electronic Record Trail &amp; Mutual Consent Governance</span>
        </div>
      </footer>
    </div>
  );
}
