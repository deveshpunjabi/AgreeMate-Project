import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#e8ecf3] bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-[#003a5e]">
          <FileQuestion className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-semibold tabular-nums text-slate-500">Error 404</p>
        <h1 className="mt-2 text-balance font-display text-3xl font-extrabold text-[#003a5e]">Page not found</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-[#1e2c3a]/70">
          The link may be outdated, or the page may no longer be available.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#003a5e] px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#005080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </main>
  );
}
