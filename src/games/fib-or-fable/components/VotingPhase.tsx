"use client";

import type { Question } from "../types";
import { TimerBar } from "./TimerBar";

const ANSWER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

interface VotingPhaseProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  round: number;
  playerId: string;
  timerEndsAt: number | null;
  isHost: boolean;
  onVote: (answerId: string) => void;
  onTimerExpired: () => void;
}

export function VotingPhase({
  question,
  questionIndex,
  totalQuestions,
  round,
  playerId,
  timerEndsAt,
  isHost,
  onVote,
  onTimerExpired,
}: VotingPhaseProps) {
  const hasVoted = !!question.votes[playerId];
  const myVote = question.votes[playerId];

  const parts = question.factText.split("___");

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
        <span className="inline-block bg-amber-500 text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#92400e]">
          Round {round}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Question {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <div className="bg-amber-50 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-6 mb-2 border-4 border-foreground shadow-[8px_8px_0px_0px_#92400e]">
        <p className="text-lg font-headline font-bold text-foreground text-center leading-relaxed">
          {parts[0]}
          <span className="inline-block mx-1 border-b-4 border-amber-400 min-w-[4ch] text-amber-400">
            ___
          </span>
          {parts[1]}
        </p>
      </div>

      <p className="text-xs text-outline font-label text-center mb-4 uppercase tracking-wider">
        Which answer is the truth?
      </p>

      <div className="space-y-3 flex-1">
        {question.answers.map((answer, i) => {
          const isSelected = myVote === answer.answerId;

          return (
            <button
              key={answer.answerId}
              type="button"
              disabled={hasVoted}
              onClick={() => onVote(answer.answerId)}
              className={`
                w-full text-left px-5 py-5 transition-all border-4 cursor-pointer
                ${!hasVoted ? "border-foreground bg-surface-lowest wobbly-br-2 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#f59e0b] active:scale-[0.98]" : ""}
                ${isSelected ? "border-amber-500 bg-amber-50 wobbly-br-2 shadow-[6px_6px_0px_0px_#92400e]" : ""}
                ${hasVoted && !isSelected ? "border-foreground/10 bg-surface-low wobbly-br-2 opacity-60" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-xl border-2 border-foreground font-headline font-bold flex items-center justify-center text-xs ${
                  isSelected ? "bg-amber-500 text-white" : "bg-surface-highest text-foreground"
                }`}>
                  {ANSWER_LABELS[i]}
                </span>
                <p className="text-foreground font-body font-semibold break-words flex-1 min-w-0">
                  {answer.text || "…"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-center text-sm text-outline font-label mt-4 uppercase tracking-wider">
          Locked in. Let&apos;s see who gets fooled…
        </p>
      )}
    </div>
  );
}
