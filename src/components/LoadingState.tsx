import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-violet-400" />
        <span className="text-sm text-ink-300">{message}</span>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-8 w-32 rounded mb-2" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
      <div className="skeleton h-4 w-28 rounded" />
    </div>
  );
}
