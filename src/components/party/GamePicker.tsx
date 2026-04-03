"use client";

import { useMemo, useState } from "react";
import { getAllGames } from "@/lib/engine/registry";

const gameCardStyles: Record<string, { bg: string; text: string; border: string; shadow: string; badge: string; wobbly: string }> = {
  blitzkrieg: {
    bg: "bg-[#1c1b1b]",
    text: "text-white",
    border: "border-tertiary-container",
    shadow: "shadow-[8px_8px_0px_0px_rgba(80,102,0,1)]",
    badge: "bg-primary text-white",
    wobbly: "wobbly-br-1",
  },
  "quip-pro-quo": {
    bg: "bg-[#ff3d91]",
    text: "text-white",
    border: "border-foreground",
    shadow: "shadow-[8px_8px_0px_0px_rgba(28,27,27,1)]",
    badge: "bg-foreground text-white",
    wobbly: "wobbly-br-2",
  },
  "fib-or-fable": {
    bg: "bg-tertiary-container",
    text: "text-foreground",
    border: "border-foreground",
    shadow: "shadow-[8px_8px_0px_0px_rgba(28,27,27,1)]",
    badge: "bg-tertiary text-white",
    wobbly: "wobbly-br-3",
  },
};

const defaultCardStyle = {
  bg: "bg-secondary",
  text: "text-white",
  border: "border-foreground",
  shadow: "shadow-[8px_8px_0px_0px_rgba(28,27,27,1)]",
  badge: "bg-foreground text-white",
  wobbly: "wobbly-br-1",
};

interface GamePickerProps {
  onSelect: (gameId: string) => void;
}

export function GamePicker({ onSelect }: GamePickerProps) {
  const games = getAllGames();
  const [query] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q),
    );
  }, [games, query]);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-label text-[10px] uppercase tracking-[0.2em] font-bold text-outline bg-surface-highest px-3 py-1 rounded-full">
          Choose a game
        </span>
        {filtered.length === 0 ? (
          <p className="text-center text-outline py-10 text-sm font-body">
            No games match &ldquo;{query.trim()}&rdquo;. Try another search.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 mt-4">
            {filtered.map((game) => {
              const style = gameCardStyles[game.id] ?? defaultCardStyle;
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(game.id)}
                    className={`
                      group relative w-full text-left p-6 border-4 overflow-hidden cursor-pointer
                      transition-all duration-150 hover:-translate-y-1 active:scale-[0.98]
                      focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40
                      ${style.bg} ${style.text} ${style.border} ${style.shadow} ${style.wobbly}
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-headline font-bold text-3xl uppercase tracking-tighter">
                        {game.name}
                      </h3>
                      <span
                        className={`${style.badge} text-[10px] font-label font-bold px-2 py-1 rounded`}
                      >
                        {game.minPlayers}–{game.maxPlayers} PLAYERS
                      </span>
                    </div>
                    <p className="text-sm opacity-90 font-medium leading-relaxed">
                      {game.description}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
