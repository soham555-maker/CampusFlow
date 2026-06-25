"use client";

import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white/5 animate-pulse",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5 }: SkeletonProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="border-b border-white/5 px-5 py-3.5 flex gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/5 last:border-0 px-5 py-4 flex gap-8">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("glass-panel rounded-xl p-5 space-y-3", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export default Skeleton;
