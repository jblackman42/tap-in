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
        <span className="inline-block bg-amber-500 text-white font-label font-bold text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_#92400e]">
          Round {round}
        </span>
        <span className="text-xs text-outline font-label tabular-nums">
          Question {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <div className="bg-amber-50 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl px-6 py-5 mb-2 border-4 border-foreground shadow-[8px_8px_0px_0px_#92400e]">
        <p className="text-base font-headline font-bold text-foreground text-center leading-relaxed">
          {parts[0]}
          <span className="font-bold text-green-700 underline decoration-green-400 decoration-2 underline-offset-2">
            {question.truthAnswer}
          </span>
          {parts[1]}
        </p>
      </div>

      {question.nobodyGotIt && (
        <div className="bg-primary/10 border-4 border-primary/30 wobbly-br-2 px-4 py-2 mb-3 text-center">
          <p className="text-sm font-headline font-bold text-primary uppercase">
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
              className={`px-5 py-4 transition-all border-4 ${
                answer.isTruth
                  ? "border-green-500 bg-green-50 wobbly-br-1 shadow-[6px_6px_0px_0px_#15803d]"
                  : foolCount > 0
                    ? "border-amber-400 bg-amber-50/50 wobbly-br-2 shadow-[4px_4px_0px_0px_#92400e]"
                    : "border-foreground/10 bg-surface-low wobbly-br-3"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-8 h-8 rounded-xl border-2 border-foreground font-headline font-bold flex items-center justify-center text-xs ${
                    answer.isTruth
                      ? "bg-green-500 text-white"
                      : foolCount > 0
                        ? "bg-amber-500 text-white"
                        : "bg-surface-highest text-foreground"
                  }`}
                >
                  {ANSWER_LABELS[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-body font-semibold break-words">
                    {answer.text || "…"}
                  </p>

                  {answer.isTruth ? (
                    <p className="text-xs font-headline font-bold text-green-700 mt-1 uppercase">
                      The Truth
                    </p>
                  ) : (
                    <p className="text-xs font-headline font-bold text-amber-700 mt-1">
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
                          className={`text-xs px-2.5 py-0.5 rounded-full font-label font-bold ${
                            answer.isTruth
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-primary/10 text-primary border border-primary/20"
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
        <p className="text-center text-xs text-outline font-label mt-4 uppercase tracking-wider">
          Host will advance…
        </p>
      )}
    </div>
  );
}
