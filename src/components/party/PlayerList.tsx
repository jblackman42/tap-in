"use client";

import type { Player } from "@/lib/party/types";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">Waiting for players...</p>
        <p className="text-sm mt-1">Share the QR code to invite friends</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
        Players ({players.length})
      </p>
      <ul className="space-y-1.5">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
            <span className="font-medium text-gray-900">{player.name}</span>
            {player.isHost && (
              <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full font-medium">
                Host
              </span>
            )}
            {player.id === currentPlayerId && (
              <span className="text-xs text-gray-400 ml-auto">You</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
