"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Utterance {
  speaker: string;
  start: number;
  end: number;
  transcript: string;
}

interface TranscriptViewProps {
  utterances: Utterance[];
  isLoading?: boolean;
}

function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getSpeakerColor(speaker: string): string {
  // Speaker A = violet, Speaker B = cyan, others = slate
  if (speaker === "Speaker A") {
    return "border-l-[#7C3AED]";
  } else if (speaker === "Speaker B") {
    return "border-l-[#22D3EE]";
  }
  return "border-l-white/30";
}

function getSpeakerBadgeColor(speaker: string): string {
  if (speaker === "Speaker A") {
    return "bg-[#7C3AED]/20 text-[#7C3AED]";
  } else if (speaker === "Speaker B") {
    return "bg-[#22D3EE]/20 text-[#22D3EE]";
  }
  return "bg-white/10 text-white/70";
}

// Skeleton utterance for loading state
function SkeletonUtterance() {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-white/[0.02] border-l-2 border-l-slate-800 animate-pulse">
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

export function TranscriptView({ utterances, isLoading = false }: TranscriptViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const plainText = utterances
      .map((u) => `[${u.speaker}] [${formatTimestamp(u.start)}] ${u.transcript}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden" data-testid="transcript-view">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Transcript</h3>
        {!isLoading && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Utterances */}
      <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          // Loading skeletons - 8 utterance blocks
          Array.from({ length: 8 }).map((_, index) => (
            <SkeletonUtterance key={index} />
          ))
        ) : utterances.length === 0 ? (
          <p className="text-white/50 text-center py-8">No transcript available</p>
        ) : (
          utterances.map((utterance, index) => (
            <div
              key={index}
              className={`flex gap-4 p-4 rounded-lg bg-white/[0.02] border-l-2 ${getSpeakerColor(
                utterance.speaker
              )}`}
            >
              {/* Speaker & Timestamp */}
              <div className="flex-shrink-0 w-32">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSpeakerBadgeColor(
                    utterance.speaker
                  )}`}
                >
                  {utterance.speaker}
                </span>
                <p className="mt-1 text-xs text-white/40 font-mono">
                  {formatTimestamp(utterance.start)}
                </p>
              </div>

              {/* Transcript Text */}
              <p className="text-white/90 leading-relaxed flex-1">
                {utterance.transcript}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
