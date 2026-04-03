"use client";

import { useEffect } from "react";
import type { Question } from "../types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";
import { getPointsForRound } from "../scoring";

const ANSWER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const AUTO_ADVANCE_MS = 10000;

interface RevealPhaseProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  round: number;
  totalRounds: number;
  players: Player[];
  playerId: string;
  isHost: boolean;
  scores: Record<string, number>;
  onAdvance: () => void;
}

export function RevealPhase({
  question,
  questionIndex,
  totalQuestions,
  round,
  totalRounds,
  players,
  playerId,
  isHost,
  onAdvance,
}: RevealPhaseProps) {
  useEffect(() => {
    if (!isHost) return;
    const timer = setTimeout(onAdvance, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [isHost, onAdvance]);

  function getPlayerName(id: string): string {
    if (!id) return "THE TRUTH";
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  const pts = getPointsForRound(round);
  const isLast = questionIndex + 1 >= totalQuestions;

  const votersByAnswer: Record<string, string[]> = {};
  for (const [voterId, answerId] of Object.entries(question.votes)) {
    if (!votersByAnswer[answerId]) votersByAnswer[answerId] = [];
    votersByAnswer[answerId].push(voterId);
  }

  const parts = question.factText.split("___");

  return (
    <div className="flex-1 flex flex-col py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Round {round}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          Question {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <div className="bg-amber-50 rounded-2xl px-5 py-4 mb-2">
        <p className="text-base font-semibold text-amber-950 text-center leading-relaxed">
          {parts[0]}
          <span className="font-black text-green-700 underline decoration-green-400 decoration-2 underline-offset-2">
            {question.truthAnswer}
          </span>
          {parts[1]}
        </p>
      </div>

      {question.nobodyGotIt && (
        <div className="bg-red-50 rounded-xl px-4 py-2 mb-3 text-center">
          <p className="text-sm font-bold text-red-600">
            Nobody got it!
          </p>
        </div>
      )}

      <div className="space-y-3 flex-1 mt-2">
        {question.answers.map((answer, i) => {
          const voters = votersByAnswer[answer.answerId] ?? [];
          const foolCount = answer.isTruth ? 0 : voters.length;
          const authorNames = answer.playerIds
            .map((id) => {
              const name = getPlayerName(id);
              return id === playerId ? `${name} (you)` : name;
            })
            .join(" & ");

          return (
            <div
              key={answer.answerId}
              className={`rounded-xl border-2 px-4 py-3 transition-all ${
                answer.isTruth
                  ? "border-green-500 bg-green-50"
                  : foolCount > 0
                    ? "border-amber-400 bg-amber-50/50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs ${
                    answer.isTruth
                      ? "bg-green-500 text-white"
                      : foolCount > 0
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium break-words">
                    {answer.text || "…"}
                  </p>

                  {answer.isTruth ? (
                    <p className="text-xs font-bold text-green-700 mt-1">
                      THE TRUTH
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-amber-700 mt-1">
                      — {authorNames}
                      {foolCount > 0 && (
                        <span className="ml-1 text-amber-600">
                          (+{foolCount * pts} pts{answer.playerIds.length > 1 ? " each" : ""})
                        </span>
                      )}
                    </p>
                  )}

                  {voters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {voters.map((vid) => (
                        <span
                          key={vid}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            answer.isTruth
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {getPlayerName(vid)}
                          {vid === playerId && " (you)"}
                          {answer.isTruth && (
                            <span className="ml-0.5">+{pts}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <Button size="md" className="w-full mt-4" onClick={onAdvance}>
          {isLast
            ? round >= totalRounds
              ? "See Final Scores"
              : "Round Summary"
            : "Next Question"}
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Host will advance…
        </p>
      )}
    </div>
  );
}
