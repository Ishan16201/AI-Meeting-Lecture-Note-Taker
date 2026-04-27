"use client";

export function MeetingCardSkeleton() {
  return (
    <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <div className="h-5 bg-slate-800 rounded w-1/3 mb-3" />
          
          {/* Date and Duration */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-4 bg-slate-800 rounded w-24" />
            <div className="h-4 bg-slate-800 rounded w-20" />
          </div>
          
          {/* Speaker count */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-slate-800 rounded w-4" />
            <div className="h-4 bg-slate-800 rounded w-16" />
          </div>
        </div>
        
        {/* Status badge */}
        <div className="h-6 bg-slate-800 rounded-full w-20" />
      </div>
      
      {/* Action button placeholder */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
        <div className="h-8 bg-slate-800 rounded w-24" />
      </div>
    </div>
  );
}
