'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-8 shadow-2xl text-center">
        <div className="size-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 ring-8 ring-amber-500/5">
          <AlertTriangle className="size-8" />
        </div>
        
        <h1 className="text-xl font-extrabold text-[#003a5e] mb-2 tracking-tight">
          Something went wrong
        </h1>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          An unexpected system exception occurred. Your session data and agreements remain safely encrypted.
        </p>

        {error?.digest && (
          <div className="mb-6 p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-500 break-all">
            Error Ref: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#003a5e] text-white text-sm font-semibold hover:bg-[#002d4a] transition-all shadow-md active:scale-[0.98]"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
          
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <Home className="size-4" />
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
