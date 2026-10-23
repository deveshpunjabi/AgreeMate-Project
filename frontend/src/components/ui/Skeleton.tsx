'use client';

import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'avatar' | 'button' | 'stat';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rect',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-3.5 w-full rounded-md',
    rect: 'h-24 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-48 w-full rounded-2xl border border-hairline',
    avatar: 'h-9 w-9 rounded-full',
    button: 'h-10 w-28 rounded-full',
    stat: 'h-28 w-full rounded-2xl',
  };

  const style: CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      style={style}
      aria-hidden="true"
      className={`shrink-0 skeleton-shimmer ${variantClasses[variant]} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <Skeleton variant="avatar" className="h-9 w-9" />
        <Skeleton variant="text" className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton variant="text" className="h-5 w-3/4" />
      <Skeleton variant="text" className="h-3.5 w-1/2" />
      <div className="pt-2 flex items-center justify-between border-t border-hairline">
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="button" className="h-7 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-soft/60 px-6 py-4">
        <Skeleton variant="text" className="h-5 w-36" />
        <Skeleton variant="button" className="h-9 w-28" />
      </div>
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton variant="avatar" className="h-9 w-9" />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="h-4 w-40" />
                <Skeleton variant="text" className="h-3 w-24" />
              </div>
            </div>
            <Skeleton variant="text" className="h-4 w-20 hidden sm:block" />
            <Skeleton variant="text" className="h-6 w-16 rounded-full" />
            <Skeleton variant="avatar" className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
