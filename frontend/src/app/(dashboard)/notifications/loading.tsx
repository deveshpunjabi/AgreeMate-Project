import Skeleton from '@/components/ui/Skeleton';

export default function NotificationsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-window-slide-up">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton variant="button" className="h-10 w-36 rounded-xl" />
      </div>
      <div className="rounded-3xl border border-[#e8ecf3] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e8ecf3] px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="divide-y divide-[#e8ecf3] px-6">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex gap-3 py-4">
              <Skeleton className="size-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
