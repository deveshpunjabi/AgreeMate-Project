'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomTabBar from '@/components/layout/BottomTabBar';
import AgreementWizard from '@/features/agreements/wizard/AgreementWizard';
import MeshBackground from '@/components/ui/MeshBackground';
import { useAuthStore } from '@/stores/auth.store';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Loading from './loading';

import { isAdminUser } from '@/lib/api/admin';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hydrateAuth = useAuthStore(state => state.hydrateAuth);
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const [hydrated, setHydrated] = useState(() => typeof window !== 'undefined' && !!useAuthStore.getState().accessToken);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    hydrateAuth();
    setHydrated(true);
  }, [hydrateAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirectParam}`);
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  // Administrators belong strictly in the Admin Portal (/admin) and must never see the client dashboard
  useEffect(() => {
    if (hydrated && isAuthenticated && user && isAdminUser(user)) {
      router.replace('/admin');
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Auto-logout after 15 minutes of inactivity (only while authenticated)
  useIdleLogout(hydrated && isAuthenticated);

  if (!hydrated || !isAuthenticated || (user && isAdminUser(user))) {
    return <Loading />;
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-transparent font-body text-ink-body animate-in fade-in duration-200">
      {/* Global animated mesh background */}
      <MeshBackground />

      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main content container deck aligned with sidebar floating deck */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden lg:my-3 lg:mr-3 lg:ml-3 lg:bg-white/80 lg:backdrop-blur-2xl lg:border lg:border-slate-200/70 lg:rounded-[32px] lg:shadow-xl lg:h-[calc(100vh-1.5rem)]">
        {/* Top Header */}
        <TopBar />

        {/* Dynamic page contents */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Tab Bar for Mobile */}
        <BottomTabBar />
      </div>

      {/* Agreement Wizard Modal */}
      <AgreementWizard />
    </div>
  );
}
