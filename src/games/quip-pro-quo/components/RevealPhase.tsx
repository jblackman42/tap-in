"use client";

import { useEffect, useState } from "react";
import type { Matchup } from "../types";
import type { Player } from "@/lib/party/types";
import { VoteBar } from "./VoteBar";
import { Button } from "@/components/ui/Button";
import { getPointsPerVote } from "../scoring";

const ANSWER_LABELS = ["A", "B", "C"];
const AUTO_ADVANCE_MS = 8000;

interface RevealPhaseProps {
  matchup: Matchup;
  matchupIndex: number;
  totalMatchups: number;
  round: number;
  players: Player[];
  playerId: string;
  isHost: boolean;
  scores: Record<string, number>;
  onAdvance: () => void;
}

export function RevealPhase({
  matchup,
  matchupIndex,
  totalMatchups,
  round,
  players,
  playerId,
  isHost,
  onAdvance,
}: RevealPhaseProps) {
  const [showQPQ, setShowQPQ] = useState(matchup.quipProQuo);

  useEffect(() => {
    if (matchup.quipProQuo) {
      const timer = setTimeout(() => setShowQPQ(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [matchup.quipProQuo]);

  useEffect(() => {
    if (!isHost) return;
    const timer = setTimeout(onAdvance, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [isHost, onAdvance]);

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  const maxPossibleVotes = matchup.eligibleVoterIds.length;
  const ppv = getPointsPerVote(round);
  const isLast = matchupIndex + 1 >= totalMatchups;

  if (showQPQ) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-qpq-celebration">
          <p className="text-5xl font-headline font-bold text-[#ff3d91] uppercase tracking-tighter drop-shadow-[4px_4px_0px_#006970] mb-2">
            Quip Pro Quo!
          </p>
          <p className="text-lg text-secondary font-headline font-bold uppercase">
            Unanimous vote — +500 bonus!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block bg-tertiary-container text-foreground font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#506600]">
          Round {round}{matchup.isRound3 ? " — Thriplash" : ""}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Matchup {matchupIndex + 1}/{totalMatchups}
        </span>
      </div>

      <div className="bg-surface-low rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-5 mb-5 border-4 border-foreground shadow-[8px_8px_0px_0px_#006970]">
        <p className="text-base font-headline font-bold text-foreground text-center leading-relaxed">
          {matchup.promptText}
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {matchup.answers.map((answer, i) => {
          const voteCount = matchup.voteCounts[answer.answerId] ?? 0;
          const pts = matchup.pointsAwarded[answer.playerId] ?? 0;
          const isWinner = voteCount === Math.max(...Object.values(matchup.voteCounts)) && voteCount > 0;

          return (
            <div
              key={answer.answerId}
              className={`px-5 py-5 transition-all border-4 ${
                isWinner ? "border-[#ff3d91] bg-[#ff3d91]/10 wobbly-br-1 shadow-[6px_6px_0px_0px_#bb0058]" : "border-foreground/10 bg-surface-low wobbly-br-2"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-xl border-2 border-foreground font-headline font-bold flex items-center justify-center text-xs ${
                  isWinner ? "bg-[#ff3d91] text-white" : "bg-surface-highest text-foreground"
                }`}>
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-body font-semibold break-words">
                    {answer.text || "…"}
                  </p>
                  <p className="text-xs text-[#ff3d91] font-headline font-bold mt-1 uppercase">
                    — {getPlayerName(answer.playerId)}
                    {answer.playerId === playerId && " (you)"}
                  </p>
                  <div className="mt-2">
                    <VoteBar
                      count={voteCount}
                      maxCount={maxPossibleVotes}
                      color={isWinner ? "violet" : "amber"}
                    />
                  </div>
                </div>
              </div>

              {pts > 0 && (
                <div className="mt-2 text-right">
                  <span className="text-xs font-headline font-bold text-[#ff3d91] bg-[#ff3d91]/10 px-2 py-0.5 rounded-full">
                    +{pts} pts
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isHost && (
        <Button
          size="md"
          className="w-full mt-4"
          onClick={onAdvance}
        >
          {isLast
            ? round >= 3
              ? "See Final Scores"
              : "Round Summary"
            : "Next Matchup"
          }
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-xs text-outline font-label mt-4 uppercase tracking-wider">
          Host will advance…
        </p>
      )}
    </div>
  );
}
