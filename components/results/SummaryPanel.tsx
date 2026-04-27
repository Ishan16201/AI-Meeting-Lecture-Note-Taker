"use client";

import { CheckCircle2, AlertCircle, Calendar, User, FileText } from "lucide-react";

interface ActionItem {
  owner: string;
  task: string;
  deadline?: string;
}

interface Summary {
  tldr: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

interface SummaryPanelProps {
  summary: Summary;
  isLoading?: boolean;
}

// Skeleton components for loading state
function SkeletonTLDR() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/20 rounded-xl p-6 space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-slate-800 rounded" />
        <div className="h-5 w-16 bg-slate-800 rounded" />
      </div>
      <div className="h-4 w-full bg-slate-800 rounded" />
      <div className="h-4 w-3/4 bg-slate-800 rounded" />
    </div>
  );
}

function SkeletonKeyDecisions() {
  return (
    <div className="bg-white/[0.02] rounded-xl p-6 space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-slate-800 rounded" />
        <div className="h-5 w-32 bg-slate-800 rounded" />
      </div>
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
  );
}

function SkeletonActionItems() {
  return (
    <div className="bg-white/[0.02] rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-slate-800 rounded" />
        <div className="h-5 w-28 bg-slate-800 rounded" />
      </div>
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
  );
}

export function SummaryPanel({ summary, isLoading = false }: SummaryPanelProps) {
  const hasActionItems = summary?.actionItems && summary.actionItems.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="summary-panel">
        <SkeletonTLDR />
        <SkeletonKeyDecisions />
        <SkeletonActionItems />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="summary-panel">
      {/* TLDR Section */}
      <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#22D3EE]/5 backdrop-blur-sm border border-[#7C3AED]/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-[#7C3AED]" />
          <h3 className="text-lg font-semibold text-white">TL;DR</h3>
        </div>
        <blockquote className="text-white/90 leading-relaxed italic border-l-2 border-[#7C3AED] pl-4">
          {summary?.tldr || "No summary available."}
        </blockquote>
      </div>

      {/* Key Decisions */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-[#22D3EE]" />
          <h3 className="text-lg font-semibold text-white">Key Decisions</h3>
        </div>

        {summary?.keyDecisions && summary.keyDecisions.length > 0 ? (
          <ol className="space-y-3">
            {summary.keyDecisions.map((decision, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-white/80 leading-relaxed"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="pt-0.5">{decision}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-white/50 italic">No key decisions recorded.</p>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-[#7C3AED]" />
          <h3 className="text-lg font-semibold text-white">
            Action Items ({hasActionItems ? summary!.actionItems.length : 0})
          </h3>
        </div>

        {hasActionItems ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Owner
                    </div>
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Deadline
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary!.actionItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`${
                      item.deadline
                        ? "bg-amber-500/5"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-[#7C3AED]/20 text-[#7C3AED]">
                        <User className="w-3 h-3" />
                        {item.owner}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/90">{item.task}</td>
                    <td className="py-3 px-4">
                      {item.deadline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-amber-500/20 text-amber-400">
                          <Calendar className="w-3 h-3" />
                          {item.deadline}
                        </span>
                      ) : (
                        <span className="text-white/40 text-sm italic">
                          No deadline
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/50 italic">No action items recorded.</p>
        )}
      </div>
    </div>
  );
}
