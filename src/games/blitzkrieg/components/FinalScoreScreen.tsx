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
    <div className="flex flex-col items-center justify-center min-h-svh bg-[#1c1b1b] px-6 py-10 text-center gap-6 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] memphis-dots" />

      {/* Winner announcement */}
      <div className="relative z-10 space-y-2">
        <span className="inline-block bg-tertiary-container text-foreground px-4 py-1 rounded-full font-label font-bold text-xs uppercase tracking-widest">
          Game Over
        </span>
        <h1 className="font-headline font-bold text-4xl text-white uppercase tracking-tighter">
          {winner?.name} wins!
        </h1>
        <p className="text-tertiary-container font-headline font-bold text-2xl">{winnerScore} points</p>
      </div>

      {/* Final standings */}
      <div className="w-full max-w-xs space-y-2 relative z-10">
        {sorted.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 ${
              idx === 0
                ? "bg-tertiary-container/20 border-tertiary-container"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-headline font-bold text-white/40 w-4">
                {idx + 1}
              </span>
              <span className="font-body font-semibold text-white text-sm">
                {p.name}
              </span>
            </div>
            <span className="text-lg font-headline font-bold text-tertiary-container tabular-nums">
              {scores[p.id] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Score history chart */}
      <div className="w-full max-w-xs relative z-10">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-label mb-2">
          Score progression
        </p>
        <ScoreChart players={players} scoreHistory={scoreHistory} />
        <div className="flex items-center justify-center gap-3 mt-2">
          {players.map((p, pi) => (
            <div key={p.id} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#c3f400", "#bb0058", "#006970", "#ff3d91"][
                    pi % 4
                  ],
                }}
              />
              <span className="text-[10px] text-white/50 font-label">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-2 mt-2 relative z-10">
        <Button size="lg" className="w-full" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-white/50"
          onClick={onLeave}
        >
          Leave
        </Button>
      </div>
    </div>
  );
}
