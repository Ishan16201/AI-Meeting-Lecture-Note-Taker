"use client";

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  showAvatar = false,
  className = "",
}: SkeletonCardProps) {
  // Generate varied widths for lines (100%, 75%, 50% pattern)
  const getWidth = (index: number): string => {
    const pattern = ["100%", "75%", "50%"];
    return pattern[index % 3];
  };

  return (
    <div
      className={`bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-pulse ${className}`}
      data-testid="skeleton-card"
    >
      <div className="flex items-start gap-4">
        {showAvatar && (
          <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-slate-800 rounded"
              style={{ width: getWidth(index) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized skeleton for utterance blocks
export function SkeletonUtterance({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-4 p-4 rounded-lg bg-white/[0.02] border-l-2 border-l-slate-800 ${className}`}
      data-testid="skeleton-utterance"
    >
      {/* Speaker badge skeleton */}
      <div className="flex-shrink-0 w-32 space-y-2">
        <div className="h-5 w-20 bg-slate-800 rounded" />
        <div className="h-3 w-16 bg-slate-800 rounded" />
      </div>

      {/* Transcript text skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full bg-slate-800 rounded" />
        <div className="h-4 w-3/4 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

// Specialized skeleton for summary sections
export function SkeletonSummary({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} data-testid="skeleton-summary">
      {/* TLDR skeleton */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/20 rounded-xl p-6 space-y-3">
        <div className="h-5 w-16 bg-slate-800 rounded" />
        <div className="h-4 w-full bg-slate-800 rounded" />
        <div className="h-4 w-3/4 bg-slate-800 rounded" />
      </div>

      {/* Key Decisions skeleton */}
      <div className="bg-white/[0.02] rounded-xl p-6 space-y-3">
        <div className="h-5 w-32 bg-slate-800 rounded mb-4" />
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0" />
          <div className="flex-1 h-4 bg-slate-800 rounded" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0" />
          <div className="flex-1 h-4 bg-slate-800 rounded" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0" />
          <div className="flex-1 h-4 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Action Items skeleton */}
      <div className="bg-white/[0.02] rounded-xl p-6">
        <div className="h-5 w-28 bg-slate-800 rounded mb-4" />
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-slate-800 rounded" />
            <div className="flex-1 h-8 bg-slate-800 rounded" />
            <div className="h-8 w-20 bg-slate-800 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-slate-800 rounded" />
            <div className="flex-1 h-8 bg-slate-800 rounded" />
            <div className="h-8 w-20 bg-slate-800 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-slate-800 rounded" />
            <div className="flex-1 h-8 bg-slate-800 rounded" />
            <div className="h-8 w-20 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
