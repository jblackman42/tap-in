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
      <div className="space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-900">
            Answers locked in!
          </p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 inline-block">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-violet-600 tabular-nums">{playersSubmitted}</span>
            {" / "}
            <span className="tabular-nums">{totalPlayers}</span>
            {" players done"}
          </p>
          {remaining > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Waiting on {remaining} more…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
