'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, UserCheck, AlertTriangle, Key, Loader2 } from 'lucide-react';
import { securityApi, AuditLogItem } from '@/lib/api/security';

export default function LoginActivityFeed() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    securityApi
      .getActivityLog()
      .then((data) => setLogs(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (val?: string) => {
    if (!val) return 'Recent';
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? 'Recent'
      : new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'password_changed':
        return { label: 'Password Changed', icon: Lock, color: 'bg-purple-100 text-purple-800' };
      case '2fa_enabled':
        return { label: '2FA Enabled', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-800' };
      case '2fa_disabled':
        return { label: '2FA Disabled', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800' };
      case 'login_success':
        return { label: 'Successful Login', icon: UserCheck, color: 'bg-sky-100 text-[#0068a3]' };
      default:
        return { label: action.replaceAll('_', ' '), icon: Key, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Security &amp; Auth Event Log (Last 20)
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        {isLoading ? (
          <div className="flex justify-center py-6 text-slate-400">
            <Loader2 className="size-5 animate-spin text-[#003a5e]" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">No recent security events.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {logs.map((log) => {
              const meta = getActionBadge(log.action);
              const Icon = meta.icon;
              return (
                <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-7 items-center justify-center rounded-lg ${meta.color}`}>
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <span className="font-bold text-[#003a5e] block">{meta.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {log.user_agent} · IP {log.ip_address}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
