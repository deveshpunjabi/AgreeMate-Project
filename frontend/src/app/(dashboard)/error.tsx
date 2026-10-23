'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Route Error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[28px] p-8 shadow-xl text-center">
        <div className="size-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-5 ring-6 ring-rose-500/5">
          <AlertCircle className="size-7" />
        </div>
        
        <h2 className="text-lg font-bold text-[#003a5e] mb-2">
          Unable to load dashboard view
        </h2>
        
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          {error?.message || 'We encountered an error loading this section. Please retry or return to dashboard.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#003a5e] text-white text-xs font-semibold hover:bg-[#002d4a] transition-all shadow-md active:scale-[0.98]"
          >
            <RotateCcw className="size-3.5" />
            Reload section
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
