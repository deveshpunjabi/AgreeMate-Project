'use client';

import { AlertTriangle, CheckCircle2, Clock3, FileText, Handshake } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agreementsApi } from '@/lib/api/agreements';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import Skeleton from '@/components/ui/Skeleton';

type Stat = {
  label: string;
  value: number;
  icon: typeof FileText;
  iconClassName: string;
};

export default function StatCards() {
  const mode = useDashboardModeStore((state) => state.mode);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', mode],
    queryFn: () => agreementsApi.getDashboardStats(mode === 'owner' ? 'owner' : 'borrower'),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-[#e8ecf3] bg-white p-5 shadow-sm">
            <Skeleton className="h-3 w-20 bg-slate-200" />
            <Skeleton className="h-8 w-10 bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  const stats = data?.stats;
  const active = stats?.activeAgreements ?? 0;
  const pending = stats?.pendingActions ?? 0;
  const completed = stats?.completedAgreements ?? 0;
  const disputed = stats?.disputedAgreements ?? 0;
  const total = active + pending + completed + disputed;
  const subject = mode === 'owner' ? 'Contracts created' : 'My contracts';

  const cards: Stat[] = [
    { label: subject, value: total, icon: FileText, iconClassName: 'bg-slate-100 text-[#003a5e]' },
    { label: 'Active', value: active, icon: Handshake, iconClassName: 'bg-sky-50 text-[#0068a3]' },
    { label: 'Awaiting action', value: pending, icon: Clock3, iconClassName: 'bg-amber-50 text-amber-700' },
    { label: 'Completed', value: completed, icon: CheckCircle2, iconClassName: 'bg-emerald-50 text-emerald-700' },
    { label: 'Disputed', value: disputed, icon: AlertTriangle, iconClassName: 'bg-red-50 text-red-700' },
  ];

  return (
    <div role="region" aria-label="Agreement overview" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-[#e8ecf3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-pretty text-sm font-medium text-[#1e2c3a]/70">{card.label}</p>
              <span className={`flex size-9 items-center justify-center rounded-xl ${card.iconClassName}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-extrabold tabular-nums text-[#003a5e]">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
