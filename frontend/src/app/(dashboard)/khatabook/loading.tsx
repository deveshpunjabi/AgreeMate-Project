import Skeleton from '@/components/ui/Skeleton';

export default function KhatabookLoading() {
  return (
    <div className="space-y-6 select-none animate-window-slide-up">
      <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 shadow-xl flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-[#003a5e]/15" />
          <Skeleton className="h-4 w-72 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-36 bg-[#003a5e]/20 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[24px] p-5 shadow-xl space-y-3">
            <Skeleton className="h-3 w-24 bg-slate-200" />
            <Skeleton className="h-7 w-20 bg-[#003a5e]/20" />
          </div>
        ))}
      </div>

      <div className="bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 shadow-xl space-y-4">
        <Skeleton className="h-5 w-40 bg-[#003a5e]/15" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
