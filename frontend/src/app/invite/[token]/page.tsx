'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Calendar, Receipt, Info, Lock, Clock, ArrowRight, X, CheckCircle2 } from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function InvitePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user } = useAuthStore();

  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`${API_URL}/agreements/invite/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Invitation link is invalid or has expired.');
        }
        setAgreement(await res.json());
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchInvite();
  }, [token]);

  const handleDecline = () => {
    setDeclined(true);
  };

  const handleProceed = () => {
    if (user) {
      // If user is logged in, redirect to agreements page with target id
      router.push(`/agreements?id=${agreement.id || agreement._id}`);
    } else {
      // Redirect to signup and pass the token for verification
      router.push(`/signup?invite=${token}&email=${encodeURIComponent(agreement.borrower_email)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
        <LoaderSpinner />
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-hairline rounded-2xl shadow-modal p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-[#003a5e]">Invitation Declined</h2>
          <p className="font-body text-xs text-slate-500 leading-relaxed">
            You have declined this agreement invitation. No contract has been created or signed.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-hairline rounded-2xl shadow-modal p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-danger-subtle flex items-center justify-center text-danger mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-ink">Invitation Error</h2>
          <p className="font-body text-xs text-muted mt-2 leading-relaxed">{error}</p>
          <Button variant="secondary" className="mt-6 w-full" onClick={() => router.push('/')}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const { item, terms } = agreement;
  const isAlreadyAccepted = agreement && !['draft', 'pending_borrower_acceptance'].includes(agreement.status);

  if (isAlreadyAccepted) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-hairline rounded-3xl shadow-modal p-8 max-w-md w-full text-center space-y-4">
          <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <h2 className="font-display font-bold text-xl text-[#003a5e]">Agreement Already Accepted</h2>
          <p className="font-body text-xs text-slate-500 leading-relaxed">
            This agreement invitation for <strong>&apos;{item?.title || 'the registered item'}&apos;</strong> has already been digitally accepted and confirmed. All invitation actions are complete and terms are locked.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                if (user) {
                  router.push(`/agreements?id=${agreement.id || agreement._id}`);
                } else {
                  const targetPath = `/agreements?id=${agreement.id || agreement._id}`;
                  router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
                }
              }}
            >
              View Active Agreement &rarr;
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas relative overflow-hidden flex flex-col justify-between py-12 px-6">
      <div className="max-w-xl w-full mx-auto bg-white border border-hairline rounded-3xl shadow-modal overflow-hidden relative z-10 flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-hairline bg-canvas-soft relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4" />
            Lending Agreement Invite
          </div>
          <h1 className="font-display font-bold text-2xl text-ink leading-tight mt-2">
            Confirm terms for &apos;{item?.title || 'Lended Item'}&apos;
          </h1>
          <p className="font-body text-xs text-muted mt-1">
            Lent by <span className="font-semibold text-ink-body">{agreement.owner_name || 'Owner'}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 flex-1">
          {/* Info Card */}
          <div className="bg-primary-subtle border border-primary-border rounded-2xl p-4 flex gap-3 text-xs text-ink-body">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              You are invited to borrow this item. Please review the digital lending terms below. Accepting holds you responsible for returning the item in its original condition by the due date.
            </p>
          </div>

          {/* Item Details */}
          <div className="border border-hairline bg-white shadow-card rounded-2xl p-5 flex gap-4 items-center">
            {item?.media?.[0]?.cloudinary_url ? (
              <img
                src={item.media[0].cloudinary_url}
                alt={item.title}
                className="w-16 h-16 rounded-xl object-cover border border-hairline"
              />
            ) : (
              <div className="w-16 h-16 bg-raised rounded-xl flex items-center justify-center text-muted">
                <Shield className="w-8 h-8" />
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-base text-ink">{item?.title}</h3>
              <p className="font-body text-xs text-muted-soft mt-0.5 truncate max-w-[280px]">
                {item?.description || 'No description provided.'}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-raised text-ink-body">
                  Value: {formatCurrency(item?.estimated_value)}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-raised text-ink-body">
                  Cond: {item?.condition}
                </span>
              </div>
            </div>
          </div>

          {/* Terms Section */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs text-ink-body uppercase tracking-wider">
              Lending Terms
            </h4>
            
            <div className="bg-crypto-subtle border border-crypto-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-crypto text-xs font-semibold pb-3 border-b border-crypto-border/20">
                <Lock className="w-4 h-4" />
                Locked Digital Contract
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-body">
                <div>
                  <span className="text-muted-soft block mb-1">Due Date</span>
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted" />
                    {formatDate(terms?.due_date)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-soft block mb-1">Penalty Rule</span>
                  <span className="font-semibold text-ink flex items-center gap-1.5 capitalize">
                    <Receipt className="w-4 h-4 text-muted" />
                    {terms?.penalty_type?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-soft block mb-1">Penalty Rate</span>
                  <span className="font-semibold text-ink">
                    {terms?.penalty_type === 'percentage' ? `${terms?.penalty_rate}%` : formatCurrency(terms?.penalty_rate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-soft block mb-1">Grace Period</span>
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted" />
                    {terms?.grace_period_days || 0} days
                  </span>
                </div>
              </div>

              {terms?.special_conditions && (
                <div className="pt-3 border-t border-crypto-border/20">
                  <span className="text-muted-soft text-xs block mb-1">Special Conditions</span>
                  <p className="text-xs text-ink-body italic bg-white/50 p-2.5 rounded-lg border border-crypto-border/10 leading-relaxed font-body">
                    &ldquo;{terms.special_conditions}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-hairline bg-canvas-soft flex justify-between gap-3">
          <Button variant="ghost" onClick={handleDecline} className="w-1/3">
            Decline
          </Button>
          <Button variant="primary" onClick={handleProceed} className="w-2/3" iconRight={<ArrowRight className="w-4 h-4" />}>
            Accept & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary-border border-t-primary animate-spin" />
      <span className="text-xs font-semibold text-muted font-display">Verifying link authenticity...</span>
    </div>
  );
}
