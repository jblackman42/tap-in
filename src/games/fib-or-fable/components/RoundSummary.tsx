"use client";

import type { FibOrFableState } from "../types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface RoundSummaryProps {
  state: FibOrFableState;
  players: Player[];
  playerId: string;
  isHost: boolean;
  onStartNextRound: () => void;
}

export function RoundSummary({
  state,
  players,
  playerId,
  isHost,
  onStartNextRound,
}: RoundSummaryProps) {
  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  const sorted = Object.entries(state.scores).sort(([, a], [, b]) => b - a);
  const nextRound = state.round + 1;

  return (
    <div className="flex-1 flex flex-col py-6">
      <div className="text-center mb-6">
        <span className="inline-block bg-amber-500 text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#92400e] mb-3">
          End of Round {state.round}
        </span>
        <h2 className="text-3xl font-headline font-bold text-foreground uppercase tracking-tighter">Standings</h2>
      </div>

      <div className="space-y-3 flex-1">
        {sorted.map(([id, totalScore], idx) => {
          const roundScore = state.roundScores[id]?.[state.round - 1] ?? 0;

          return (
            <div
              key={id}
              className={`flex items-center justify-between px-5 py-4 border-4 ${
                idx === 0
                  ? "bg-amber-50 border-amber-500 wobbly-br-1 shadow-[6px_6px_0px_0px_#92400e]"
                  : "bg-surface-low border-foreground/10 wobbly-br-2"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-headline font-bold text-outline w-6 text-center tabular-nums">
                  {idx + 1}
                </span>
                <span className="font-body font-semibold text-foreground">
                  {getPlayerName(id)}
                  {id === playerId && (
                    <span className="text-outline ml-1 font-label text-xs">(you)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {roundScore > 0 && (
                  <span className="text-sm font-headline font-bold text-green-600">
                    +{roundScore}
                  </span>
                )}
                <span className="text-xl font-headline font-bold text-amber-500 tabular-nums">
                  {totalScore}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <Button size="lg" className="w-full mt-6" onClick={onStartNextRound}>
          Start Round {nextRound}
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-outline font-label text-sm mt-6 uppercase tracking-wider">
          Waiting for the host to start Round {nextRound}…
        </p>
      )}
    </div>
  );
}
