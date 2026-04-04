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
    <div className="flex flex-col items-center justify-center min-h-full flex-1 bg-[#1c1b1b] px-6 py-10 text-center gap-6 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] memphis-dots" />

      {/* Header */}
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary/20 border-2 border-primary/40 rounded-full">
          <span className="text-primary text-lg">🚨</span>
          <span className="font-headline font-bold text-primary text-sm uppercase tracking-tight">
            {blitzCallerName} called BLITZ!
          </span>
        </div>
        <p className="text-white/40 text-xs font-label uppercase tracking-widest">Round {round} — Scoring</p>
      </div>

      {/* Scoring table */}
      <div className="w-full max-w-sm relative z-10">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-1.5 text-[10px] text-white/30 font-label uppercase tracking-widest border-b border-white/10">
          <span className="text-left">Player</span>
          <span>Center</span>
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
                  grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 text-sm font-label
                  ${isCaller ? "bg-tertiary-container/10 text-white font-bold" : "text-white/70"}
                `}
              >
                <span className="text-left truncate">
                  {p.name}
                  {isCaller && (
                    <span className="text-tertiary-container text-xs ml-1">★</span>
                  )}
                </span>
                <span className="text-tertiary-container tabular-nums text-center w-10">
                  +{dutch}
                </span>
                <span className="text-primary tabular-nums text-center w-10">
                  {blitzRemaining > 0 ? `−${blitzRemaining * 2}` : "0"}
                </span>
                <span
                  className={`tabular-nums text-center w-10 font-bold ${
                    net >= 0 ? "text-white" : "text-primary"
                  }`}
                >
                  {net >= 0 ? `+${net}` : net}
                </span>
                <span className="text-tertiary-container font-bold tabular-nums text-center w-10">
                  {scores[p.id] ?? 0}
                </span>
              </div>
            );
          })}
      </div>

      {hasReached75 && (
        <div className="px-5 py-2 bg-primary/20 border border-primary/40 rounded-xl text-primary text-sm font-label font-bold relative z-10">
          A player has reached 75 — game over!
        </div>
      )}

      {showButton && !hasReached75 && (
        <div className="w-full max-w-xs relative z-10">
          {isStarter ? (
            <>
              <p className="text-white/30 text-xs mb-2 font-label">
                You called BLITZ — start the next round whenever you&apos;re ready.
              </p>
              <Button size="lg" className="w-full" onClick={onBeginRound}>
                Begin Next Round
              </Button>
            </>
          ) : (
            <p className="text-white/40 text-sm font-label">
              Waiting for {blitzCallerName} to start the next round...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
