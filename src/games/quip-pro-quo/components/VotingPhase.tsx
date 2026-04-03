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
  const isEligible = matchup.eligibleVoterIds.includes(playerId);
  const hasVoted = !!matchup.votes[playerId];
  const myVote = matchup.votes[playerId];

  const totalVotes = Object.values(matchup.voteCounts).reduce((a, b) => a + b, 0);
  const maxPossibleVotes = matchup.eligibleVoterIds.length;

  return (
    <div className="flex-1 flex flex-col py-4">
      <div className="pr-14">
        <TimerBar
          timerEndsAt={timerEndsAt}
          isHost={isHost}
          onTimerExpired={onTimerExpired}
        />
      </div>

      <div className="flex items-center justify-between mt-3 mb-4 pr-14">
        <span className="inline-block bg-tertiary-container text-foreground font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#506600]">
          Round {round}{matchup.isRound3 ? " — Thriplash" : ""}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Matchup {matchupIndex + 1}/{totalMatchups}
        </span>
      </div>

      <div className="bg-surface-low rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-6 mb-5 border-4 border-foreground shadow-[8px_8px_0px_0px_#006970]">
        <p className="text-lg font-headline font-bold text-foreground text-center leading-relaxed">
          {matchup.promptText}
        </p>
      </div>

      {!isEligible && (
        <p className="text-center text-sm text-outline font-label mb-4 uppercase tracking-wider">
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
                w-full text-left px-5 py-5 transition-all border-4 cursor-pointer
                ${!isEligible ? "opacity-60 cursor-default border-outline-variant/30 bg-surface-high wobbly-br-1" : ""}
                ${isEligible && !hasVoted ? "border-foreground bg-surface-lowest wobbly-br-2 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#ff3d91] active:scale-[0.98]" : ""}
                ${isSelected ? "border-[#ff3d91] bg-[#ff3d91]/10 wobbly-br-2 shadow-[6px_6px_0px_0px_#bb0058]" : ""}
                ${hasVoted && !isSelected ? "border-foreground/10 bg-surface-low wobbly-br-2" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-xl border-2 border-foreground font-headline font-bold flex items-center justify-center text-xs ${
                  isSelected ? "bg-[#ff3d91] text-white" : "bg-surface-highest text-foreground"
                }`}>
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-body font-semibold break-words">
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
        <p className="text-center text-sm text-outline font-label mt-4 uppercase tracking-wider">
          Vote locked in. Watching the results come in…
        </p>
      )}
    </div>
  );
}
