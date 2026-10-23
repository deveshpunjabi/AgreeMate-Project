import Skeleton from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-dvh bg-canvas animate-window-slide-up">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="hidden h-4 w-16 sm:block" />
          <Skeleton className="hidden h-4 w-16 sm:block" />
          <Skeleton variant="button" className="h-9 w-24 rounded-xl" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-12 w-full max-w-xl" />
            <Skeleton className="h-12 w-4/5 max-w-lg" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-5 w-3/4 max-w-md" />
            <div className="flex gap-3 pt-3">
              <Skeleton variant="button" className="h-11 w-36 rounded-xl" />
              <Skeleton variant="button" className="h-11 w-28 rounded-xl" />
            </div>
          </div>
          <div className="rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:p-8">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-6 h-10 w-full" />
            <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-[#e8ecf3] bg-white p-6 shadow-sm">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="mt-5 h-5 w-36" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
