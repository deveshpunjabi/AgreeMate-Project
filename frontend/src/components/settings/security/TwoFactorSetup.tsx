'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, QrCode, Loader2, RefreshCw } from 'lucide-react';
import { securityApi } from '@/lib/api/security';
import { useToast } from '@/components/ui/Toast';
import BackupCodesModal from './BackupCodesModal';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange: () => void;
}

export default function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'idle' | 'qr' | 'disable'>('idle');
  const [setupData, setSetupData] = useState<{ totp_secret: string; otpauth_url: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      const res = await securityApi.setup2FA();
      setSetupData(res);
      setStep('qr');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Unable to initiate 2FA setup.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      toast('Please enter a 6-digit TOTP code.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await securityApi.verify2FA(totpCode);
      setBackupCodes(res.backup_codes);
      setShowBackupModal(true);
      toast('Two-factor authentication enabled successfully!', 'success');
      setStep('idle');
      setTotpCode('');
      onStatusChange();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Invalid 2FA code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await securityApi.disable2FA(disablePassword, disableCode);
      toast('Two-factor authentication disabled.', 'success');
      setStep('idle');
      setDisablePassword('');
      setDisableCode('');
      onStatusChange();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to disable 2FA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    try {
      setLoading(true);
      const res = await securityApi.regenerateBackupCodes();
      setBackupCodes(res.backup_codes);
      setShowBackupModal(true);
      toast('New backup codes generated.', 'success');
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Unable to regenerate backup codes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <span className={`flex size-10 items-center justify-center rounded-xl ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {isEnabled ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#003a5e] text-sm">Two-Factor Authentication (TOTP)</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {isEnabled ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure your account using Google Authenticator, Authy, or 1Password.
            </p>
          </div>
        </div>

        {isEnabled ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateCodes}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#003a5e] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5 text-[#0ea5e9]" />
              <span className="hidden sm:inline">Backup Codes</span>
            </button>
            <button
              type="button"
              onClick={() => setStep('disable')}
              className="h-9 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
            >
              Disable
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white hover:bg-[#005080] transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <QrCode className="size-3.5 text-[#0ea5e9]" />}
            <span>Enable 2FA</span>
          </button>
        )}
      </div>

      {/* QR Code Setup Step */}
      {step === 'qr' && setupData && (
        <form onSubmit={handleVerifySetup} className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[#003a5e] text-xs uppercase tracking-wider">Step 1: Scan QR Code &amp; Enter Code</h4>
            <button type="button" onClick={() => setStep('idle')} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
            {/* Visual QR SVG representation */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(setupData.otpauth_url)}`}
                alt="2FA QR Code"
                width={112}
                height={112}
                loading="lazy"
                decoding="async"
                className="size-28 object-contain"
              />
              <span className="text-[9px] font-mono text-slate-400">Scan with Authenticator</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Secret Key (Manual Entry):</span>
                <span className="font-mono font-extrabold text-[#003a5e] select-all break-all block">{setupData.totp_secret}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#003a5e] mb-1">
                  Enter 6-Digit Authenticator Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-center text-base font-bold tracking-widest text-[#003a5e] outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 px-5 rounded-xl bg-[#003a5e] hover:bg-[#005080] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Confirm & Enable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Disable Step */}
      {step === 'disable' && (
        <form onSubmit={handleDisable} className="rounded-2xl border border-red-200 bg-red-50/70 p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-red-900 text-xs uppercase tracking-wider">Confirm Disable 2FA</h4>
            <button type="button" onClick={() => setStep('idle')} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Current Password"
              required
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#003a5e] outline-none"
            />
            <input
              type="text"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Current 2FA Code"
              required
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-[#003a5e] outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Confirm Disable'}
            </button>
          </div>
        </form>
      )}

      <BackupCodesModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        backupCodes={backupCodes}
      />
    </div>
  );
}
