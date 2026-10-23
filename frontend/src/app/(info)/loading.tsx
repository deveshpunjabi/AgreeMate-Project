import Skeleton from '@/components/ui/Skeleton';

export default function InfoLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 space-y-8 animate-window-slide-up">
      {/* Title & Badge Skeleton */}
      <div className="space-y-4 text-center">
        <Skeleton variant="text" className="mx-auto h-6 w-28 rounded-full bg-primary/10" />
        <Skeleton variant="text" className="mx-auto h-10 w-3/4 max-w-lg" />
        <Skeleton variant="text" className="mx-auto h-4 w-1/2 max-w-md" />
      </div>

      {/* Article Content Wireframe Card */}
      <div className="rounded-3xl border border-hairline bg-white p-8 sm:p-12 shadow-sm space-y-6">
        <Skeleton variant="text" className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-11/12" />
          <Skeleton variant="text" className="h-4 w-4/5" />
        </div>

        <div className="pt-4 border-t border-hairline space-y-4">
          <Skeleton variant="text" className="h-5 w-40" />
          <div className="space-y-2.5">
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-3/4" />
          </div>
        </div>

        <div className="pt-4 border-t border-hairline space-y-4">
          <Skeleton variant="text" className="h-5 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton variant="card" className="h-24 w-full rounded-2xl" />
            <Skeleton variant="card" className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
