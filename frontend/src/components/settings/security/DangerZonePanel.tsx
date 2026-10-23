'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, UserX, X, Loader2 } from 'lucide-react';
import { securityApi } from '@/lib/api/security';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';

export default function DangerZonePanel() {
  const { toast } = useToast();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [confirmationWord, setConfirmationWord] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await securityApi.deactivateAccount(deactivatePassword);
      toast(res.message || 'Account deactivated.', 'success');
      clearAuth();
      router.push('/login');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Deactivation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermanent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationWord.trim() !== 'DELETE') {
      toast('Please type DELETE in exact uppercase.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await securityApi.deleteAccountPermanently(deletePassword, confirmationWord);
      toast(res.message || 'Account deleted and PII anonymized.', 'success');
      clearAuth();
      router.push('/login');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Account deletion failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/40 p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-red-200 pb-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-red-950">Danger Zone</h3>
          <p className="text-xs text-red-800/80 font-medium">Irreversible and destructive account actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Deactivate */}
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="font-bold text-[#003a5e] text-sm block">Deactivate Account</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Soft delete your profile and disable login. Reversible within 30 days by contacting support.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeactivateModal(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer w-full"
          >
            <UserX className="size-3.5" />
            <span>Deactivate Account</span>
          </button>
        </div>

        {/* Delete Permanently */}
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="font-bold text-red-700 text-sm block">Delete Account Permanently</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anonymizes PII while preserving legal agreement evidence for counterparties according to legal policy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer w-full"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDeactivateModal(false)} />
          <form onSubmit={handleDeactivate} className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#003a5e] text-sm">Confirm Account Deactivation</h4>
              <button type="button" onClick={() => setShowDeactivateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please enter your password to deactivate your account. Your agreements will remain safe.
            </p>
            <input
              type="password"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              placeholder="Current Password"
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDeactivateModal(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold">Cancel</button>
              <button type="submit" disabled={loading} className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold">
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Confirm Deactivation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Permanent Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDeleteModal(false)} />
          <form onSubmit={handleDeletePermanent} className="relative z-10 w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-red-700 text-sm">Delete Account Permanently</h4>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-900 leading-relaxed font-medium">
              ⚠ <strong>Evidence Integrity Policy:</strong> Deleting your account anonymizes your PII (`Deleted User`). Shared agreements and evidence files remain valid for counterparties.
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type "DELETE" to confirm</label>
                <input
                  type="text"
                  value={confirmationWord}
                  onChange={(e) => setConfirmationWord(e.target.value)}
                  placeholder="DELETE"
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-red-600 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold">Cancel</button>
              <button type="submit" disabled={loading || confirmationWord !== 'DELETE'} className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50">
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
