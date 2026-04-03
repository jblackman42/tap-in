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
          <p className="text-2xl font-bold text-violet-600">Locked in!</p>
          <p className="text-sm text-gray-400 mt-1">All three answers submitted.</p>
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
          Round 3 — Thriplash
        </span>
      </div>

      <div className="bg-violet-50 rounded-2xl px-5 py-6 mb-4">
        <p className="text-lg font-semibold text-violet-950 text-center leading-relaxed">
          {assignment.promptText}
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center mb-4">
        Three different answers. The weirder the better.
      </p>

      <div className="space-y-3 flex-1">
        {drafts.map((draft, i) => (
          <div key={i} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Answer {i + 1}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                maxLength={MAX_CHARS}
                placeholder={`Answer ${i + 1}…`}
                value={draft}
                onChange={(e) => updateDraft(i, e.target.value)}
                autoFocus={i === 0}
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
                  draft.length >= MAX_CHARS ? "text-red-500" : "text-gray-300"
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
