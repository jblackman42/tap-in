"use client";

import { useRouter } from "next/navigation";
import type { FibOrFableState } from "../types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface FinalScoresProps {
  state: FibOrFableState;
  players: Player[];
  playerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onVotePlayAgain: () => void;
}

export function FinalScores({
  state,
  players,
  playerId,
  isHost,
  onPlayAgain,
  onVotePlayAgain,
}: FinalScoresProps) {
  const router = useRouter();

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  const sorted = Object.entries(state.scores).sort(([, a], [, b]) => b - a);
  const topScore = sorted[0]?.[1] ?? 0;
  const winners = sorted.filter(([, score]) => score === topScore);
  const isTie = winners.length > 1;

  const hasVoted = state.playAgainVotes.includes(playerId);
  const voterNames = state.playAgainVotes
    .filter((id) => id !== playerId)
    .map((id) => getPlayerName(id));

  return (
    <div className="flex-1 flex flex-col py-6 overflow-y-auto">
      <div className="text-center mb-8">
        <span className="inline-block bg-amber-500 text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#92400e] mb-3">
          Game Over
        </span>
        {isTie ? (
          <h2 className="text-3xl font-headline font-bold text-foreground uppercase tracking-tighter">
            It&apos;s a tie!
          </h2>
        ) : (
          <h2 className="text-4xl font-headline font-bold text-foreground uppercase tracking-tighter">
            {getPlayerName(winners[0][0])} wins!
          </h2>
        )}
        <p className="text-amber-500 font-headline font-bold text-2xl mt-1 tabular-nums">
          {topScore} points
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {sorted.map(([id, totalScore], idx) => {
          const roundBreakdown = state.roundScores[id] ?? [];

          return (
            <div
              key={id}
              className={`px-5 py-4 border-4 ${
                idx === 0
                  ? "bg-amber-50 border-amber-500 wobbly-br-1 shadow-[6px_6px_0px_0px_#92400e]"
                  : idx === 1
                    ? "bg-surface-high border-foreground/20 wobbly-br-2"
                    : idx === 2
                      ? "bg-secondary/10 border-secondary/30 wobbly-br-3"
                      : "bg-surface-low border-foreground/10 rounded-2xl"
              }`}
            >
              <div className="flex items-center justify-between">
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
                <span className="text-xl font-headline font-bold text-amber-500 tabular-nums">
                  {totalScore}
                </span>
              </div>

              {roundBreakdown.length > 0 && (
                <div className="mt-1.5 ml-9 flex gap-3 text-xs text-outline font-label tabular-nums">
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

      {voterNames.length > 0 && (
        <div className="mt-4 space-y-1">
          {voterNames.map((name) => (
            <p key={name} className="text-sm text-amber-700 text-center font-label font-bold">
              {name} wants to play again!
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2 mt-6">
        {isHost ? (
          <Button size="lg" className="w-full" onClick={onPlayAgain}>
            Play Again
          </Button>
        ) : hasVoted ? (
          <Button size="lg" className="w-full" disabled>
            Voted! Waiting on host…
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={onVotePlayAgain}>
            Vote to Play Again
          </Button>
        )}
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
