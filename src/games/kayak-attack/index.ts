import type { GameDefinition } from "@/lib/engine/types";
import {
  generateRandomFleet,
  checkHit,
  isShipSunk,
  fleetToOccupiedSet,
} from "./placement";
import type {
  KayakAttackState,
  KayakAttackAction,
  ShotResult,
  SunkEvent,
  Coordinate,
} from "./types";
import { SHIP_ORDER } from "./types";
import { KayakAttackPlayerView } from "./PlayerView";

function coordKey(c: Coordinate): string {
  return `${c.col},${c.row}`;
}

/** Resolve a round: process both pending shots and return the new state */
function resolveRound(state: KayakAttackState): KayakAttackState {
  const [p1, p2] = state.playerIds;
  const shot1 = state.pendingShots[p1];
  const shot2 = state.pendingShots[p2];

  if (!shot1 || !shot2) return state;

  const newShots = { ...state.shots };
  const newSunkShips = { ...state.sunkShips };
  const sunkEvents: SunkEvent[] = [];
  const revealShots: KayakAttackState["lastReveal"] extends null ? never : NonNullable<KayakAttackState["lastReveal"]>["shots"] = {};

  // Process each attacker's shot against the defender's fleet
  for (const [attackerId, coord] of [
    [p1, shot1],
    [p2, shot2],
  ] as [string, Coordinate][]) {
    const defenderId = attackerId === p1 ? p2 : p1;
    const defenderFleet = state.fleets[defenderId] ?? [];
    const hitShipType = checkHit(defenderFleet, coord);
    const isHit = hitShipType !== null;

    const existingShots = newShots[attackerId] ?? [];
    const firedSet = new Set(existingShots.map((s) => coordKey(s.coordinate)));
    firedSet.add(coordKey(coord));

    let shipSunk = null;
    if (isHit && hitShipType) {
      const alreadySunk = newSunkShips[defenderId] ?? [];
      if (!alreadySunk.includes(hitShipType)) {
        const sunk = isShipSunk(defenderFleet, hitShipType, firedSet);
        if (sunk) {
          shipSunk = hitShipType;
          newSunkShips[defenderId] = [...alreadySunk, hitShipType];
          const sunkShipObj = defenderFleet.find((s) => s.type === hitShipType);
          if (sunkShipObj) {
            sunkEvents.push({
              attackerId,
              shipType: hitShipType,
              cells: sunkShipObj.cells,
            });
          }
        }
      }
    }

    const result: ShotResult = {
      coordinate: coord,
      isHit,
      shipSunk,
      round: state.round,
      autoFired: false,
    };

    newShots[attackerId] = [...existingShots, result];
    revealShots[attackerId] = { coordinate: coord, isHit, autoFired: false };
  }

  const p1ShipsLeft = SHIP_ORDER.filter(
    (t) => !(newSunkShips[p2] ?? []).includes(t),
  ).length;
  const p2ShipsLeft = SHIP_ORDER.filter(
    (t) => !(newSunkShips[p1] ?? []).includes(t),
  ).length;

  const p1Won = p1ShipsLeft === 0;
  const p2Won = p2ShipsLeft === 0;

  let winnerId: string | null = null;
  let isDraw = false;

  if (p1Won && p2Won) {
    isDraw = true;
  } else if (p1Won) {
    winnerId = p1;
  } else if (p2Won) {
    winnerId = p2;
  }

  const isGameOver = p1Won || p2Won;
  const hasSunkEvents = sunkEvents.length > 0;

  const nextPhase = isGameOver
    ? "game-over"
    : hasSunkEvents
      ? "sunk-moment"
      : "revealing";

  return {
    ...state,
    shots: newShots,
    sunkShips: newSunkShips,
    pendingShots: { [p1]: null, [p2]: null },
    lastReveal: {
      round: state.round,
      shots: revealShots,
      sunkEvents,
    },
    winnerId,
    isDraw,
    phase: nextPhase,
  };
}

export const kayakAttackGame: GameDefinition<
  KayakAttackState,
  KayakAttackAction,
  Record<string, unknown>
> = {
  id: "kayak-attack",
  name: "Kayak Attack",
  description:
    "A 2-player secret fleet game. Place your ships, fire simultaneously, sink the enemy first!",
  minPlayers: 2,
  maxPlayers: 2,
  fullBleed: true,

  joinFields: [],

  createInitialState(players) {
    const [p1, p2] = players;
    return {
      phase: "placement",
      round: 1,
      playerIds: [p1.id, p2.id],
      fleets: {
        [p1.id]: generateRandomFleet(),
        [p2.id]: generateRandomFleet(),
      },
      placementReady: { [p1.id]: false, [p2.id]: false },
      shots: { [p1.id]: [], [p2.id]: [] },
      pendingShots: { [p1.id]: null, [p2.id]: null },
      sunkShips: { [p1.id]: [], [p2.id]: [] },
      lastReveal: null,
      winnerId: null,
      isDraw: false,
    };
  },

  reducer(state, action, playerId) {
    const [p1, p2] = state.playerIds;

    switch (action.type) {
      case "reshuffle": {
        if (state.phase !== "placement") return state;
        if (state.placementReady[playerId]) return state;
        return {
          ...state,
          fleets: { ...state.fleets, [playerId]: action.fleet },
        };
      }

      case "placement-ready": {
        if (state.phase !== "placement") return state;
        const newReady = { ...state.placementReady, [playerId]: true };
        const bothReady = Object.values(newReady).every(Boolean);
        if (bothReady) {
          return {
            ...state,
            placementReady: newReady,
            phase: "firing",
          };
        }
        return { ...state, placementReady: newReady };
      }

      case "fire": {
        if (state.phase !== "firing") return state;
        if (state.pendingShots[playerId] !== null) return state;

        const targetCoord = action.coordinate;
        const alreadyFired = (state.shots[playerId] ?? []).some(
          (s) => coordKey(s.coordinate) === coordKey(targetCoord),
        );
        if (alreadyFired) return state;

        const newPending = {
          ...state.pendingShots,
          [playerId]: targetCoord,
        };

        const bothFired = Object.values(newPending).every((c) => c !== null);
        if (bothFired) {
          const stateWithPending = { ...state, pendingShots: newPending };
          return resolveRound(stateWithPending);
        }

        return { ...state, pendingShots: newPending };
      }

      case "advance-round": {
        if (state.phase !== "revealing" && state.phase !== "sunk-moment") return state;
        if (state.lastReveal && (state.winnerId || state.isDraw)) {
          return { ...state, phase: "game-over" };
        }
        return {
          ...state,
          phase: "firing",
          round: state.round + 1,
          pendingShots: { [p1]: null, [p2]: null },
        };
      }

      case "rematch": {
        if (state.phase !== "game-over") return state;
        return {
          phase: "placement",
          round: 1,
          playerIds: state.playerIds,
          fleets: action.fleets,
          placementReady: { [p1]: false, [p2]: false },
          shots: { [p1]: [], [p2]: [] },
          pendingShots: { [p1]: null, [p2]: null },
          sunkShips: { [p1]: [], [p2]: [] },
          lastReveal: null,
          winnerId: null,
          isDraw: false,
        };
      }

      case "leave": {
        return state;
      }

      default:
        return state;
    }
  },

  getPlayerView(state, playerId) {
    const oppId = state.playerIds.find((id) => id !== playerId);
    if (!oppId) return state;

    /** Opponent ships fully sunk (damaged by *this* player’s attacks) — not `sunkShips[playerId]` (your own losses). Ship types are duplicated across fleets, so the wrong key leaked enemy positions. */
    const opponentSunkTypes = state.sunkShips[oppId] ?? [];
    const visibleOppFleet = (state.fleets[oppId] ?? []).filter((ship) =>
      opponentSunkTypes.includes(ship.type),
    );

    return {
      ...state,
      fleets: {
        [playerId]: state.fleets[playerId] ?? [],
        [oppId]: visibleOppFleet,
      },
      pendingShots: {
        [playerId]: state.pendingShots[playerId] ?? null,
        [oppId]: null,
      },
      placementReady: {
        [playerId]: state.placementReady[playerId] ?? false,
        [oppId]: state.placementReady[oppId] ?? false,
      },
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PlayerView: KayakAttackPlayerView as any,
};

export { generateRandomFleet, fleetToOccupiedSet };
