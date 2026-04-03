"use client";

import { useMemo, useState } from "react";
import { getAllGames } from "@/lib/engine/registry";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface GamePickerProps {
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
  onContinue: () => void;
}

export function GamePicker({
  selectedGameId,
  onSelect,
  onContinue,
}: GamePickerProps) {
  const games = getAllGames();
  const [query, setQuery] = useState("");

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
      {/* <div className="space-y-2">
        <label
          htmlFor="game-search"
          className="text-sm font-medium text-violet-800"
        >
          Search games
        </label>
        <Input
          id="game-search"
          name="game-search"
          type="search"
          placeholder="Type to filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div> */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">
          Choose a game
        </p>
        {filtered.length === 0 ? (
          <p className="text-center text-violet-600/80 py-10 text-sm">
            No games match &ldquo;{query.trim()}&rdquo;. Try another search.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[min(50vh,22rem)] overflow-y-auto pr-1">
            {filtered.map((game) => (
              <li key={game.id}>
                <GameCard
                  game={game}
                  selected={selectedGameId === game.id}
                  onSelect={() => onSelect(game.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!selectedGameId}
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  );
}

function GameCard({
  game,
  selected,
  onSelect,
}: {
  game: {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left rounded-xl border-2 px-4 py-3 transition-all
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2
        ${
          selected
            ? "border-violet-500 bg-violet-50 shadow-sm"
            : "border-violet-100 bg-white hover:border-violet-200 hover:bg-violet-50/50"
        }
      `}
    >
      <p className="font-semibold text-violet-950 leading-snug">{game.name}</p>
      <p className="text-sm text-violet-700/80 mt-1 line-clamp-2">{game.description}</p>
      <p className="text-xs text-violet-400 mt-2 tabular-nums">
        {game.minPlayers}–{game.maxPlayers} players
      </p>
    </button>
  );
}
