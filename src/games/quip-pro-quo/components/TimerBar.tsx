"use client";

import { useEffect, useState } from "react";

interface TimerBarProps {
  timerEndsAt: number | null;
  isHost: boolean;
  onTimerExpired: () => void;
}

export function TimerBar({ timerEndsAt, isHost, onTimerExpired }: TimerBarProps) {
  const [progress, setProgress] = useState(1);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timerEndsAt) return;

    const totalDuration = timerEndsAt - Date.now();
    if (totalDuration <= 0) {
      setProgress(0);
      setRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const left = timerEndsAt - Date.now();
      if (left <= 0) {
        setProgress(0);
        setRemaining(0);
        clearInterval(interval);
        if (isHost) onTimerExpired();
        return;
      }
      setProgress(left / totalDuration);
      setRemaining(Math.ceil(left / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [timerEndsAt, isHost, onTimerExpired]);

  if (!timerEndsAt) return null;

  const isLow = remaining <= 10;

  return (
    <div className="w-full space-y-1">
      <div className="h-2 bg-surface-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            isLow ? "bg-primary" : "bg-[#ff3d91]"
          }`}
          style={{
            width: `${progress * 100}%`,
            boxShadow: isLow ? "0 0 15px rgba(187,0,88,0.6)" : "0 0 10px rgba(255,61,145,0.4)",
          }}
        />
      </div>
      <p className={`text-xs text-right tabular-nums font-label font-bold ${isLow ? "text-primary" : "text-outline"}`}>
        {remaining}s
      </p>
    </div>
  );
}
