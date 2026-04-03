"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";

interface BeginRoundProps {
  round: number;
  isStarter: boolean;
  starterName: string;
  players: Player[];
  scores: Record<string, number>;
  onBeginRound: () => void;
}

const AUTO_START_SECONDS = 60;
const SHOW_COUNTDOWN_AT = 10;

export function BeginRound({
  round,
  isStarter,
  starterName,
  players,
  scores,
  onBeginRound,
}: BeginRoundProps) {
  const [countdown, setCountdown] = useState(AUTO_START_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isStarter) onBeginRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarter, onBeginRound]);

  const isFirstRound = round === 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-[#1c1b1b] px-6 py-12 text-center gap-8 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] memphis-dots" />
      <div className="relative z-10 space-y-3">
        <span className="inline-block bg-tertiary-container text-foreground px-4 py-1 rounded-full font-label font-bold text-xs uppercase tracking-widest">
          {isFirstRound ? "Get Ready" : `Round ${round}`}
        </span>
        <h1 className="font-headline font-bold text-5xl text-white uppercase tracking-tighter">
          {isFirstRound ? "Blitzkrieg" : "Next Round"}
        </h1>
        <p className="text-white/50 text-sm max-w-xs mx-auto font-body">
          Get rid of your Blitz pile first — you win the round!
        </p>
      </div>

      {!isFirstRound && players.length > 0 && (
        <div className="w-full max-w-xs space-y-2 relative z-10">
          {players
            .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
            .map((p, i) => (
              <div
                key={p.id}
                className={`flex justify-between px-4 py-2 rounded-xl text-sm font-label ${
                  i === 0 ? "bg-tertiary-container/20 border border-tertiary-container/30" : "bg-white/5"
                }`}
              >
                <span className="text-white/80">{p.name}</span>
                <span className="font-bold text-tertiary-container tabular-nums">
                  {scores[p.id] ?? 0}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-xs">
        {isStarter ? (
          <Button size="lg" className="w-full" onClick={onBeginRound}>
            Begin Round
          </Button>
        ) : (
          <p className="text-white/40 text-sm font-label">
            Waiting for {starterName} to start the round...
          </p>
        )}
      </div>

      {countdown <= SHOW_COUNTDOWN_AT && countdown > 0 && (
        <p className="text-xs text-white/30 font-label relative z-10">
          Auto-starting in {countdown}s
        </p>
      )}
    </div>
  );
}
