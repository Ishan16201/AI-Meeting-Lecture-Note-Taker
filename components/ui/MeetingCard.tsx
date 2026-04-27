interface MeetingCardProps {
  title: string;
  date: string;
  duration: string;
  speakerCount: number;
  status: "processing" | "ready" | "failed";
  compact?: boolean;
}

export function MeetingCard({
  status,
  compact = false,
}: MeetingCardProps) {
  const statusConfig = {
    processing: {
      label: "Processing",
      bgColor: "bg-[#7C3AED]/20",
      textColor: "text-[#7C3AED]",
      borderColor: "border-[#7C3AED]/30",
      dotColor: "bg-[#7C3AED]",
    },
    ready: {
      label: "Ready",
      bgColor: "bg-[#22D3EE]/20",
      textColor: "text-[#22D3EE]",
      borderColor: "border-[#22D3EE]/30",
      dotColor: "bg-[#22D3EE]",
    },
    failed: {
      label: "Failed",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
      borderColor: "border-red-500/30",
      dotColor: "bg-red-500",
    },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${
            status === "processing" ? "animate-pulse" : ""
          }`}
        />
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 group`}
    >
      {/* Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${
              status === "processing" ? "animate-pulse" : ""
            }`}
          />
          {config.label}
        </span>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#7C3AED]/5 to-[#22D3EE]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
