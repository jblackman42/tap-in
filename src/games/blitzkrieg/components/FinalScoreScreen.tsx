"use client";

import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";
import { ScoreChart } from "./ScoreChart";

interface FinalScoreScreenProps {
  players: Player[];
  scores: Record<string, number>;
  scoreHistory: Record<string, number[]>;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function FinalScoreScreen({
  players,
  scores,
  scoreHistory,
  onPlayAgain,
  onLeave,
}: FinalScoreScreenProps) {
  const sorted = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );
  const winner = sorted[0];
  const winnerScore = scores[winner?.id] ?? 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-white px-6 py-10 text-center gap-6">
      {/* Winner announcement */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">
          Game Over
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          {winner?.name} wins!
        </h1>
        <p className="text-violet-600 font-bold text-xl mt-1">{winnerScore} points</p>
      </div>

      {/* Final standings */}
      <div className="w-full max-w-xs space-y-1.5">
        {sorted.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
              idx === 0
                ? "bg-yellow-50 ring-2 ring-yellow-400"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-gray-400 w-4">
                {idx + 1}
              </span>
              <span className="font-medium text-gray-900 text-sm">
                {p.name}
              </span>
            </div>
            <span className="text-lg font-bold text-violet-600 tabular-nums">
              {scores[p.id] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Score history chart */}
      <div className="w-full max-w-xs">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
          Score progression
        </p>
        <ScoreChart players={players} scoreHistory={scoreHistory} />
        <div className="flex items-center justify-center gap-3 mt-2">
          {players.map((p, pi) => (
            <div key={p.id} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#7c3aed", "#ef4444", "#3b82f6", "#10b981"][
                    pi % 4
                  ],
                }}
              />
              <span className="text-[10px] text-gray-500">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-2 mt-2">
        <Button size="lg" className="w-full" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onLeave}
        >
          Leave
        </Button>
      </div>
    </div>
  );
}
