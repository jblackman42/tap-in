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
      <TimerBar
        timerEndsAt={timerEndsAt}
        isHost={isHost}
        onTimerExpired={onTimerExpired}
      />

      <div className="flex items-center justify-between mt-3 mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Round {round}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          Question {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <div className="bg-amber-50 rounded-2xl px-5 py-5 mb-2">
        <p className="text-lg font-semibold text-amber-950 text-center leading-relaxed">
          {parts[0]}
          <span className="inline-block mx-1 border-b-2 border-amber-400 min-w-[4ch] text-amber-400">
            ___
          </span>
          {parts[1]}
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center mb-4">
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
                w-full text-left rounded-xl border-2 px-4 py-4 transition-all
                ${!hasVoted ? "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 active:scale-[0.98] cursor-pointer" : ""}
                ${isSelected ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : ""}
                ${hasVoted && !isSelected ? "border-gray-200 bg-white opacity-60" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-xs">
                  {ANSWER_LABELS[i]}
                </span>
                <p className="text-gray-900 font-medium break-words flex-1 min-w-0">
                  {answer.text || "…"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Locked in. Let&apos;s see who gets fooled…
        </p>
      )}
    </div>
  );
}
