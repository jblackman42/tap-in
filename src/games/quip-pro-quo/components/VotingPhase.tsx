"use client";

import type { Matchup } from "../types";
import { VoteBar } from "./VoteBar";
import { TimerBar } from "./TimerBar";

const ANSWER_LABELS = ["A", "B", "C"];

interface VotingPhaseProps {
  matchup: Matchup;
  matchupIndex: number;
  totalMatchups: number;
  round: number;
  playerId: string;
  timerEndsAt: number | null;
  isHost: boolean;
  onVote: (answerId: string) => void;
  onTimerExpired: () => void;
}

export function VotingPhase({
  matchup,
  matchupIndex,
  totalMatchups,
  round,
  playerId,
  timerEndsAt,
  isHost,
  onVote,
  onTimerExpired,
}: VotingPhaseProps) {
  const isWriter = matchup.answers.some((a) => a.playerId === playerId);
  const isEligible = matchup.eligibleVoterIds.includes(playerId);
  const hasVoted = !!matchup.votes[playerId];
  const myVote = matchup.votes[playerId];

  const totalVotes = Object.values(matchup.voteCounts).reduce((a, b) => a + b, 0);
  const maxPossibleVotes = matchup.eligibleVoterIds.length;

  return (
    <div className="flex-1 flex flex-col py-4">
      <TimerBar
        timerEndsAt={timerEndsAt}
        isHost={isHost}
        onTimerExpired={onTimerExpired}
      />

      <div className="flex items-center justify-between mt-3 mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Round {round}{matchup.isRound3 ? " — Thriplash" : ""}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          Matchup {matchupIndex + 1}/{totalMatchups}
        </span>
      </div>

      <div className="bg-violet-50 rounded-2xl px-5 py-5 mb-5">
        <p className="text-lg font-semibold text-violet-950 text-center leading-relaxed">
          {matchup.promptText}
        </p>
      </div>

      {!isEligible && (
        <p className="text-center text-sm text-gray-500 mb-4">
          You wrote one of these — sit tight.
        </p>
      )}

      <div className="space-y-3 flex-1">
        {matchup.answers.map((answer, i) => {
          const isSelected = myVote === answer.answerId;
          const voteCount = matchup.voteCounts[answer.answerId] ?? 0;

          return (
            <button
              key={answer.answerId}
              type="button"
              disabled={!isEligible || hasVoted}
              onClick={() => onVote(answer.answerId)}
              className={`
                w-full text-left rounded-xl border-2 px-4 py-4 transition-all
                ${!isEligible ? "opacity-60 cursor-default border-gray-200 bg-gray-50" : ""}
                ${isEligible && !hasVoted ? "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 active:scale-[0.98] cursor-pointer" : ""}
                ${isSelected ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : ""}
                ${hasVoted && !isSelected ? "border-gray-200 bg-white" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-xs">
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium break-words">
                    {answer.text || "…"}
                  </p>
                  {totalVotes > 0 && (
                    <div className="mt-2">
                      <VoteBar count={voteCount} maxCount={maxPossibleVotes} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Vote locked in. Watching the results come in…
        </p>
      )}
    </div>
  );
}
