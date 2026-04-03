export type Suit = "red" | "blue" | "green" | "yellow";
export type SuitGroup = "boy" | "girl";
export type PlayerColor = "pump" | "carriage" | "pail" | "plow";

export const PLAYER_COLORS: PlayerColor[] = ["pump", "carriage", "pail", "plow"];

export const SUIT_GROUP_MAP: Record<Suit, SuitGroup> = {
  red: "boy",
  blue: "boy",
  yellow: "girl",
  green: "girl",
};

export interface CardFace {
  suit: Suit;
  number: number;
}

export interface Card extends CardFace {
  playerColor: PlayerColor;
  id: string;
}

/**
 * Framer shared `layoutId` prefix for a deck card instance. Used by `cardLayoutId` and center-pile actor bridge.
 */
export function layoutIdFromCardId(cardId: string): string {
  return `db-${cardId}`;
}

/**
 * Framer Motion `layoutId` for sliding a card between personal zones (blitz / post / wood).
 * One id per physical card — always derived from `Card.id`, never from face alone.
 */
export function cardLayoutId(card: Card): string {
  return layoutIdFromCardId(card.id);
}

/**
 * Layout id for a center pile top — MUST NOT reuse `cardLayoutId` or it collides with hand/wood/blitz
 * when the same suit+number appears in the center and in your zones (Framer links them as one element).
 */
export function dutchPileLayoutId(pileIndex: number, top: CardFace): string {
  return `db-center-${pileIndex}-${top.suit}-${top.number}`;
}

/** Parse `Card.id` shape `${playerColor}-${suit}-${n}` (playerColor is one token). */
export function cardIdMatchesFace(cardId: string, face: CardFace): boolean {
  const parts = cardId.split("-");
  if (parts.length < 3) return false;
  const n = Number(parts[parts.length - 1]);
  const suit = parts[parts.length - 2] as Suit;
  return face.number === n && face.suit === suit;
}

export interface DutchPile {
  topCard: CardFace;
  depth: number;
}

export interface DutchBlitzPlayerData {
  handedness: "left" | "right";
}

export function getSuitGroup(suit: Suit): SuitGroup {
  return SUIT_GROUP_MAP[suit];
}

export function canStackOnPost(card: CardFace, onto: CardFace): boolean {
  return (
    card.number === onto.number - 1 &&
    getSuitGroup(card.suit) !== getSuitGroup(onto.suit)
  );
}

export function canPlayOnDutch(card: CardFace, pile: DutchPile): boolean {
  return (
    card.suit === pile.topCard.suit &&
    card.number === pile.topCard.number + 1
  );
}

export function canStartDutchPile(card: CardFace): boolean {
  return card.number === 1;
}

export interface SelectedCard {
  card: Card;
  source: "blitz" | "post" | "wood";
  pileIndex?: number;
}

export interface LocalGameState {
  blitzPile: Card[];
  postPiles: Card[][];
  woodPile: Card[];
  hand: Card[];
  selectedCard: SelectedCard | null;
}

export interface DutchBlitzState {
  phase: "pre-round" | "playing" | "round-end" | "game-over";
  round: number;
  dutchPiles: DutchPile[];
  blitzCounts: Record<string, number>;
  cardsPlayedToDutch: Record<string, number>;
  scores: Record<string, number>;
  scoreHistory: Record<string, number[]>;
  blitzCallerId: string | null;
  roundStarterId: string | null;
  playerColors: Record<string, PlayerColor>;
  dealSeeds: Record<string, number>;
  rejections: Record<string, { card: CardFace; timestamp: number } | null>;
  playerCount: number;
}

export type DutchBlitzAction =
  | {
      type: "play-to-dutch";
      card: CardFace;
      pileIndex: number;
      isNewPile: boolean;
      newBlitzCount: number;
    }
  | { type: "update-blitz-count"; count: number }
  | { type: "begin-round" };

export interface DutchBlitzPlayerView
  extends Omit<DutchBlitzState, "rejections"> {
  lastRejection: { card: CardFace; timestamp: number } | null;
}
