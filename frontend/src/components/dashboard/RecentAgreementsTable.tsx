'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, ExternalLink, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agreementsApi, Agreement } from '@/lib/api/agreements';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import { useWizardStore } from '@/stores/wizard.store';
import Skeleton from '@/components/ui/Skeleton';
import AgreementDetailsModal from '@/features/agreements/AgreementDetailsModal';

type DisplayStatus = 'Active' | 'Pending' | 'Overdue' | 'Returning' | 'Completed' | 'Disputed';

const statusStyles: Record<DisplayStatus, string> = {
  Active: 'bg-sky-50 text-[#0068a3] border-sky-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  Returning: 'bg-slate-100 text-slate-700 border-slate-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Disputed: 'bg-red-50 text-red-700 border-red-200',
};

function getDisplayStatus(status: string): DisplayStatus {
  switch (status) {
    case 'active': return 'Active';
    case 'overdue': return 'Overdue';
    case 'return_initiated': return 'Returning';
    case 'completed': return 'Completed';
    case 'disputed': return 'Disputed';
    default: return 'Pending';
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'No due date'
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function RecentAgreementsTable() {
  const mode = useDashboardModeStore((state) => state.mode);
  const openWizard = useWizardStore((state) => state.openWizard);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recent-agreements', mode],
    queryFn: () => agreementsApi.list({ role: mode === 'owner' ? 'owner' : 'borrower', limit: 5 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm" aria-label="Loading contracts">
        <Skeleton className="h-5 w-40 bg-slate-200" />
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full bg-slate-100" />)}
      </div>
    );
  }

  const allAgreements = data?.agreements ?? [];
  const agreements = allAgreements.slice(0, 5);
  const isOwner = mode === 'owner';

  return (
    <>
      <div role="region" aria-label="Recent contracts" className="rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:p-7">
        <header className="flex flex-col gap-3 border-b border-[#e8ecf3] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#003a5e]">
              {isOwner ? 'Recent contracts' : 'My contracts & invites'}
            </h2>
            <p className="mt-1 text-pretty text-sm text-[#1e2c3a]/65">
              {isOwner ? 'Agreements you have created.' : 'Agreements and invitations where you are the borrower.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/agreements"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0068a3] hover:text-[#003a5e] transition-colors"
            >
              <span>View all contracts</span>
              <ExternalLink className="size-3.5" />
            </Link>
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
              {agreements.length} shown
            </span>
          </div>
        </header>

        {agreements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-[#003a5e]">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-[#003a5e]">
              {isOwner ? 'No contracts yet' : 'No active contracts'}
            </h3>
            <p className="mt-1 max-w-sm text-pretty text-sm leading-5 text-[#1e2c3a]/60">
              {isOwner
                ? 'Create an agreement when you are ready to lend an item.'
                : 'Accepted agreements will appear here after the owner confirms the handover.'}
            </p>
            {isOwner && (
              <button
                type="button"
                onClick={() => openWizard()}
                className="mt-4 rounded-xl bg-[#003a5e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#005080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
              >
                Create agreement
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr className="border-b border-[#e8ecf3] text-left">
                  <th className="px-3 py-3 text-xs font-medium text-slate-500">Item</th>
                  <th className="px-3 py-3 text-xs font-medium text-slate-500">{isOwner ? 'Borrower' : 'Owner'}</th>
                  <th className="px-3 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-3 py-3 text-xs font-medium text-slate-500">Due date</th>
                  <th className="px-3 py-3 text-xs font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf3]">
                {agreements.map((agreement) => {
                  const displayStatus = getDisplayStatus(agreement.status);
                  const counterparty = isOwner
                    ? agreement.borrower_name || agreement.borrower_email
                    : agreement.owner_name || agreement.owner_email || 'Owner';
                  return (
                    <tr key={agreement.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#003a5e]">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                          </span>
                          <span className="max-w-[200px] truncate text-sm font-medium text-[#003a5e]">
                            {agreement.item?.title || 'Untitled item'}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-4 text-sm text-[#1e2c3a]/70">{counterparty}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[displayStatus]}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm tabular-nums text-[#1e2c3a]/70">{formatDate(agreement.terms?.due_date)}</td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAgreement(agreement)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#003a5e] shadow-2xs transition-colors hover:bg-slate-100 hover:text-[#005080] cursor-pointer"
                          >
                            <Eye className="size-3.5 text-[#0ea5e9]" />
                            <span>View contract</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Details & PDF Preview Modal */}
      <AgreementDetailsModal
        agreement={selectedAgreement}
        isOpen={Boolean(selectedAgreement)}
        onClose={() => setSelectedAgreement(null)}
      />
    </>
  );
}
