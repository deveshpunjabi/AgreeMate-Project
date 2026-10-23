import Skeleton from '@/components/ui/Skeleton';

export default function AgreementsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-window-slide-up">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-64" /></div>
        <Skeleton variant="button" className="h-10 w-40 rounded-xl" />
      </div>
      <div className="flex gap-3 rounded-2xl border border-[#e8ecf3] bg-white p-4 shadow-sm"><Skeleton className="h-10 flex-1 rounded-xl" /><Skeleton className="hidden h-10 w-52 rounded-xl sm:block" /></div>
      <div className="rounded-3xl border border-[#e8ecf3] bg-white px-6 shadow-sm">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center justify-between gap-4 border-b border-[#e8ecf3] py-5 last:border-0"><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-36" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>)}
      </div>
    </div>
  );
}
