'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { securityApi } from '@/lib/api/security';
import { useToast } from '@/components/ui/Toast';

export default function PasswordChangeForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strength check
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const getStrengthScore = () => {
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    return score;
  };

  const strengthScore = getStrengthScore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('Please enter your current password.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match.', 'error');
      return;
    }
    if (!hasMinLength) {
      toast('Password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await securityApi.changePassword(currentPassword, newPassword);
      toast(res.message || 'Password changed. Other active sessions were invalidated.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-3">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-[#003a5e] mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-[#003a5e] outline-none transition-colors focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#003a5e] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-[#003a5e] outline-none transition-colors focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#003a5e] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#003a5e] outline-none transition-colors focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        {/* Password Strength Meter */}
        {newPassword.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Password Strength:</span>
              <span className={`font-bold ${strengthScore === 3 ? 'text-emerald-600' : strengthScore === 2 ? 'text-amber-600' : 'text-red-500'}`}>
                {strengthScore === 3 ? 'Strong' : strengthScore === 2 ? 'Medium' : 'Weak'}
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 gap-1">
              <div className={`h-full flex-1 transition-all ${strengthScore >= 1 ? (strengthScore === 3 ? 'bg-emerald-500' : strengthScore === 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-transparent'}`} />
              <div className={`h-full flex-1 transition-all ${strengthScore >= 2 ? (strengthScore === 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'}`} />
              <div className={`h-full flex-1 transition-all ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 pt-1">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-bold' : ''}`}>
                <Check className="size-3" /> 8+ Chars
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-bold' : ''}`}>
                <Check className="size-3" /> Number
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-bold' : ''}`}>
                <Check className="size-3" /> Symbol
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-500 max-w-sm">
          ⚠ Changing password invalidates all other active sessions except this current device.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#005080] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5 text-[#0ea5e9]" />}
          <span>Update Password</span>
        </button>
      </div>
    </form>
  );
}
