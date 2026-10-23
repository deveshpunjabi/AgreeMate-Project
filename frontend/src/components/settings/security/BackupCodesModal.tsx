'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Download, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface BackupCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupCodes: string[];
}

export default function BackupCodesModal({
  isOpen,
  onClose,
  backupCodes,
}: BackupCodesModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !backupCodes || backupCodes.length === 0) return null;

  const handleCopy = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Backup codes copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `AgreeMate 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nKeep these single-use recovery codes in a safe place.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agreemate-2fa-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-[#003a5e]">2FA Backup Recovery Codes</h2>
              <p className="text-xs text-slate-500 font-medium">Single-use emergency access codes</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed font-medium">
          ⚠ <strong>Save these now — you won't see them again!</strong> If you lose access to your authenticator app, these codes are the only way to recover your account.
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs font-bold text-[#003a5e]">
          {backupCodes.map((code, idx) => (
            <div key={idx} className="rounded-lg bg-white p-2 text-center border border-slate-200/60 shadow-2xs">
              {code}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#003a5e] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-[#0ea5e9]" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white hover:bg-[#005080] transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-[#0ea5e9]" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
