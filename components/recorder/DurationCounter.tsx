"use client";

interface DurationCounterProps {
  seconds: number;
}

export function DurationCounter({ seconds }: DurationCounterProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, "0");
  };

  // Determine color based on duration
  const getColorClass = (): string => {
    if (seconds >= 90 * 60) {
      return "text-red-400"; // Red after 90 minutes
    }
    if (seconds >= 50 * 60) {
      return "text-amber-400"; // Amber after 50 minutes
    }
    return "text-white";
  };

  return (
    <div
      className={`font-mono text-4xl font-bold tracking-wider ${getColorClass()}`}
      data-testid="duration-counter"
    >
      <span className="motion-safe:animate-[digit-flip_0.3s_ease-out]">
        {formatNumber(mins)}
      </span>
      <span className="motion-safe:animate-pulse">:</span>
      <span className="motion-safe:animate-[digit-flip_0.3s_ease-out]">
        {formatNumber(secs)}
      </span>
    </div>
  );
}
