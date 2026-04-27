"use client";

import { useEffect, useState } from "react";

interface LiveBadgeProps {
  isRecording: boolean;
}

export function LiveBadge({ isRecording }: LiveBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setVisible(true);
    } else {
      // Delay hiding for fade-out animation
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  if (!visible && !isRecording) return null;

  return (
    <div
      className={`flex items-center gap-2 transition-opacity duration-300 ${
        isRecording ? "opacity-100" : "opacity-0"
      }`}
      data-testid="live-badge"
    >
      {/* Pulsing red dot */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-safe:animate-[ping_0.8s_ease-in-out_infinite]" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
      
      {/* REC text in DM Mono */}
      <span className="font-mono text-sm font-medium text-red-400 tracking-wider">
        REC
      </span>
    </div>
  );
}
