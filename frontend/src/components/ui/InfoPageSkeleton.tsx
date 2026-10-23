import Skeleton from './Skeleton';

type InfoPageSkeletonProps = {
  variant?: 'article' | 'careers' | 'contact';
};

export default function InfoPageSkeleton({ variant = 'article' }: InfoPageSkeletonProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 md:py-20">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <Skeleton className="mx-auto h-7 w-24 rounded-full" />
        <Skeleton className="mx-auto h-11 w-full max-w-xl" />
        <Skeleton className="mx-auto h-5 w-4/5 max-w-lg" />
      </header>

      {variant === 'article' && (
        <article className="mt-14 space-y-8 rounded-3xl border border-[#e8ecf3] bg-white p-7 shadow-sm sm:p-10">
          <Skeleton className="h-20 w-full rounded-2xl" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 border-t border-[#e8ecf3] pt-8 first:border-t-0 first:pt-0">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </article>
      )}

      {variant === 'careers' && (
        <div className="mt-16 space-y-14">
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex flex-col gap-5 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="w-full space-y-3">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-6 w-60" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                </div>
                <Skeleton variant="button" className="h-10 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'contact' && (
        <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-5">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="space-y-5 rounded-3xl border border-[#e8ecf3] bg-white p-7 shadow-sm">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-4/5" />
              </div>
            ))}
          </div>
          <div className="space-y-5 rounded-3xl border border-[#e8ecf3] bg-white p-7 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton variant="button" className="h-11 w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
