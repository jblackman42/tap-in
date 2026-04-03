"use client";

import { useState } from "react";
import type { PromptAssignment } from "../types";
import { Button } from "@/components/ui/Button";
import { TimerBar } from "./TimerBar";

const MAX_CHARS = 80;

interface WritingPhaseProps {
  assignments: PromptAssignment[];
  answers: Record<string, string | string[]>;
  round: number;
  timerEndsAt: number | null;
  isHost: boolean;
  onSubmit: (promptId: string, answer: string) => void;
  onTimerExpired: () => void;
}

export function WritingPhase({
  assignments,
  answers,
  round,
  timerEndsAt,
  isHost,
  onSubmit,
  onTimerExpired,
}: WritingPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = assignments.findIndex(
      (a) => answers[a.promptId] == null,
    );
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [draft, setDraft] = useState("");
  const [lockedIn, setLockedIn] = useState(false);

  const assignment = assignments[currentIndex];
  if (!assignment) return null;

  const alreadyAnswered = answers[assignment.promptId] != null;

  function handleSubmit() {
    if (!draft.trim() || alreadyAnswered) return;

    onSubmit(assignment.promptId, draft.trim());
    setLockedIn(true);

    setTimeout(() => {
      setLockedIn(false);
      setDraft("");

      const nextIndex = currentIndex + 1;
      if (nextIndex < assignments.length) {
        setCurrentIndex(nextIndex);
      }
    }, 800);
  }

  if (lockedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="animate-qpq-lock-in text-center">
          <p className="text-2xl font-bold text-violet-600">Locked in!</p>
          <p className="text-sm text-gray-400 mt-1">
            {currentIndex + 1 < assignments.length
              ? "Next prompt coming up…"
              : "All done!"}
          </p>
        </div>
      </div>
    );
  }

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
          Prompt {currentIndex + 1} of {assignments.length}
        </span>
      </div>

      <div className="bg-violet-50 rounded-2xl px-5 py-6 mb-6">
        <p className="text-lg font-semibold text-violet-950 text-center leading-relaxed">
          {assignment.promptText}
        </p>
      </div>

      <div className="space-y-2 mt-auto">
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow resize-none"
          rows={2}
          maxLength={MAX_CHARS}
          placeholder="Type your answer…"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs tabular-nums ${
              draft.length >= MAX_CHARS ? "text-red-500" : "text-gray-400"
            }`}
          >
            {draft.length}/{MAX_CHARS}
          </span>
          <Button
            size="md"
            disabled={!draft.trim()}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
