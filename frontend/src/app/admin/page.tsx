'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Server,
  Database,
  Lock,
  Calendar,
  Loader2,
  Check,
  X,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import { adminApi, AdminUser, AdminAuditLog } from '@/lib/api/admin';
import { Agreement, agreementsApi } from '@/lib/api/agreements';
import { useAuthStore } from '@/stores/auth.store';
import { isAdminUser } from '@/lib/api/admin';
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils/format';
import AgreementDetailsModal from '@/features/agreements/AgreementDetailsModal';

type AdminTab = 'overview' | 'agreements' | 'users' | 'disputes' | 'audit';

export default function DedicatedAdminDashboardPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [agreementSearch, setAgreementSearch] = useState('');
  const [agreementStatusFilter, setAgreementStatusFilter] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  // User status toggling action state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dispute resolution dialog state
  const [resolvingAgreement, setResolvingAgreement] = useState<Agreement | null>(null);
  const [resolveTargetStatus, setResolveTargetStatus] = useState<'completed' | 'active' | 'cancelled'>('completed');
  const [resolveNotes, setResolveNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const isAdmin = isAdminUser(user);

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Fetch KPI Stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  // 2. Fetch Charts Data
  const {
    data: charts,
    isLoading: isChartsLoading,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: () => adminApi.getCharts(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  // 3. Fetch User Directory
  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminApi.getUsers({ search: userSearch || undefined, limit: 100 }),
    enabled: isAdmin,
    staleTime: 30 * 1000,
  });

  // 4. Fetch Platform Master Agreements
  const {
    data: agreementsData,
    isLoading: isAgreementsLoading,
    refetch: refetchAgreements,
  } = useQuery({
    queryKey: ['admin-agreements', agreementStatusFilter, agreementSearch],
    queryFn: () =>
      adminApi.getAgreements({
        status_filter: agreementStatusFilter || undefined,
        search: agreementSearch || undefined,
        limit: 100,
      }),
    enabled: isAdmin,
    staleTime: 30 * 1000,
  });

  // 5. Fetch Platform Audit Logs
  const {
    data: auditData,
    isLoading: isAuditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs({ limit: 50 }),
    enabled: isAdmin,
    staleTime: 30 * 1000,
  });

  // 6. Fetch System Health Telemetry
  const {
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    enabled: isAdmin,
    staleTime: 20 * 1000,
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchCharts();
    refetchUsers();
    refetchAgreements();
    refetchAudit();
    refetchHealth();
  };

  const handleViewAgreement = (ag: Agreement) => {
    setSelectedAgreement(ag);
    setIsAgreementModalOpen(true);
  };

  // Toggle user active / suspended status
  const handleToggleUserStatus = async (targetUser: AdminUser) => {
    try {
      setUpdatingUserId(targetUser.id);
      const updatedStatus = !targetUser.is_active;
      await adminApi.updateUserStatus(targetUser.id, updatedStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      showFeedback(
        `User ${targetUser.email} status updated to ${updatedStatus ? 'Active' : 'Suspended'}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      showFeedback(err.response?.data?.detail || 'Failed to update user status.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Resolve dispute handler
  const handleConfirmDisputeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAgreement) return;
    if (!resolveNotes.trim()) {
      showFeedback('Please provide detailed resolution notes for the legal audit trail.', 'error');
      return;
    }

    try {
      setIsResolving(true);
      await agreementsApi.resolveDispute(resolvingAgreement.id, resolveTargetStatus, resolveNotes.trim());
      queryClient.invalidateQueries({ queryKey: ['admin-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-charts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setResolvingAgreement(null);
      setResolveNotes('');
      showFeedback(`Dispute on agreement ${resolvingAgreement.id.slice(0, 8)} successfully resolved.`, 'success');
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      showFeedback(err.response?.data?.detail || 'Failed to resolve dispute.', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  // Status badge styling map matching AgreeMate brand tokens
  const statusBadgeStyle: Record<string, string> = {
    active: 'bg-sky-50 text-sky-700 border-sky-200',
    return_initiated: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending_borrower_acceptance: 'bg-amber-50 text-amber-700 border-amber-200',
    pending_owner_confirmation: 'bg-blue-50 text-[#0068a3] border-blue-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    disputed: 'bg-red-50 text-red-700 border-red-200 font-bold',
  };

  const maxMonthCount = Math.max(...(charts?.monthly_velocity?.map((p) => p.count) || [1]), 1);
  const totalVelocityContracts = (charts?.monthly_velocity || []).reduce((acc, curr) => acc + curr.count, 0);

  // Filter agreements for Risk & Disputes Desk
  const disputedOrOverdueAgreements = (agreementsData?.agreements || []).filter(
    (ag) => ag.status === 'disputed' || ag.status === 'overdue'
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Toast notification */}
      {actionNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-2 ${
            actionNotice.type === 'success'
              ? 'bg-[#003a5e] text-white border-sky-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="size-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="size-4 text-red-300" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#003a5e] tracking-tight">
            Executive Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform operations, live agreement lifecycle, and registered account governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-xs">
            <Calendar className="size-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isStatsFetching}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#003a5e] hover:bg-[#005080] text-white px-3.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isStatsFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Refined Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Platform Asset Valuation */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Platform Asset Valuation
            </span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {isStatsLoading ? '...' : formatCurrency(stats?.total_valuation || 0)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Declared value of active assets
          </p>
        </div>

        {/* Card 2: Master Agreements */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Master Agreements
            </span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-[#0068a3] border border-sky-100">
              <FileText className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {isStatsLoading ? '...' : stats?.total_agreements ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#0068a3] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              {stats?.active_loans ?? 0} active
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats?.completed_agreements ?? 0} completed · {stats?.pending_agreements ?? 0} awaiting
          </p>
        </div>

        {/* Card 3: Registered Users */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Registered Accounts
            </span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {isStatsLoading ? '...' : stats?.total_users ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Verified
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Active borrower and lender roster
          </p>
        </div>

        {/* Card 4: Risk & Dispute Exposure */}
        <div className={`rounded-2xl border bg-white p-5 shadow-xs transition-all ${
          ((stats?.overdue_agreements ?? 0) + (stats?.disputed_agreements ?? 0)) > 0
            ? 'border-rose-300 hover:border-rose-400'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${
              ((stats?.overdue_agreements ?? 0) + (stats?.disputed_agreements ?? 0)) > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}>
              Risk &amp; Mediation
            </span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-display text-2xl sm:text-3xl font-bold ${
              ((stats?.overdue_agreements ?? 0) + (stats?.disputed_agreements ?? 0)) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {isStatsLoading ? '...' : (stats?.overdue_agreements ?? 0) + (stats?.disputed_agreements ?? 0)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
              ((stats?.disputed_agreements ?? 0) > 0)
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {stats?.disputed_agreements ?? 0} disputes
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats?.overdue_agreements ?? 0} overdue contracts
          </p>
        </div>

      </div>

      {/* Main Admin Tabbed Deck */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        
        {/* Sleek Segmented Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 bg-slate-50/60 p-3 sm:p-4 gap-3">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#003a5e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agreements')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'agreements'
                  ? 'bg-[#003a5e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="size-3.5" />
              <span>Contracts</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'agreements' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {agreementsData?.total ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#003a5e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="size-3.5" />
              <span>Users</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {usersData?.total ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'disputes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="size-3.5" />
              <span>Risk &amp; Disputes</span>
              {disputedOrOverdueAgreements.length > 0 && (
                <span className="text-[11px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-md font-bold">
                  {disputedOrOverdueAgreements.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#003a5e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* Contextual Filters / Search */}
          <div className="flex items-center gap-2">
            {activeTab === 'users' && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
            )}

            {activeTab === 'agreements' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={agreementStatusFilter}
                  onChange={(e) => setAgreementStatusFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0ea5e9] focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending_borrower_acceptance">Pending Borrower</option>
                  <option value="pending_owner_confirmation">Pending Handover</option>
                  <option value="return_initiated">Return Initiated</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="disputed">Disputed</option>
                </select>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={agreementSearch}
                    onChange={(e) => setAgreementSearch(e.target.value)}
                    placeholder="Search ID, title, counterparty..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0ea5e9] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Visual Analytics Row: Bar Chart (7 Cols) + Status Donut/Bars (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Monthly Velocity Bar Chart */}
              <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-[#003a5e]">
                        <BarChart3 className="size-4 text-[#0ea5e9]" />
                      </span>
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#003a5e]">
                          Monthly Agreement Velocity
                        </h3>
                        <p className="text-xs text-slate-500">Executed lending contracts over the last 6 months</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0068a3] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                      Last 6 Months
                    </span>
                  </div>

                  <div className="mt-6">
                    {isChartsLoading ? (
                      <div className="flex h-48 items-center justify-center text-xs text-slate-400">
                        <Loader2 className="size-5 animate-spin text-[#0ea5e9] mr-2" />
                        <span>Loading metrics...</span>
                      </div>
                    ) : totalVelocityContracts === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                        <BarChart3 className="size-8 text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-700">No contracts executed in this period yet</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                          When users create and sign lending agreements, their monthly execution volume and valuation will automatically graph here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-48 w-full flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2">
                          {(charts?.monthly_velocity || []).map((pt, idx) => {
                            const heightPct = pt.count > 0 ? Math.max(Math.round((pt.count / maxMonthCount) * 100), 8) : 0;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                {/* Hover Tooltip */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#003a5e] text-white text-[11px] py-1 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 font-medium">
                                  <strong>{pt.count} contracts</strong> · {formatCurrency(pt.valuation)}
                                </div>

                                {/* Bar Pillar */}
                                <div className="w-full max-w-[36px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
                                  {heightPct > 0 ? (
                                    <div
                                      style={{ height: `${heightPct}%` }}
                                      className="w-full bg-gradient-to-t from-[#003a5e] to-[#0ea5e9] transition-all duration-500 group-hover:brightness-110 rounded-t-md"
                                    />
                                  ) : (
                                    <div className="w-full h-1 bg-slate-200" />
                                  )}
                                </div>

                                {/* Month Label */}
                                <span className="mt-2 text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                                  {pt.month}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Aggregated Platform Activity</span>
                  <span className="font-semibold text-slate-700">{totalVelocityContracts} Total Agreements Logged</span>
                </div>
              </div>

              {/* Right: Lifecycle Distribution */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-[#0ea5e9]">
                        <PieChartIcon className="size-4" />
                      </span>
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#003a5e]">
                          Lifecycle Distribution
                        </h3>
                        <p className="text-xs text-slate-500">Breakdown by current contract stage</p>
                      </div>
                    </div>
                  </div>

                  {/* Distribution List */}
                  <div className="mt-4 space-y-2.5">
                    {[
                      { label: 'Active Loans', count: stats?.active_loans ?? 0, color: 'bg-sky-500', text: 'text-sky-700' },
                      { label: 'Completed', count: stats?.completed_agreements ?? 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
                      { label: 'Pending Acceptance', count: stats?.pending_agreements ?? 0, color: 'bg-amber-500', text: 'text-amber-700' },
                      { label: 'Overdue', count: stats?.overdue_agreements ?? 0, color: 'bg-rose-500', text: 'text-rose-700' },
                      { label: 'Disputed', count: stats?.disputed_agreements ?? 0, color: 'bg-red-600', text: 'text-red-700' },
                    ].map((item, idx) => {
                      const total = stats?.total_agreements ?? 0;
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${item.color}`} />
                            <span className="font-medium text-slate-700">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.count}</span>
                            <span className="text-[11px] text-slate-400">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Master Contracts</span>
                  <span className="font-semibold text-slate-900">{stats?.total_agreements ?? 0}</span>
                </div>
              </div>

            </div>

            {/* Infrastructure Diagnostics Grid */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#0ea5e9]" />
                  <h3 className="font-display text-sm font-bold text-[#003a5e]">Infrastructure &amp; Security Health</h3>
                </div>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Services Healthy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">REST API Gateway</span>
                    <Server className="size-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">FastAPI 0.115</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">● Operational · &lt;20ms</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">Database Cluster</span>
                    <Database className="size-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">MongoDB Motor</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">● Connected · Indexed</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">Cryptographic Vault</span>
                    <Lock className="size-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">SHA-256 Engine</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">● Sec 65B Electronic Proof</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-medium">Media Storage CDN</span>
                    <Cloud className="size-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">Cloudinary CDN</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">● Stream Uploads Ready</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MASTER CONTRACTS */}
        {activeTab === 'agreements' && (
          <div className="p-5 sm:p-6">
            {isAgreementsLoading ? (
              <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center">
                <Loader2 className="size-6 animate-spin text-[#0ea5e9] mb-2" />
                <span>Loading master contracts...</span>
              </div>
            ) : (agreementsData?.agreements || []).length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Layers className="size-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No master contracts found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {agreementSearch || agreementStatusFilter ? 'Try clearing your filters.' : 'Agreements created on AgreeMate will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Agreement ID</th>
                      <th className="py-3 px-4">Item &amp; Category</th>
                      <th className="py-3 px-4">Counterparties</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(agreementsData?.agreements || []).map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {ag.id.slice(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{ag.item?.title || 'Lending Contract'}</div>
                          <div className="text-[11px] text-slate-400">{ag.item?.category || 'General'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">
                            <span className="font-medium text-slate-500">L:</span> {ag.owner_name || ag.owner_email || 'Owner'}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            <span className="font-medium">B:</span> {ag.borrower_name || ag.borrower_email || 'Awaiting Borrower'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {formatCurrency(ag.item?.estimated_value || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {ag.terms?.due_date ? formatDate(ag.terms.due_date) : 'Flexible'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border font-medium ${statusBadgeStyle[ag.status] || 'bg-slate-100 text-slate-700'}`}>
                            {ag.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewAgreement(ag)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0068a3] hover:text-[#003a5e] hover:underline cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="p-5 sm:p-6">
            {isUsersLoading ? (
              <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center">
                <Loader2 className="size-6 animate-spin text-[#0ea5e9] mb-2" />
                <span>Loading registered users...</span>
              </div>
            ) : (usersData?.users || []).length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Users className="size-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No users found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Contracts</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(usersData?.users || []).map((u) => {
                      const isSelf = u.email === user?.email;
                      const isUpdating = updatingUserId === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-[#003a5e] text-xs">
                                {(u.full_name || u.email || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{u.full_name || 'Anonymous User'}</div>
                                {isSelf && <span className="text-[10px] text-[#0ea5e9] font-bold">(You)</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.email_verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle className="size-3.5 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                <Clock className="size-3.5 text-amber-600" />
                                <span>Pending OTP</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {u.agreements_count ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-slate-400 italic">Protected</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={isUpdating}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  u.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                }`}
                                title={u.is_active ? 'Click to suspend user' : 'Click to activate user'}
                              >
                                {isUpdating ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : u.is_active ? (
                                  <>
                                    <Check className="size-3" />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="size-3" />
                                    <span>Suspended</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RISK & DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="p-5 sm:p-6 space-y-4">
            {disputedOrOverdueAgreements.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <CheckCircle2 className="size-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-800">Zero Risk Exposure</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  All active lending agreements are running smoothly within agreed terms. There are no pending dispute tickets or overdue contracts requiring intervention.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-rose-50/70 border-b border-rose-200 text-rose-800 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Agreement ID</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Issue Type</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Asset Value</th>
                      <th className="py-3 px-4 text-right">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disputedOrOverdueAgreements.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {ag.id.slice(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {ag.item?.title || 'Contract Item'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            ag.status === 'disputed' ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ag.status === 'disputed' ? 'Dispute Raised' : 'Overdue Loan'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {ag.terms?.due_date ? formatDate(ag.terms.due_date) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {formatCurrency(ag.item?.estimated_value || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleViewAgreement(ag)}
                            className="text-xs text-slate-600 hover:text-[#003a5e] font-semibold"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolvingAgreement(ag)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            Resolve Dispute
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="p-5 sm:p-6">
            {isAuditLoading ? (
              <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center">
                <Loader2 className="size-6 animate-spin text-[#0ea5e9] mb-2" />
                <span>Loading security audit logs...</span>
              </div>
            ) : (auditData?.logs || []).length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <ShieldCheck className="size-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No audit events recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Platform user actions and status transitions will log here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(auditData?.logs || []).map((log: AdminAuditLog) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-[#0ea5e9] shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">{log.action}</div>
                        <div className="text-[11px] text-slate-500">
                          By: <span className="font-medium text-slate-700">{log.actor_email || log.actor_id || 'System'}</span>
                          {log.ip_address && <span className="ml-2 text-slate-400 font-mono">({log.ip_address})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      {formatRelative(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Direct Agreement Details Inspection Modal */}
      <AgreementDetailsModal
        agreement={selectedAgreement}
        isOpen={isAgreementModalOpen}
        onClose={() => {
          setIsAgreementModalOpen(false);
          setSelectedAgreement(null);
        }}
      />

      {/* Admin Dispute Resolution Dialog */}
      {resolvingAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-600" />
                <h3 className="font-display font-bold text-base text-slate-900">Resolve Dispute Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingAgreement(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisputeResolution} className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-medium text-slate-500">Target Agreement:</span>
                <div className="font-semibold text-slate-800 text-sm mt-0.5">
                  {resolvingAgreement.item?.title || 'Contract'} ({resolvingAgreement.id.slice(0, 8)})
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Set Resolution Outcome
                </label>
                <select
                  value={resolveTargetStatus}
                  onChange={(e) => setResolveTargetStatus(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs text-slate-800 font-medium focus:border-[#0ea5e9] focus:outline-none"
                >
                  <option value="completed">Complete Contract &amp; Return Asset to Owner</option>
                  <option value="active">Restore Contract to Active Loan State</option>
                  <option value="cancelled">Cancel Contract</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Formal Resolution Notes &amp; Legal Summary
                </label>
                <textarea
                  rows={4}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain mediation outcome, terms agreed upon, or evidence evaluated for the legal record..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0ea5e9] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingAgreement(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isResolving && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
