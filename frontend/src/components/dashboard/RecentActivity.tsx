'use client';

import { CheckCircle2, FilePlus2, FileText, Handshake, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agreementsApi } from '@/lib/api/agreements';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import { useWizardStore } from '@/stores/wizard.store';
import Skeleton from '@/components/ui/Skeleton';

function getActivityIcon(message: string) {
  const value = message.toLowerCase();
  if (value.includes('accepted') || value.includes('signed')) return Handshake;
  if (value.includes('completed') || value.includes('returned') || value.includes('confirmed')) return CheckCircle2;
  if (value.includes('dispute') || value.includes('overdue')) return ShieldAlert;
  return FileText;
}

export default function RecentActivity() {
  const mode = useDashboardModeStore((state) => state.mode);
  const openWizard = useWizardStore((state) => state.openWizard);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', mode],
    queryFn: () => agreementsApi.getDashboardStats(mode === 'owner' ? 'owner' : 'borrower'),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm" aria-label="Loading recent activity">
        <Skeleton className="h-5 w-28 bg-slate-200" />
        {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-12 w-full bg-slate-100" />)}
      </div>
    );
  }

  const activities = data?.recentActivity ?? [];

  return (
    <div role="region" aria-label="Recent activity" className="flex min-h-[280px] flex-col rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm">
      <header className="border-b border-[#e8ecf3] pb-4">
        <h2 className="font-display text-lg font-bold text-[#003a5e]">Recent activity</h2>
        <p className="mt-1 text-pretty text-sm text-[#1e2c3a]/65">Events from your agreements.</p>
      </header>

      {activities.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-[#003a5e]">
            <FilePlus2 className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-[#003a5e]">No activity yet</h3>
          <p className="mt-1 max-w-[220px] text-pretty text-sm leading-5 text-[#1e2c3a]/60">
            {mode === 'owner'
              ? 'Create an agreement to start tracking consent and return events.'
              : 'Agreement updates will appear here once you have an active contract.'}
          </p>
          {mode === 'owner' && (
            <button
              type="button"
              onClick={() => openWizard()}
              className="mt-4 text-sm font-semibold text-[#0068a3] transition-colors duration-200 hover:text-[#003a5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Create an agreement
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-[#e8ecf3]">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.message);
            return (
              <li key={activity.id} className="flex gap-3 py-4 first:pt-3 last:pb-0">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0068a3]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-pretty text-sm font-medium leading-5 text-[#003a5e]">{activity.message}</p>
                  <time className="mt-1 block text-xs text-slate-500">{activity.time}</time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
