"use client";

import type { Player } from "@/lib/party/types";

interface ScoreStripProps {
  players: Player[];
  scores: Record<string, number>;
  currentPlayerId: string;
}

export function ScoreStrip({ players, scores, currentPlayerId }: ScoreStripProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-2 py-1.5 bg-[#2a2929] rounded-xl border border-tertiary-container/20">
      {players.map((p) => {
        const isCurrent = p.id === currentPlayerId;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-1.5 text-xs font-label ${
              isCurrent ? "font-bold text-tertiary-container" : "text-white/50"
            }`}
          >
            <span className="truncate max-w-16">{p.name}</span>
            <span className={`tabular-nums font-bold ${isCurrent ? "text-primary" : ""}`}>
              {scores[p.id] ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}
