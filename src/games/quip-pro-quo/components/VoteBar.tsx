"use client";

interface VoteBarProps {
  count: number;
  maxCount: number;
  color?: "violet" | "amber";
}

export function VoteBar({ count, maxCount, color = "violet" }: VoteBarProps) {
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const bg = color === "violet" ? "bg-violet-500" : "bg-amber-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${bg}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums text-gray-700 w-6 text-right">
        {count}
      </span>
    </div>
  );
}
