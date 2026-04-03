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
  scores,
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

  const totalVotes = Object.values(matchup.voteCounts).reduce((a, b) => a + b, 0);
  const maxPossibleVotes = matchup.eligibleVoterIds.length;
  const ppv = getPointsPerVote(round);
  const isLast = matchupIndex + 1 >= totalMatchups;

  if (showQPQ) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-qpq-celebration">
          <p className="text-4xl font-black text-violet-600 mb-2">
            QUIP PRO QUO!
          </p>
          <p className="text-lg text-violet-500 font-medium">
            Unanimous vote — +500 bonus!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Round {round}{matchup.isRound3 ? " — Thriplash" : ""}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          Matchup {matchupIndex + 1}/{totalMatchups}
        </span>
      </div>

      <div className="bg-violet-50 rounded-2xl px-5 py-4 mb-5">
        <p className="text-base font-semibold text-violet-950 text-center leading-relaxed">
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
              className={`rounded-xl border-2 px-4 py-4 transition-all ${
                isWinner ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs ${
                  isWinner ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium break-words">
                    {answer.text || "…"}
                  </p>
                  <p className="text-xs text-violet-600 font-semibold mt-1">
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
                  <span className="text-xs font-bold text-violet-600">
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
        <p className="text-center text-xs text-gray-400 mt-4">
          Host will advance…
        </p>
      )}
    </div>
  );
}
