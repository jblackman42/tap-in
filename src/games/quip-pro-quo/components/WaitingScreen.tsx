"use client";

import { useState } from "react";

interface WaitingScreenProps {
  playersSubmitted: number;
  totalPlayers: number;
}

const WAITING_MESSAGES = [
  "Some people are still thinking…",
  "Genius takes time. Or so they claim.",
  "Still waiting on a few stragglers…",
  "The pen is mightier than the deadline.",
  "Someone out there is writing a novel.",
  "Quality takes time. Allegedly.",
];

export function WaitingScreen({ playersSubmitted, totalPlayers }: WaitingScreenProps) {
  const remaining = totalPlayers - playersSubmitted;
  const [message] = useState(
    () => WAITING_MESSAGES[Math.floor(Math.random() * WAITING_MESSAGES.length)],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
      <div className="space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#ff3d91]/20 border-4 border-[#ff3d91] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-[3px] border-[#ff3d91] border-t-transparent animate-spin" />
        </div>

        <div>
          <p className="text-xl font-headline font-bold text-foreground uppercase">
            Answers locked in!
          </p>
          <p className="text-sm text-outline font-body mt-1">{message}</p>
        </div>

        <div className="bg-surface-highest rounded-2xl border-4 border-foreground/10 px-6 py-4 inline-block shadow-[4px_4px_0px_0px_#006970]">
          <p className="text-sm font-body text-foreground">
            <span className="font-headline font-bold text-[#ff3d91] tabular-nums text-lg">{playersSubmitted}</span>
            {" / "}
            <span className="tabular-nums font-bold">{totalPlayers}</span>
            {" players done"}
          </p>
          {remaining > 0 && (
            <p className="text-xs text-outline font-label mt-1">
              Waiting on {remaining} more…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
