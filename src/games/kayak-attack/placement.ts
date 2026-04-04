import type { Ship, ShipType, Coordinate } from "./types";
import { GRID_SIZE, SHIP_DEFINITIONS, SHIP_ORDER } from "./types";

function getShipCells(
  col: number,
  row: number,
  size: number,
  isHorizontal: boolean,
): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let i = 0; i < size; i++) {
    cells.push(isHorizontal ? { col: col + i, row } : { col, row: row + i });
  }
  return cells;
}

function coordKey(c: Coordinate): string {
  return `${c.col},${c.row}`;
}

/**
 * Ships may not touch: no cell of a new ship may be orthogonally or
 * diagonally adjacent to any cell already occupied by another ship.
 */
function canPlaceShipNonAdjacent(
  cells: Coordinate[],
  occupied: Set<string>,
): boolean {
  for (const c of cells) {
    if (c.col < 0 || c.col >= GRID_SIZE || c.row < 0 || c.row >= GRID_SIZE) {
      return false;
    }
    if (occupied.has(coordKey(c))) return false;

    for (const ok of occupied) {
      const [oc, orow] = ok.split(",").map(Number);
      const d = Math.max(Math.abs(c.col - oc), Math.abs(c.row - orow));
      if (d <= 1) return false;
    }
  }
  return true;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Backtracking placement: all five ships fit with gaps on 8×8.
 * Retries with new random order if a layout fails (extremely rare).
 */
export function generateRandomFleet(): Ship[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = [];
    const occupied = new Set<string>();

    const order = [...SHIP_ORDER];
    shuffleInPlace(order);

    if (placeShipsRecursive(order, 0, occupied, ships)) {
      return ships;
    }
  }

  // Fallback: deterministic order (should still succeed with backtracking)
  const ships: Ship[] = [];
  const occupied = new Set<string>();
  if (placeShipsRecursive([...SHIP_ORDER], 0, occupied, ships)) {
    return ships;
  }

  throw new Error("Kayak Attack: could not place fleet with non-touching ships");
}

function placeShipsRecursive(
  order: ShipType[],
  index: number,
  occupied: Set<string>,
  ships: Ship[],
): boolean {
  if (index >= order.length) return true;

  const type = order[index];
  const { size } = SHIP_DEFINITIONS[type];

  const candidates: Array<{ col: number; row: number; isHorizontal: boolean }> = [];
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (const isHorizontal of [true, false]) {
        const cells = getShipCells(col, row, size, isHorizontal);
        if (canPlaceShipNonAdjacent(cells, occupied)) {
          candidates.push({ col, row, isHorizontal });
        }
      }
    }
  }

  shuffleInPlace(candidates);

  for (const { col, row, isHorizontal } of candidates) {
    const cells = getShipCells(col, row, size, isHorizontal);
    for (const cell of cells) {
      occupied.add(coordKey(cell));
    }
    ships.push({ type, cells, isHorizontal });

    if (placeShipsRecursive(order, index + 1, occupied, ships)) {
      return true;
    }

    ships.pop();
    for (const cell of cells) {
      occupied.delete(coordKey(cell));
    }
  }

  return false;
}

/**
 * Returns a Set of "col,row" keys for all occupied cells in a fleet.
 */
export function fleetToOccupiedSet(fleet: Ship[]): Set<string> {
  const set = new Set<string>();
  for (const ship of fleet) {
    for (const cell of ship.cells) {
      set.add(coordKey(cell));
    }
  }
  return set;
}

/**
 * Checks whether a coordinate hits any ship in the fleet.
 * Returns the ship type if hit, null if miss.
 */
export function checkHit(
  fleet: Ship[],
  coordinate: Coordinate,
): ShipType | null {
  const key = coordKey(coordinate);
  for (const ship of fleet) {
    for (const cell of ship.cells) {
      if (coordKey(cell) === key) return ship.type;
    }
  }
  return null;
}

/**
 * Returns true if all cells of the given ship type have been hit.
 */
export function isShipSunk(
  fleet: Ship[],
  shipType: ShipType,
  shotCoords: Set<string>,
): boolean {
  const ship = fleet.find((s) => s.type === shipType);
  if (!ship) return false;
  return ship.cells.every((cell) => shotCoords.has(coordKey(cell)));
}
