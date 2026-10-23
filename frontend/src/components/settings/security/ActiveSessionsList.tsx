'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { securityApi, SessionItem } from '@/lib/api/security';
import { useToast } from '@/components/ui/Toast';
import SessionRow from './SessionRow';

export default function ActiveSessionsList() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const data = await securityApi.listSessions();
      setSessions(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      setRevokingId(id);
      await securityApi.revokeSession(id);
      toast('Session revoked successfully.', 'success');
      setSessions((curr) => curr.filter((s) => s.id !== id));
    } catch {
      toast('Failed to revoke session.', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      setIsLoading(true);
      await securityApi.revokeAllOtherSessions();
      toast('All other sessions revoked successfully.', 'success');
      await fetchSessions();
    } catch {
      toast('Failed to revoke all other sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Active Devices ({sessions.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSessions}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="size-3.5" />
          </button>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeAllOthers}
              disabled={isLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Revoke All Others</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        {isLoading ? (
          <div className="flex justify-center py-6 text-slate-400">
            <Loader2 className="size-5 animate-spin text-[#003a5e]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">No active sessions found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onRevoke={handleRevoke}
                isRevoking={revokingId === s.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
