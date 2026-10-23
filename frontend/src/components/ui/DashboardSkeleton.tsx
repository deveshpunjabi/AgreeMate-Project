import Skeleton, { SkeletonTable } from './Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-window-slide-up">
      <div className="flex flex-col gap-5 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-3 w-20" />
          <Skeleton variant="text" className="h-8 w-56" />
          <Skeleton variant="text" className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton variant="button" className="h-10 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-[#e8ecf3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="h-4 w-24" />
              <Skeleton variant="avatar" className="size-9 rounded-xl" />
            </div>
            <Skeleton variant="text" className="h-8 w-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="space-y-2 border-b border-[#e8ecf3] pb-4">
            <Skeleton variant="text" className="h-5 w-40" />
            <Skeleton variant="text" className="h-4 w-56" />
          </div>
          <SkeletonTable rows={4} />
        </div>
        <div className="space-y-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm">
          <div className="space-y-2 border-b border-[#e8ecf3] pb-4">
            <Skeleton variant="text" className="h-5 w-32" />
            <Skeleton variant="text" className="h-4 w-44" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-hairline last:border-0">
                <Skeleton variant="avatar" className="size-8 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" className="h-3.5 w-full" />
                  <Skeleton variant="text" className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
