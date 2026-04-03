"use client";

import { useState } from "react";
import type { PromptAssignment } from "../types";
import { Button } from "@/components/ui/Button";
import { TimerBar } from "./TimerBar";

const MAX_CHARS = 80;

interface ThriplashWritingProps {
  assignment: PromptAssignment;
  timerEndsAt: number | null;
  isHost: boolean;
  onSubmit: (answers: string[]) => void;
  onTimerExpired: () => void;
}

export function ThriplashWriting({
  assignment,
  timerEndsAt,
  isHost,
  onSubmit,
  onTimerExpired,
}: ThriplashWritingProps) {
  const [drafts, setDrafts] = useState(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  if (!assignment) return null;

  const allFilled = drafts.every((d) => d.trim().length > 0);

  function handleSubmit() {
    if (!allFilled) return;
    onSubmit(drafts.map((d) => d.trim()));
    setSubmitted(true);
  }

  function updateDraft(index: number, value: string) {
    const next = [...drafts];
    next[index] = value.slice(0, MAX_CHARS);
    setDrafts(next);
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="animate-qpq-lock-in text-center">
          <p className="text-3xl font-headline font-bold text-[#ff3d91] uppercase">Locked in!</p>
          <p className="text-sm text-outline font-body mt-1">All three answers submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 min-h-0">
      <div className="shrink-0 pr-14">
        <TimerBar
          timerEndsAt={timerEndsAt}
          isHost={isHost}
          onTimerExpired={onTimerExpired}
        />
      </div>

      <div className="shrink-0 flex items-center justify-between mt-3 mb-4 pr-14">
        <span className="inline-block bg-primary text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#3f0019]">
          Round 3 — Thriplash
        </span>
      </div>

      <div className="shrink-0 bg-surface-low rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-7 mb-4 border-4 border-foreground shadow-[8px_8px_0px_0px_#006970]">
        <p className="text-lg font-headline font-bold text-foreground text-center leading-relaxed">
          {assignment.promptText}
        </p>
      </div>

      <p className="shrink-0 text-xs text-outline font-label text-center mb-4 uppercase tracking-widest">
        Three different answers. The weirder the better.
      </p>

      <div className="space-y-3 flex-1">
        {drafts.map((draft, i) => (
          <div key={i} className="space-y-1">
            <label className="text-xs font-headline font-bold text-outline uppercase tracking-tight pl-1">
              Answer {i + 1}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 border-4 border-foreground rounded-tl-lg rounded-br-lg rounded-tr-[24px] rounded-bl-[24px] text-foreground font-body font-semibold placeholder:text-outline-variant bg-surface-lowest focus:outline-none focus:border-[#ff3d91] focus:shadow-[4px_4px_0px_0px_#bb0058] transition-all"
                maxLength={MAX_CHARS}
                placeholder={`Answer ${i + 1}…`}
                value={draft}
                onChange={(e) => updateDraft(i, e.target.value)}
                autoFocus={i === 0}
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums font-label ${
                  draft.length >= MAX_CHARS ? "text-primary font-bold" : "text-outline-variant"
                }`}
              >
                {draft.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full mt-4"
        disabled={!allFilled}
        onClick={handleSubmit}
      >
        Submit All Three
      </Button>
    </div>
  );
}
