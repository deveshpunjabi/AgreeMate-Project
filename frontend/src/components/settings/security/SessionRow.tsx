'use client';

import React from 'react';
import { Laptop, Smartphone, Trash2 } from 'lucide-react';
import { SessionItem } from '@/lib/api/security';

interface SessionRowProps {
  session: SessionItem;
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

export default function SessionRow({ session, onRevoke, isRevoking }: SessionRowProps) {
  const isMobile = session.device_name.toLowerCase().includes('mobile') || session.device_name.toLowerCase().includes('iphone') || session.device_name.toLowerCase().includes('android');

  const formatDate = (val?: string) => {
    if (!val) return 'Recently';
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? 'Recently'
      : new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-[#003a5e] shrink-0">
          {isMobile ? <Smartphone className="size-4 text-[#0ea5e9]" /> : <Laptop className="size-4 text-[#0ea5e9]" />}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#003a5e] text-xs sm:text-sm">{session.device_name}</span>
            {session.is_current && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-800 uppercase">
                This Device
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            IP: {session.ip_address} · Last active: {formatDate(session.last_active_at)}
          </p>
        </div>
      </div>

      {!session.is_current && (
        <button
          type="button"
          disabled={isRevoking}
          onClick={() => onRevoke(session.id)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">Revoke</span>
        </button>
      )}
    </div>
  );
}
