'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect, useState } from 'react';
import MeshBackground from '@/components/ui/MeshBackground';
import Loading from './loading';
import { Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrateAuth = useAuthStore(state => state.hydrateAuth);
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    hydrateAuth();
    setHydrated(true);
  }, [hydrateAuth]);

  useEffect(() => {
    const manualLogout = typeof window !== 'undefined' && sessionStorage.getItem('am_manual_logout') === 'true';
    const canRedirect = pathname === '/login' || pathname === '/signup';
    if (hydrated && isAuthenticated && canRedirect && !manualLogout) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-canvas px-4 py-12 animate-in fade-in duration-300">
      {/* Same mesh background as the app shell */}
      <MeshBackground />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-hairline bg-white/80 text-xs font-semibold text-ink hover:text-primary hover:border-primary-border transition-colors"
      >
        <Home className="w-4 h-4" />
        Home
      </Link>

      {/* Form card — glass-card style matching the app */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_40px_rgba(0,58,94,0.06)] rounded-[28px] p-8 sm:p-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          {/* Brand Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link href="/" className="flex items-center gap-2.5 group transition-all duration-300 hover:-translate-y-0.5">
              <img src="/apple-touch-icon.png" alt="Logo" className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform" />
              <span className="font-display text-[22px] font-bold tracking-tight text-[#003a5e] leading-none">
                Agree<span className="font-serif italic text-[#0ea5e9] font-normal">Mate</span>
              </span>
            </Link>
            <span className="text-[9px] text-[#1e2c3a]/50 font-bold uppercase tracking-[0.2em] mt-2">
              Create. Agree. Trust.
            </span>
          </div>

          {/* Content form */}
          {children}
        </div>
      </div>
    </div>
  );
}
