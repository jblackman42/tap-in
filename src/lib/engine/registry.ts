import type { GameDefinition } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const games = new Map<string, GameDefinition<any, any, any>>();

export function registerGame<TState, TAction, TPlayerData>(
  game: GameDefinition<TState, TAction, TPlayerData>,
): void {
  if (games.has(game.id)) {
    console.warn(`Game "${game.id}" is already registered. Overwriting.`);
  }
  games.set(game.id, game);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGame(id: string): GameDefinition<any, any, any> | undefined {
  return games.get(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllGames(): GameDefinition<any, any, any>[] {
  return Array.from(games.values());
}
