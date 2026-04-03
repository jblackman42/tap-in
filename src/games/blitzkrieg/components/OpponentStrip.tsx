"use client";

import type { Player } from "@/lib/party/types";

interface OpponentStripProps {
  players: Player[];
  blitzCounts: Record<string, number>;
  currentPlayerId: string;
}

export function OpponentStrip({
  players,
  blitzCounts,
  currentPlayerId,
}: OpponentStripProps) {
  const opponents = players.filter((p) => p.id !== currentPlayerId);

  if (opponents.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-2">
      {opponents.map((p) => {
        const count = blitzCounts[p.id] ?? 0;
        const isLow = count <= 3;

        return (
          <div
            key={p.id}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              transition-colors duration-200
              ${
                isLow
                  ? "bg-red-100 text-red-700 animate-[pulse_2s_ease-in-out_1]"
                  : "bg-gray-100 text-gray-600"
              }
            `}
          >
            <span className="truncate max-w-16">{p.name}</span>
            <span className="tabular-nums font-bold">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
