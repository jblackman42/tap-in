"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface RoundSummaryProps {
  round: number;
  blitzCallerName: string;
  blitzCallerId: string;
  players: Player[];
  blitzCounts: Record<string, number>;
  cardsPlayedToDutch: Record<string, number>;
  scores: Record<string, number>;
  isStarter: boolean;
  onBeginRound: () => void;
}

const BUTTON_DELAY_MS = 3000;

export function RoundSummary({
  round,
  blitzCallerName,
  blitzCallerId,
  players,
  blitzCounts,
  cardsPlayedToDutch,
  scores,
  isStarter,
  onBeginRound,
}: RoundSummaryProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const hasReached75 = Object.values(scores).some((s) => s >= 75);

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-white px-6 py-10 text-center gap-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full mb-3">
          <span className="text-red-500 text-lg">🚨</span>
          <span className="font-bold text-red-700 text-sm">
            {blitzCallerName} called BLITZ!
          </span>
        </div>
        <p className="text-gray-400 text-xs">Round {round} — Scoring</p>
      </div>

      {/* Scoring table */}
      <div className="w-full max-w-sm">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span className="text-left">Player</span>
          <span>Dutch</span>
          <span>Blitz</span>
          <span>Net</span>
          <span>Total</span>
        </div>

        {players
          .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
          .map((p) => {
            const dutch = cardsPlayedToDutch[p.id] ?? 0;
            const blitzRemaining = blitzCounts[p.id] ?? 0;
            const net = dutch - blitzRemaining * 2;
            const isCaller = p.id === blitzCallerId;

            return (
              <div
                key={p.id}
                className={`
                  grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 text-sm
                  ${isCaller ? "bg-yellow-50 font-medium" : ""}
                `}
              >
                <span className="text-left text-gray-900 truncate">
                  {p.name}
                  {isCaller && (
                    <span className="text-yellow-600 text-xs ml-1">★</span>
                  )}
                </span>
                <span className="text-green-600 tabular-nums text-center w-10">
                  +{dutch}
                </span>
                <span className="text-red-500 tabular-nums text-center w-10">
                  {blitzRemaining > 0 ? `−${blitzRemaining * 2}` : "0"}
                </span>
                <span
                  className={`tabular-nums text-center w-10 font-medium ${
                    net >= 0 ? "text-gray-900" : "text-red-600"
                  }`}
                >
                  {net >= 0 ? `+${net}` : net}
                </span>
                <span className="text-violet-600 font-bold tabular-nums text-center w-10">
                  {scores[p.id] ?? 0}
                </span>
              </div>
            );
          })}
      </div>

      {/* 75-point warning */}
      {hasReached75 && (
        <div className="px-4 py-2 bg-amber-50 rounded-lg text-amber-700 text-sm font-medium">
          A player has reached 75 — game over!
        </div>
      )}

      {/* Start next round */}
      {showButton && !hasReached75 && (
        <div className="w-full max-w-xs">
          {isStarter ? (
            <>
              <p className="text-gray-400 text-xs mb-2">
                You called BLITZ — start the next round whenever you&apos;re ready.
              </p>
              <Button size="lg" className="w-full" onClick={onBeginRound}>
                Begin Next Round
              </Button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              Waiting for {blitzCallerName} to start the next round...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
