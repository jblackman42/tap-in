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
          <p className="text-3xl font-headline font-bold text-[#ff3d91] uppercase">Locked in!</p>
          <p className="text-sm text-outline font-body mt-1">
            {currentIndex + 1 < assignments.length
              ? "Next prompt coming up…"
              : "All done!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 min-h-0 overflow-y-auto">
      <div className="pr-14">
        <TimerBar
          timerEndsAt={timerEndsAt}
          isHost={isHost}
          onTimerExpired={onTimerExpired}
        />
      </div>

      <div className="flex items-center justify-between mt-3 mb-4 pr-14">
        <span className="inline-block bg-tertiary-container text-foreground font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#506600]">
          Round {round}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Prompt {currentIndex + 1} of {assignments.length}
        </span>
      </div>

      <div className="bg-surface-low rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-7 mb-6 border-4 border-foreground shadow-[8px_8px_0px_0px_#006970]">
        <p className="text-lg font-headline font-bold text-foreground text-center leading-relaxed">
          {assignment.promptText}
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          className="w-full px-4 py-3 border-4 border-foreground rounded-tl-lg rounded-br-lg rounded-tr-[24px] rounded-bl-[24px] text-foreground font-body font-semibold placeholder:text-outline-variant bg-surface-lowest focus:outline-none focus:border-[#ff3d91] focus:shadow-[4px_4px_0px_0px_#bb0058] transition-all resize-none"
          rows={2}
          maxLength={MAX_CHARS}
          placeholder="Type your answer…"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs tabular-nums font-label font-bold ${
              draft.length >= MAX_CHARS ? "text-primary" : "text-outline"
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
