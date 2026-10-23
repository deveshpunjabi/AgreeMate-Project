'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Package,
  Loader2,
  Printer,
  CheckCircle2,
  Handshake,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Send,
  Copy,
  Check,
  Pencil,
  Mail,
  Share2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Agreement, agreementsApi } from '@/lib/api/agreements';
import { useAuthStore } from '@/stores/auth.store';
import { isAdminUser } from '@/lib/api/admin';
import LegalDocumentSheet, { LegalDocumentData } from './LegalDocumentSheet';

interface AgreementDetailsModalProps {
  agreement: Agreement | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgreementDetailsModal({
  agreement,
  isOpen,
  onClose,
}: AgreementDetailsModalProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [activeAgreement, setActiveAgreement] = useState<Agreement | null>(agreement);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dispute Dialog state
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveTargetStatus, setResolveTargetStatus] = useState<'completed' | 'active' | 'cancelled'>('completed');
  const [resolveNotes, setResolveNotes] = useState('');

  // Copy Link & Terms Edit states
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    borrower_email: '',
    borrower_name: '',
    borrower_phone: '',
    due_date: '',
    penalty_type: 'fixed' as 'fixed' | 'per_day' | 'percentage',
    penalty_rate: 50,
    grace_period_days: 2,
    special_conditions: '',
    asset_name: '',
    asset_value: 5000,
  });

  // Sync state whenever prop updates
  useEffect(() => {
    setActiveAgreement(agreement);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDisputeDialog(false);
    setDisputeReason('');
    setShowResolveDialog(false);
    setResolveNotes('');
    setShowEditDialog(false);
    setCopiedLink(false);
  }, [agreement]);

  if (!isOpen || !activeAgreement) return null;

  const isOwner = user && (
    user.id === activeAgreement.owner_id ||
    user.email?.toLowerCase() === activeAgreement.owner_email?.toLowerCase()
  );
  const isBorrower = user && (
    user.id === activeAgreement.borrower_id ||
    user.email?.toLowerCase() === activeAgreement.borrower_email?.toLowerCase()
  );
  const isAdmin = isAdminUser(user);
  const canResolveDispute = Boolean(isOwner || isAdmin);

  const formatStatus = (st: string) => {
    return st.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending_borrower_acceptance: 'bg-amber-50 text-amber-800 border-amber-200',
    pending_owner_confirmation: 'bg-blue-50 text-[#0068a3] border-blue-200',
    active: 'bg-sky-50 text-[#0068a3] border-sky-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    return_initiated: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    disputed: 'bg-red-50 text-red-700 border-red-200',
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['agreements'] });
    queryClient.invalidateQueries({ queryKey: ['recent-agreements'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setErrorMsg(null);
      const blob = await agreementsApi.downloadPdf(activeAgreement.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AgreeMate_Agreement_${activeAgreement.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      setErrorMsg('Unable to download official PDF contract. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      setErrorMsg(null);
      const blob = await agreementsApi.downloadZip(activeAgreement.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Evidence_Packet_${activeAgreement.id.slice(0, 8)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      setErrorMsg('Unable to download ZIP evidence packet.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Contract Lifecycle Handlers ---
  const handleAcceptTerms = async () => {
    try {
      setActionLoading('accept');
      setErrorMsg(null);
      const updated = await agreementsApi.acceptTerms(activeAgreement.id);
      setActiveAgreement(updated);
      setSuccessMsg('Agreement signed and accepted! Handover confirmation has been sent to the lender.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to accept agreement terms.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineTerms = async () => {
    if (!window.confirm('Are you sure you want to decline this agreement?')) return;
    try {
      setActionLoading('decline');
      setErrorMsg(null);
      const updated = await agreementsApi.rejectTerms(activeAgreement.id, 'Declined by borrower');
      setActiveAgreement(updated);
      setSuccessMsg('Agreement declined.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to decline agreement.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmHandover = async () => {
    try {
      setActionLoading('confirm');
      setErrorMsg(null);
      const updated = await agreementsApi.confirmHandover(activeAgreement.id);
      setActiveAgreement(updated);
      setSuccessMsg('Handover confirmed! The loan is now officially active with return tracking.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to confirm item handover.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInitiateReturn = async () => {
    try {
      setActionLoading('return');
      setErrorMsg(null);
      const updated = await agreementsApi.initiateReturn(activeAgreement.id);
      setActiveAgreement(updated);
      setSuccessMsg('Return handover initiated. The lender has been notified to inspect and close the loan.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to initiate item return.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteReturn = async () => {
    try {
      setActionLoading('complete');
      setErrorMsg(null);
      const updated = await agreementsApi.completeAgreement(activeAgreement.id);
      setActiveAgreement(updated);
      setSuccessMsg('Return verified and contract successfully closed! Item marked available.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to complete agreement.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setErrorMsg('Please enter a description for the dispute.');
      return;
    }
    try {
      setActionLoading('dispute');
      setErrorMsg(null);
      const updated = await agreementsApi.disputeAgreement(activeAgreement.id, disputeReason.trim());
      setActiveAgreement(updated);
      setShowDisputeDialog(false);
      setSuccessMsg('Dispute filed. The contract has been locked in disputed status for resolution.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to raise dispute.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Resolve Dispute Handler ---
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveNotes.trim()) {
      setErrorMsg('Please enter official dispute resolution notes.');
      return;
    }
    try {
      setActionLoading('resolve-dispute');
      setErrorMsg(null);
      const updated = await agreementsApi.resolveDispute(
        activeAgreement.id,
        resolveTargetStatus,
        resolveNotes.trim()
      );
      setActiveAgreement(updated);
      setShowResolveDialog(false);
      setSuccessMsg(`Dispute successfully resolved to '${resolveTargetStatus}'.`);
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Copy Invite Link Handler ---
  const handleCopyInviteLink = async () => {
    try {
      let token = activeAgreement.invite_token;
      if (!token) {
        setActionLoading('copy-link');
        const res = await agreementsApi.resendInvite(activeAgreement.id);
        token = res.invite_token;
        setActiveAgreement((prev) => prev ? { ...prev, invite_token: token, invite_expires_at: res.expires_at } : prev);
      }
      const fullUrl = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      setSuccessMsg('Entire invitation link copied to clipboard!');
    } catch {
      setErrorMsg('Failed to copy invitation link to clipboard.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Resend Invitation Email Handler ---
  const handleResendInvite = async () => {
    try {
      setActionLoading('resend-invite');
      setErrorMsg(null);
      const res = await agreementsApi.resendInvite(activeAgreement.id);
      setActiveAgreement((prev) => prev ? {
        ...prev,
        invite_token: res.invite_token,
        invite_expires_at: res.expires_at,
        status: 'pending_borrower_acceptance'
      } : prev);
      setSuccessMsg(`Invitation email successfully dispatched to ${activeAgreement.borrower_email}! If new to AgreeMate, an onboarding invitation was generated.`);
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to resend invitation email.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Edit Terms Handlers ---
  const handleOpenEditModal = () => {
    setEditFormData({
      borrower_email: activeAgreement.borrower_email || '',
      borrower_name: activeAgreement.borrower_name || '',
      borrower_phone: activeAgreement.borrower_phone || '',
      due_date: activeAgreement.terms?.due_date ? String(activeAgreement.terms.due_date).split('T')[0] : '',
      penalty_type: (activeAgreement.terms?.penalty_type as any) || 'fixed',
      penalty_rate: activeAgreement.terms?.penalty_rate ?? 50,
      grace_period_days: activeAgreement.terms?.grace_period_days ?? 2,
      special_conditions: activeAgreement.terms?.special_conditions || '',
      asset_name: activeAgreement.item?.title || '',
      asset_value: activeAgreement.item?.estimated_value ?? 5000,
    });
    setShowEditDialog(true);
  };

  const handleSaveTermsEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('save-edit');
      setErrorMsg(null);
      const updated = await agreementsApi.update(activeAgreement.id, {
        borrower_email: editFormData.borrower_email.trim(),
        borrower_name: editFormData.borrower_name.trim() || undefined,
        borrower_phone: editFormData.borrower_phone.trim() || undefined,
        due_date: editFormData.due_date || undefined,
        penalty_type: editFormData.penalty_type,
        penalty_rate: Number(editFormData.penalty_rate),
        grace_period_days: Number(editFormData.grace_period_days),
        special_conditions: editFormData.special_conditions.trim() || undefined,
        asset_name: editFormData.asset_name.trim() || undefined,
        asset_value: Number(editFormData.asset_value),
      });
      setActiveAgreement(updated);
      setShowEditDialog(false);
      setSuccessMsg('Agreement terms updated successfully! The invitation email and contract terms were updated.');
      invalidateQueries();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update agreement terms.');
    } finally {
      setActionLoading(null);
    }
  };

  const agreementNo = `AGM/${new Date(activeAgreement.created_at).getFullYear()}/${activeAgreement.id.slice(0, 6).toUpperCase()}`;

  const formatCleanName = (name?: string | null, email?: string | null, fallback = 'Party') => {
    if (name && !name.includes('@') && name !== 'Party 1 (Owner)' && name !== 'Party 2 (Borrower)') {
      return name.trim();
    }
    if (email && email.includes('@')) {
      const prefix = email.split('@')[0];
      const letters = prefix.replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
      if (letters) {
        return letters.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return name || fallback;
  };

  const cleanOwnerName = formatCleanName(activeAgreement.owner_name, activeAgreement.owner_email, 'Primary Owner / Lender');
  const cleanBorrowerName = formatCleanName(activeAgreement.borrower_name, activeAgreement.borrower_email, 'Borrower / Recipient');

  const docData: LegalDocumentData = {
    id: activeAgreement.id,
    title: activeAgreement.item?.title ? `Lending Agreement: ${activeAgreement.item.title}` : 'Mutual Lending & Asset Agreement',
    ownerName: cleanOwnerName,
    ownerEmail: activeAgreement.owner_email || 'owner@agreemate.io',
    borrowerName: cleanBorrowerName,
    borrowerEmail: activeAgreement.borrower_email,
    assetName: activeAgreement.item?.title || 'Registered Asset',
    assetCategory: activeAgreement.item?.category || 'Physical Item',
    assetDescription: activeAgreement.item?.description,
    assetValue: activeAgreement.item?.estimated_value || 5000,
    assetCondition: activeAgreement.item?.condition || 'good',
    effectiveDate: activeAgreement.terms?.locked_at || activeAgreement.created_at,
    dueDate: activeAgreement.terms?.due_date,
    gracePeriodDays: activeAgreement.terms?.grace_period_days || 0,
    penaltyType: activeAgreement.terms?.penalty_type || 'per_day',
    penaltyRate: activeAgreement.terms?.penalty_rate || 50,
    specialConditions: activeAgreement.terms?.special_conditions,
    status: activeAgreement.status,
    createdAt: activeAgreement.created_at,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none print:p-0 print:static print:z-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 print:hidden" onClick={onClose} />

      {/* Main Modal Sheet */}
      <div className="relative z-10 isolate flex max-h-[94vh] w-full max-w-4xl lg:max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#003a5e] text-white">
              <FileText className="size-4.5 text-[#0ea5e9]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold text-[#003a5e]">Official Legal Contract &amp; PDF View</h2>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  {agreementNo}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                AgreeMate Legal Vault · Multi-Page Contract Document Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[activeAgreement.status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {formatStatus(activeAgreement.status)}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Print document"
            >
              <Printer className="size-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 transition-colors hover:bg-slate-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area (GPU-Accelerated Smooth Scrolling) */}
        <div className="flex-1 agreement-scroll-container p-4 sm:p-8 bg-[#e2e8f0] space-y-4 print:p-0 print:overflow-visible print:bg-white">
          
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 print:hidden flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 print:hidden flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dispute Input Dialog Popup inside modal */}
          {showDisputeDialog && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-lg print:hidden animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="size-4.5 text-amber-600" />
                  <span>Raise a Contract Dispute</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisputeDialog(false)}
                  className="size-7 flex items-center justify-center rounded-lg text-amber-800 hover:bg-amber-200/50 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
              <form onSubmit={handleRaiseDispute} className="mt-3 space-y-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  Raising a dispute freezes return reminders, locks the agreement status, and enters formal mediation.
                  Please explain the reason for the dispute:
                </p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue (e.g. damaged condition upon return, failure to return on due date, unauthorized alterations)..."
                  className="w-full h-24 rounded-xl border border-amber-300 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDisputeDialog(false)}
                    className="h-8 px-3 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'dispute'}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === 'dispute' ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    <span>Submit Dispute</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resolve Dispute Dialog */}
          {showResolveDialog && (
            <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-xl print:hidden animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="size-4.5 text-emerald-600" />
                  <span>Administrative Dispute Resolution</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResolveDialog(false)}
                  className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
              <form onSubmit={handleResolveDispute} className="mt-3 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  As an authorized administrator or owner, you can conclude this dispute by applying a final status and recording audit notes.
                </p>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Resolution Status
                  </label>
                  <select
                    value={resolveTargetStatus}
                    onChange={(e) => setResolveTargetStatus(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="completed">Completed (Settlement Reached / Item Returned)</option>
                    <option value="active">Active (Resume Normal Loan)</option>
                    <option value="cancelled">Cancelled (Agreement Voided)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Resolution Finding &amp; Notes
                  </label>
                  <textarea
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Enter final arbitration/agreement notes, compensation terms, or return inspection confirmation..."
                    className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResolveDialog(false)}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'resolve-dispute'}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {actionLoading === 'resolve-dispute' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    <span>Confirm Dispute Resolution</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Owner Pending / Draft: Counterparty Invitation Link Banner */}
          {isOwner && ['draft', 'pending_borrower_acceptance'].includes(activeAgreement.status) && (
            <div className="rounded-2xl border border-sky-200 bg-white p-4 sm:p-5 shadow-sm print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-[#0ea5e9]">
                    <Share2 className="size-4.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#003a5e] uppercase tracking-wider">
                        Counterparty Invitation Link
                      </h3>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Awaiting Acceptance
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Target Borrower: <strong className="text-slate-800 font-semibold">{activeAgreement.borrower_email}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3 text-slate-500" />
                    <span>Edit Terms</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendInvite}
                    disabled={actionLoading === 'resend-invite'}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#003a5e] px-3 text-xs font-semibold text-white hover:bg-[#005080] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {actionLoading === 'resend-invite' ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3 text-[#0ea5e9]" />}
                    <span>Resend Email</span>
                  </button>
                </div>
              </div>

              {/* Entire link box with one-click copy */}
              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 select-all overflow-x-auto whitespace-nowrap">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/invite/${activeAgreement.invite_token || 'pending'}`
                    : `/invite/${activeAgreement.invite_token || ''}`}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  disabled={actionLoading === 'copy-link'}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 text-xs font-semibold text-white hover:bg-sky-700 transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-white" />
                      <span>Copy Full Link</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed">
                💡 <strong className="text-slate-700">Automatic Email Dispatch:</strong> Whenever you create or edit an agreement, AgreeMate sends the invitation directly to <span className="font-mono text-[#003a5e]">{activeAgreement.borrower_email}</span>. If they don&apos;t have an account yet, they will receive a guided onboarding email with this link.
              </p>
            </div>
          )}

          {/* Edit Terms Dialog inside modal */}
          {showEditDialog && (
            <div className="rounded-2xl border border-sky-300 bg-white p-5 shadow-xl print:hidden animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#003a5e] font-bold text-sm">
                  <Pencil className="size-4 text-sky-600" />
                  <span>Edit Agreement Terms &amp; Counterparty Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTermsEdit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Asset Title */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Asset / Item Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.asset_name}
                      onChange={(e) => setEditFormData({ ...editFormData, asset_name: e.target.value })}
                      placeholder="e.g. Sony FX3 Cinema Camera"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Asset Value */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Estimated Asset Value (₹ INR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editFormData.asset_value}
                      onChange={(e) => setEditFormData({ ...editFormData, asset_value: Number(e.target.value) })}
                      placeholder="e.g. 50000"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Borrower Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Borrower Email Address
                    </label>
                    <input
                      type="email"
                      value={editFormData.borrower_email}
                      onChange={(e) => setEditFormData({ ...editFormData, borrower_email: e.target.value })}
                      placeholder="borrower@example.com"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-sky-600 mt-1 block">
                      * Changing email automatically dispatches a fresh invite to the new address.
                    </span>
                  </div>

                  {/* Return Due Date */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Return Due Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.due_date}
                      onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Borrower Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Borrower Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={editFormData.borrower_name}
                      onChange={(e) => setEditFormData({ ...editFormData, borrower_name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Borrower Phone */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Borrower Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={editFormData.borrower_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, borrower_phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Late Fee Type */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Late Penalty Structure
                    </label>
                    <select
                      value={editFormData.penalty_type}
                      onChange={(e) => setEditFormData({ ...editFormData, penalty_type: e.target.value as any })}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="per_day">Per Day Daily Accrual (₹/day)</option>
                      <option value="fixed">Fixed One-Time Fee (₹)</option>
                      <option value="percentage">Percentage of Asset Value (%/day)</option>
                    </select>
                  </div>

                  {/* Late Fee Rate & Grace Days */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Rate ({editFormData.penalty_type === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.penalty_rate}
                        onChange={(e) => setEditFormData({ ...editFormData, penalty_rate: Number(e.target.value) })}
                        className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Grace Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={editFormData.grace_period_days}
                        onChange={(e) => setEditFormData({ ...editFormData, grace_period_days: Number(e.target.value) })}
                        className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Conditions */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Special Conditions &amp; Notes
                  </label>
                  <textarea
                    value={editFormData.special_conditions}
                    onChange={(e) => setEditFormData({ ...editFormData, special_conditions: e.target.value })}
                    placeholder="e.g. Return in original packaging with power cable and memory card..."
                    className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditDialog(false)}
                    className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'save-edit'}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-600 px-5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {actionLoading === 'save-edit' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    <span>Save Updated Terms</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Full Reference Legal Document Sheet */}
          <LegalDocumentSheet data={docData} agreementNo={agreementNo} />
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5 shrink-0 print:hidden">
          
          {/* Left: Export Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#005080] disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4 text-[#0ea5e9]" />
              )}
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#003a5e] transition-colors hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingZip ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Package className="size-4 text-[#0ea5e9]" />
              )}
              <span className="hidden sm:inline">ZIP Evidence Packet</span>
            </button>
          </div>

          {/* Center / Primary Lifecycle Actions */}
          <div className="flex items-center gap-2">
            
            {/* Owner Pending / Draft Actions: Edit Terms, Copy Link, Resend */}
            {isOwner && ['draft', 'pending_borrower_acceptance'].includes(activeAgreement.status) && (
              <>
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Pencil className="size-3.5 text-slate-500" />
                  <span>Edit Terms</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  disabled={actionLoading === 'copy-link'}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 hover:bg-sky-100 cursor-pointer"
                >
                  {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-sky-600" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendInvite}
                  disabled={actionLoading === 'resend-invite'}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#003a5e] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#005080] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'resend-invite' ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5 text-[#0ea5e9]" />}
                  <span>Resend Email</span>
                </button>
              </>
            )}

            {/* Borrower Pending Acceptance: Sign & Accept */}
            {activeAgreement.status === 'pending_borrower_acceptance' && isBorrower && (
              <>
                <button
                  type="button"
                  onClick={handleDeclineTerms}
                  disabled={!!actionLoading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'decline' ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                  <span>Decline</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptTerms}
                  disabled={!!actionLoading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'accept' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  <span>Sign &amp; Accept Contract</span>
                </button>
              </>
            )}

            {/* Owner Confirmation: Confirm Handover */}
            {activeAgreement.status === 'pending_owner_confirmation' && isOwner && (
              <button
                type="button"
                onClick={handleConfirmHandover}
                disabled={!!actionLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#005080] disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === 'confirm' ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4 text-[#0ea5e9]" />}
                <span>Confirm Handover (Start Loan)</span>
              </button>
            )}

            {/* Borrower Return Initiation */}
            {['active', 'overdue'].includes(activeAgreement.status) && isBorrower && (
              <button
                type="button"
                onClick={handleInitiateReturn}
                disabled={!!actionLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === 'return' ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                <span>Initiate Return Handover</span>
              </button>
            )}

            {/* Owner Return Completion */}
            {activeAgreement.status === 'return_initiated' && isOwner && (
              <button
                type="button"
                onClick={handleCompleteReturn}
                disabled={!!actionLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === 'complete' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                <span>Confirm Return &amp; Close Contract</span>
              </button>
            )}

            {/* Raise Dispute button for active/overdue/return_initiated */}
            {['active', 'overdue', 'return_initiated'].includes(activeAgreement.status) && (
              <button
                type="button"
                onClick={() => setShowDisputeDialog(true)}
                disabled={!!actionLoading || showDisputeDialog}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle className="size-3.5 text-amber-600" />
                <span className="hidden sm:inline">Raise Dispute</span>
              </button>
            )}

            {/* Disputed Status Badge & Resolve Action */}
            {activeAgreement.status === 'disputed' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 border border-red-200">
                  <AlertTriangle className="size-4 text-red-600" />
                  <span>Under Dispute Mediation</span>
                </span>
                {canResolveDispute && (
                  <button
                    type="button"
                    onClick={() => setShowResolveDialog(true)}
                    disabled={!!actionLoading || showResolveDialog}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Resolve Dispute</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Close Action */}
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
