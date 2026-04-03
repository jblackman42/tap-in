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
    <div className="flex flex-col items-center justify-center min-h-svh bg-white px-6 py-12 text-center gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-2">
          {isFirstRound ? "Get Ready" : `Round ${round}`}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          {isFirstRound ? "Dutch Blitz" : "Next Round"}
        </h1>
        <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
          Get rid of your Blitz pile first — you win the round!
        </p>
      </div>

      {/* Show scores if not first round */}
      {!isFirstRound && players.length > 0 && (
        <div className="w-full max-w-xs space-y-1">
          {players
            .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
            .map((p) => (
              <div
                key={p.id}
                className="flex justify-between px-3 py-1.5 rounded-lg bg-gray-50 text-sm"
              >
                <span className="text-gray-700">{p.name}</span>
                <span className="font-bold text-violet-600 tabular-nums">
                  {scores[p.id] ?? 0}
                </span>
              </div>
            ))}
        </div>
      )}

      {isStarter ? (
        <Button size="lg" className="w-full max-w-xs" onClick={onBeginRound}>
          Begin Round
        </Button>
      ) : (
        <p className="text-gray-400 text-sm">
          Waiting for {starterName} to start the round...
        </p>
      )}

      {countdown <= SHOW_COUNTDOWN_AT && countdown > 0 && (
        <p className="text-xs text-gray-400">
          Auto-starting in {countdown}s
        </p>
      )}
    </div>
  );
}
