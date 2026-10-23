'use client';

import { CalendarDays, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useWizardStore } from '@/stores/wizard.store';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import RecentActivity from '@/components/dashboard/RecentActivity';
import RecentAgreementsTable from '@/components/dashboard/RecentAgreementsTable';
import StatCards from '@/components/dashboard/StatCards';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const mode = useDashboardModeStore((state) => state.mode);
  const openWizard = useWizardStore((state) => state.openWizard);
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const isOwner = mode === 'owner';

  return (
    <div key={mode} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">

      <div className="flex flex-col gap-5 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <CalendarDays className="size-4 text-[#0ea5e9]" aria-hidden="true" />
            {formattedDate}
          </p>
          <div>
            <h1 className="text-balance font-display text-3xl font-extrabold text-[#003a5e]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 max-w-xl text-pretty text-sm leading-6 text-[#1e2c3a]/70">
              {isOwner
                ? 'Track active mutual agreements and manage items you have shared with others.'
                : 'Review agreements sent to you and follow the return details for your active contracts.'}
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => openWizard()}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#003a5e] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#005080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create agreement
          </button>
        )}
      </div>

      <StatCards />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentAgreementsTable />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
