import type { Card, PlayerColor, Suit } from "./types";

const SUITS: Suit[] = ["red", "blue", "yellow", "green"];

export function createDeck(playerColor: PlayerColor): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let n = 1; n <= 10; n++) {
      cards.push({
        suit,
        number: n,
        playerColor,
        id: `${playerColor}-${suit}-${n}`,
      });
    }
  }
  return cards;
}

/**
 * Mulberry32 — a fast 32-bit seeded PRNG.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deterministically derive a numeric seed from a round number and player ID.
 */
export function deriveSeed(round: number, playerId: string): number {
  let hash = round * 2654435761;
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) - hash + playerId.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export interface DealtCards {
  blitz: Card[];
  postPiles: Card[][];
  hand: Card[];
}

export function dealCards(deck: Card[], postCount: number): DealtCards {
  const postPiles: Card[][] = [];
  let idx = 0;

  for (let i = 0; i < postCount; i++) {
    postPiles.push([deck[idx]]);
    idx++;
  }

  const blitz = deck.slice(idx, idx + 10);
  idx += 10;

  const hand = deck.slice(idx);

  return { blitz, postPiles, hand };
}
