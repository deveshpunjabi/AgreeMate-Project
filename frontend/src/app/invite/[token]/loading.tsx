import Skeleton from '@/components/ui/Skeleton';

export default function InviteLoading() {
  return (
    <main className="flex min-h-dvh items-center bg-canvas px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-[#e8ecf3] bg-white shadow-sm">
        <header className="space-y-3 border-b border-[#e8ecf3] bg-slate-50 p-7 sm:p-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-4 w-44" />
        </header>
        <div className="space-y-6 p-7 sm:p-8">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="flex gap-4 rounded-2xl border border-[#e8ecf3] p-5">
            <Skeleton className="size-16 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#e8ecf3] p-5">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 gap-5">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="flex gap-3 border-t border-[#e8ecf3] bg-slate-50 p-6">
          <Skeleton variant="button" className="h-10 flex-1 rounded-xl" />
          <Skeleton variant="button" className="h-10 flex-[2] rounded-xl" />
        </footer>
      </div>
    </main>
  );
}
