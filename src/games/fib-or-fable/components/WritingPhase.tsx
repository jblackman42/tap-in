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
          <p className="text-2xl font-bold text-amber-600">Locked in!</p>
          <p className="text-sm text-gray-400 mt-1">
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
    <div className="flex-1 flex flex-col py-4">
      <div className="flex items-center justify-between mt-3 mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Round {round}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="bg-amber-50 rounded-2xl px-5 py-6 mb-4">
        <p className="text-sm text-amber-700/80 font-medium text-center mb-3 uppercase tracking-wider">
          Fill in the blank
        </p>
        <p className="text-lg font-semibold text-amber-950 text-center leading-relaxed">
          {parts[0]}
          <span className="inline-block mx-1 border-b-2 border-amber-400 min-w-[4ch] text-amber-400">
            {draft || "___"}
          </span>
          {parts[1]}
        </p>
      </div>

      {activeRejection ? (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-sm font-semibold text-red-600">
            {activeRejection.reason}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
          Write something believable to fool the others.
          The truth is hidden among the lies!
        </p>
      )}

      <div className="space-y-2 mt-auto">
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow resize-none"
          rows={2}
          maxLength={MAX_CHARS}
          placeholder="Type your fake answer…"
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
          <Button size="md" disabled={!draft.trim() || lockedIn} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
