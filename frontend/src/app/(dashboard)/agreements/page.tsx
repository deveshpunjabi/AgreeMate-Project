'use client';

import { FileText, Plus, Search, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { agreementsApi, Agreement } from '@/lib/api/agreements';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import { useWizardStore } from '@/stores/wizard.store';
import Skeleton from '@/components/ui/Skeleton';
import AgreementDetailsModal from '@/features/agreements/AgreementDetailsModal';

const statuses = [
  ['all', 'All statuses'],
  ['draft', 'Draft'],
  ['pending_borrower_acceptance', 'Awaiting acceptance'],
  ['pending_owner_confirmation', 'Awaiting handover'],
  ['active', 'Active'],
  ['overdue', 'Overdue'],
  ['return_initiated', 'Returning'],
  ['completed', 'Completed'],
  ['disputed', 'Disputed'],
] as const;

const statusClassName: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_borrower_acceptance: 'bg-amber-50 text-amber-800 border-amber-200',
  pending_owner_confirmation: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-sky-50 text-[#0068a3] border-sky-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  return_initiated: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
};

function formatStatus(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function AgreementsPage() {
  const mode = useDashboardModeStore((state) => state.mode);
  const openWizard = useWizardStore((state) => state.openWizard);
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  const isOwner = mode === 'owner';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agreements', mode],
    queryFn: () => agreementsApi.list({ role: isOwner ? 'owner' : 'borrower', limit: 100 }),
  });

  const allAgreements = useMemo(() => data?.agreements ?? [], [data?.agreements]);

  // Auto-open modal if URL param `?id=xyz` is present
  useEffect(() => {
    if (targetId && allAgreements.length > 0) {
      const match = allAgreements.find((a) => a.id === targetId);
      if (match) {
        setSelectedAgreement(match);
      }
    }
  }, [targetId, allAgreements]);

  const agreements = allAgreements.filter((agreement) => {
    const query = search.trim().toLowerCase();
    const title = agreement.item?.title?.toLowerCase() ?? '';
    const description = agreement.item?.description?.toLowerCase() ?? '';
    const borrowerName = (agreement.borrower_name || '').toLowerCase();
    const borrowerEmail = (agreement.borrower_email || '').toLowerCase();
    const ownerName = (agreement.owner_name || '').toLowerCase();
    const ownerEmail = (agreement.owner_email || '').toLowerCase();
    const id = (agreement.id || '').toLowerCase();

    const matchesQuery =
      !query ||
      title.includes(query) ||
      description.includes(query) ||
      borrowerName.includes(query) ||
      borrowerEmail.includes(query) ||
      ownerName.includes(query) ||
      ownerEmail.includes(query) ||
      id.includes(query);

    return (status === 'all' || agreement.status === status) && matchesQuery;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-extrabold text-[#003a5e]">My agreements</h1>
          <p className="mt-1 text-pretty text-sm text-[#1e2c3a]/65">
            {isOwner ? 'Manage agreements you have created.' : 'Review agreements where you are the borrower.'}
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => openWizard()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#003a5e] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#005080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] cursor-pointer"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create agreement
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e8ecf3] bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search agreements</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by item or participant"
            className="h-10 w-full rounded-xl border border-[#e8ecf3] bg-white py-2 pl-9 pr-3 text-sm text-[#003a5e] outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-xl border border-[#e8ecf3] bg-white px-3 text-sm text-[#003a5e] outline-none focus:border-[#0ea5e9] sm:w-52">
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e8ecf3] bg-white shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-[#e8ecf3] px-6">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-5">
                <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-36" /></div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">Unable to load your agreements. Please refresh and try again.</div>
        ) : agreements.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-[#003a5e]"><FileText className="size-5" aria-hidden="true" /></span>
            <h2 className="mt-3 text-base font-semibold text-[#003a5e]">No agreements found</h2>
            <p className="mt-1 max-w-sm text-pretty text-sm leading-5 text-[#1e2c3a]/60">
              {isOwner ? 'Create an agreement when you are ready to lend an item.' : 'Agreements sent to you will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8ecf3]">
            {agreements.map((agreement) => (
              <li key={agreement.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-[#003a5e]">{agreement.item?.title || 'Untitled item'}</p>
                  <p className="mt-1 truncate text-xs font-medium text-[#1e2c3a]/65">{isOwner ? `Borrower: ${agreement.borrower_name || agreement.borrower_email}` : `Owner: ${agreement.owner_name || agreement.owner_email || 'Owner'}`}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-xs font-mono font-medium tabular-nums text-slate-500">Due {formatDate(agreement.terms?.due_date)}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName[agreement.status] || 'bg-slate-100 text-slate-700'}`}>
                    {formatStatus(agreement.status)}
                  </span>
                  
                  {/* View Contract Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedAgreement(agreement)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#003a5e] shadow-2xs transition-all hover:border-[#0ea5e9]/60 hover:bg-[#f0f8ff] hover:text-[#005080] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] cursor-pointer"
                  >
                    <Eye className="size-4 text-[#0ea5e9]" aria-hidden="true" />
                    <span>View contract</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contract Details & PDF Preview Modal */}
      <AgreementDetailsModal
        agreement={selectedAgreement}
        isOpen={Boolean(selectedAgreement)}
        onClose={() => setSelectedAgreement(null)}
      />
    </div>
  );
}
