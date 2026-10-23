import Skeleton from '@/components/ui/Skeleton';

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl border border-hairline bg-white shadow-raised space-y-6 animate-window-slide-up">
      <div className="text-center space-y-2">
        <Skeleton variant="circle" className="h-12 w-12 mx-auto" />
        <Skeleton variant="text" className="h-6 w-40 mx-auto" />
        <Skeleton variant="text" className="h-3.5 w-60 mx-auto" />
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" className="h-10 w-full rounded-xl" />
        <Skeleton variant="text" className="h-10 w-full rounded-xl" />
        <Skeleton variant="button" className="h-11 w-full bg-primary/20 rounded-full" />
      </div>
    </div>
  );
}
