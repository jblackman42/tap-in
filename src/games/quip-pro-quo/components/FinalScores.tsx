"use client";

import { useRouter } from "next/navigation";
import type { QuipProQuoState } from "../types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface FinalScoresProps {
  state: QuipProQuoState;
  players: Player[];
  playerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
}

export function FinalScores({
  state,
  players,
  playerId,
  isHost,
  onPlayAgain,
}: FinalScoresProps) {
  const router = useRouter();

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  const sorted = Object.entries(state.scores).sort(([, a], [, b]) => b - a);
  const topScore = sorted[0]?.[1] ?? 0;
  const winners = sorted.filter(([, score]) => score === topScore);
  const isTie = winners.length > 1;

  return (
    <div className="flex-1 flex flex-col py-6 overflow-y-auto">
      <div className="text-center mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
          Game Over
        </p>
        {isTie ? (
          <h2 className="text-2xl font-bold text-violet-950">
            It&apos;s a tie!
          </h2>
        ) : (
          <h2 className="text-3xl font-black text-violet-950">
            {getPlayerName(winners[0][0])} wins!
          </h2>
        )}
        <p className="text-violet-600 font-bold text-xl mt-1 tabular-nums">
          {topScore} points
        </p>
      </div>

      <div className="space-y-2 flex-1">
        {sorted.map(([id, totalScore], idx) => {
          const roundBreakdown = state.roundScores[id] ?? [];

          return (
            <div
              key={id}
              className={`px-4 py-3 rounded-xl ${
                idx === 0
                  ? "bg-yellow-50 ring-2 ring-yellow-400"
                  : idx === 1
                    ? "bg-gray-100 ring-1 ring-gray-300"
                    : idx === 2
                      ? "bg-amber-50 ring-1 ring-amber-300"
                      : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
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
                <span className="text-xl font-bold text-violet-600 tabular-nums">
                  {totalScore}
                </span>
              </div>

              {roundBreakdown.length > 0 && (
                <div className="mt-1.5 ml-9 flex gap-3 text-xs text-gray-500 tabular-nums">
                  {roundBreakdown.map((score, ri) => (
                    <span key={ri}>
                      R{ri + 1}: {score}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 mt-6">
        <Button
          size="lg"
          className="w-full"
          onClick={onPlayAgain}
        >
          Play Again
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => router.push("/")}
        >
          Leave
        </Button>
      </div>
    </div>
  );
}
