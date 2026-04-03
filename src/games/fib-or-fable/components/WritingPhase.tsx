"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "../types";
import { Button } from "@/components/ui/Button";

const MAX_CHARS = 45;

interface WritingPhaseProps {
  questions: Question[];
  lies: Record<string, string>;
  rejection: { questionId: string; reason: string } | null;
  round: number;
  onSubmit: (questionId: string, answer: string) => void;
}

export function WritingPhase({
  questions,
  lies,
  rejection,
  round,
  onSubmit,
}: WritingPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => lies[q.id] == null);
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [draft, setDraft] = useState("");
  const [lockedIn, setLockedIn] = useState(false);
  const pendingQuestionId = useRef<string | null>(null);

  const question = questions[currentIndex];
  if (!question) return null;

  const alreadyAnswered = lies[question.id] != null;
  const activeRejection =
    rejection && rejection.questionId === question.id ? rejection : null;

  useEffect(() => {
    if (!pendingQuestionId.current) return;

    if (activeRejection && activeRejection.questionId === pendingQuestionId.current) {
      pendingQuestionId.current = null;
      setLockedIn(false);
      return;
    }

    if (lies[pendingQuestionId.current] != null) {
      const acceptedId = pendingQuestionId.current;
      pendingQuestionId.current = null;
      const timer = setTimeout(() => {
        setLockedIn(false);
        setDraft("");
        const acceptedIdx = questions.findIndex((q) => q.id === acceptedId);
        const nextIndex = acceptedIdx + 1;
        if (nextIndex < questions.length && lies[questions[nextIndex]?.id] == null) {
          setCurrentIndex(nextIndex);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [lies, activeRejection, questions]);

  function handleSubmit() {
    if (!draft.trim() || alreadyAnswered || lockedIn) return;
    pendingQuestionId.current = question.id;
    onSubmit(question.id, draft.trim());
    setLockedIn(true);
  }

  if (lockedIn && !activeRejection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-headline font-bold text-amber-500 uppercase">Locked in!</p>
          <p className="text-sm text-outline font-body mt-1">
            {currentIndex + 1 < questions.length
              ? "Next question coming up…"
              : "All lies submitted!"}
          </p>
        </div>
      </div>
    );
  }

  const parts = question.factText.split("___");

  return (
    <div className="flex-1 flex flex-col py-4 min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mt-3 mb-4 pr-14">
        <span className="inline-block bg-amber-500 text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#92400e]">
          Round {round}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="bg-amber-50 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-7 mb-4 border-4 border-foreground shadow-[8px_8px_0px_0px_#92400e]">
        <p className="text-sm text-amber-700 font-label font-bold text-center mb-3 uppercase tracking-widest">
          Fill in the blank
        </p>
        <p className="text-lg font-headline font-bold text-foreground text-center leading-relaxed">
          {parts[0]}
          <span className="inline-block mx-1 border-b-4 border-amber-400 min-w-[4ch] text-amber-400">
            {draft || "___"}
          </span>
          {parts[1]}
        </p>
      </div>

      {activeRejection ? (
        <div className="bg-error-container border-4 border-error/30 wobbly-br-2 px-5 py-4 mb-4 text-center">
          <p className="text-sm font-headline font-bold text-error uppercase">
            {activeRejection.reason}
          </p>
        </div>
      ) : (
        <p className="text-xs text-outline font-label text-center mb-4 leading-relaxed uppercase tracking-wider">
          Write something believable to fool the others.
        </p>
      )}

      <div className="space-y-2">
        <textarea
          className="w-full px-4 py-3 border-4 border-foreground rounded-tl-lg rounded-br-lg rounded-tr-[24px] rounded-bl-[24px] text-foreground font-body font-semibold placeholder:text-outline-variant bg-surface-lowest focus:outline-none focus:border-amber-500 focus:shadow-[4px_4px_0px_0px_#92400e] transition-all resize-none"
          rows={2}
          maxLength={MAX_CHARS}
          placeholder="Type your fake answer…"
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
          <Button size="md" disabled={!draft.trim() || lockedIn} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
