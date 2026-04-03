"use client";

import type { Player } from "@/lib/party/types";

const avatarColors = [
  { bg: "bg-secondary", border: "border-foreground" },
  { bg: "bg-primary", border: "border-foreground" },
  { bg: "bg-tertiary-container", border: "border-foreground" },
  { bg: "bg-secondary-container", border: "border-foreground" },
  { bg: "bg-[#ff3d91]", border: "border-foreground" },
  { bg: "bg-tertiary", border: "border-foreground" },
];

const shadowColors = ["#bb0058", "#006970", "#506600", "#1c1b1b", "#bb0058", "#006970"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-headline font-bold text-xl text-foreground uppercase">
          Waiting for players...
        </p>
        <p className="text-sm font-body text-outline mt-2">
          Share the QR code to invite friends
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1">
        <h3 className="font-headline font-bold text-xl uppercase tracking-tighter text-foreground">
          Players ({players.length})
        </h3>
        {players.length > 0 && (
          <div className="flex items-center gap-2 text-tertiary font-label font-bold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Waiting for more...
          </div>
        )}
      </div>
      <ul className="space-y-3">
        {players.map((player, i) => {
          const color = avatarColors[i % avatarColors.length];
          const shadow = shadowColors[i % shadowColors.length];
          const isFirst = i === 0;
          return (
            <li
              key={player.id}
              className={`flex items-center justify-between p-4 bg-surface-lowest border-4 ${isFirst ? "border-foreground wobbly-br-1" : "border-foreground/10 rounded-[2rem]"}`}
              style={isFirst ? { boxShadow: `6px 6px 0px ${shadow}` } : { boxShadow: `4px 4px 0px ${shadow}20` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${color.bg} flex items-center justify-center border-4 ${color.border} rounded-xl ${isFirst ? "rotate-[-3deg]" : ""}`}
                >
                  <span className="font-headline font-bold text-lg text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-headline font-bold text-lg uppercase">
                    {player.name}
                  </p>
                  {player.isHost && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Host
                    </span>
                  )}
                  {player.id === currentPlayerId && (
                    <span className="bg-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      You
                    </span>
                  )}
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-tertiary" style={{ boxShadow: "0 0 8px #506600" }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
