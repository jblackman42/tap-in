"use client";

import type { QuipProQuoState } from "../types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface RoundSummaryProps {
  state: QuipProQuoState;
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
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          End of Round {state.round}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Standings</h2>
      </div>

      <div className="space-y-2 flex-1">
        {sorted.map(([id, totalScore], idx) => {
          const roundScore = state.roundScores[id]?.[state.round - 1] ?? 0;

          return (
            <div
              key={id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                idx === 0
                  ? "bg-violet-50 ring-2 ring-violet-400"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6 text-center tabular-nums">
                  {idx + 1}
                </span>
                <span className="font-medium text-gray-900">
                  {getPlayerName(id)}
                  {id === playerId && (
                    <span className="text-gray-400 ml-1">(you)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {roundScore > 0 && (
                  <span className="text-sm font-semibold text-green-600">
                    +{roundScore}
                  </span>
                )}
                <span className="text-xl font-bold text-violet-600 tabular-nums">
                  {totalScore}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={onStartNextRound}
        >
          Start Round {nextRound}{nextRound === 3 ? " — Thriplash" : ""}
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-gray-400 text-sm mt-6">
          Waiting for the host to start Round {nextRound}…
        </p>
      )}
    </div>
  );
}
