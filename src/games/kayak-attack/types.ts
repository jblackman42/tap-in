export type ShipType =
  | "carrier"
  | "battleship"
  | "cruiser"
  | "submarine"
  | "destroyer";

export const SHIP_DEFINITIONS: Record<ShipType, { name: string; size: number }> = {
  carrier:    { name: "Carrier",    size: 5 },
  battleship: { name: "Battleship", size: 4 },
  cruiser:    { name: "Cruiser",    size: 3 },
  submarine:  { name: "Submarine",  size: 3 },
  destroyer:  { name: "Destroyer",  size: 2 },
};

export const SHIP_ORDER: ShipType[] = [
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer",
];

export const GRID_SIZE = 8;

/** 0-indexed: col 0–7 (A–H), row 0–7 (1–8) */
export interface Coordinate {
  col: number;
  row: number;
}

export interface Ship {
  type: ShipType;
  cells: Coordinate[];
  isHorizontal: boolean;
}

export interface ShotResult {
  coordinate: Coordinate;
  isHit: boolean;
  shipSunk: ShipType | null;
  round: number;
  autoFired: boolean;
}

export interface SunkEvent {
  attackerId: string;
  shipType: ShipType;
  /** Cells of the sunk ship (for animation) */
  cells: Coordinate[];
}

export interface RoundReveal {
  round: number;
  shots: Record<string, { coordinate: Coordinate; isHit: boolean; autoFired: boolean }>;
  sunkEvents: SunkEvent[];
}

export type Phase =
  | "placement"
  | "firing"
  | "revealing"
  | "sunk-moment"
  | "game-over";

export interface KayakAttackState {
  phase: Phase;
  round: number;
  /** Always exactly 2 player IDs: [hostId, guestId] */
  playerIds: [string, string];
  /** Full fleet for each player — stripped in getPlayerView */
  fleets: Record<string, Ship[]>;
  placementReady: Record<string, boolean>;
  /** All shots fired by each player (attacking that player's opponent) */
  shots: Record<string, ShotResult[]>;
  /** This round's pending shots, null = not yet fired */
  pendingShots: Record<string, Coordinate | null>;
  /** Ship types that have been sunk for each player's fleet */
  sunkShips: Record<string, ShipType[]>;
  /** Results of the most recently resolved round */
  lastReveal: RoundReveal | null;
  winnerId: string | null;
  isDraw: boolean;
}

export type KayakAttackAction =
  | { type: "reshuffle"; fleet: Ship[] }
  | { type: "placement-ready" }
  | { type: "fire"; coordinate: Coordinate }
  /** Dispatched by host timer after reveal or sunk-moment pause */
  | { type: "advance-round" }
  | { type: "rematch"; fleets: Record<string, Ship[]> }
  | { type: "leave" };
