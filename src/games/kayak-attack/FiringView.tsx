"use client";

import { useState, useEffect } from "react";
import type { KayakAttackState, KayakAttackAction, Coordinate, Ship } from "./types";
import { SHIP_DEFINITIONS, SHIP_ORDER } from "./types";
import type { Player } from "@/lib/party/types";
import { Grid } from "./Grid";
import type { AttackCellState, DefenseCellState } from "./Grid";
import { Button } from "@/components/ui/Button";

interface FiringViewProps {
  state: KayakAttackState;
  playerId: string;
  players: Player[];
  dispatch: (action: KayakAttackAction) => void;
}

function coordKey(c: Coordinate): string {
  return `${c.col},${c.row}`;
}

function buildAttackCellStates(
  state: KayakAttackState,
  playerId: string,
  selectedCoord: Coordinate | null,
): Record<string, AttackCellState> {
  const oppId = state.playerIds.find((id) => id !== playerId)!;
  /** After getPlayerView, opp fleet only lists enemy ships you’ve fully sunk (positions revealed). */
  const oppFleet = state.fleets[oppId] ?? [];
  const sunkCells = new Set<string>();

  for (const ship of oppFleet) {
    for (const cell of ship.cells) sunkCells.add(coordKey(cell));
  }

  const myShots = state.shots[playerId] ?? [];
  const states: Record<string, AttackCellState> = {};

  for (const shot of myShots) {
    const key = coordKey(shot.coordinate);
    if (sunkCells.has(key)) {
      states[key] = "sunk";
    } else if (shot.isHit) {
      states[key] = "hit";
    } else {
      states[key] = "miss";
    }
  }

  for (const key of sunkCells) {
    states[key] = "sunk";
  }

  if (selectedCoord && !states[coordKey(selectedCoord)]) {
    states[coordKey(selectedCoord)] = "selected";
  }

  return states;
}

function buildDefenseCellStates(
  state: KayakAttackState,
  playerId: string,
): Record<string, DefenseCellState> {
  const myFleet = state.fleets[playerId] ?? [];
  const mySunkShips = state.sunkShips[playerId] ?? [];
  const oppId = state.playerIds.find((id) => id !== playerId)!;
  const oppShots = state.shots[oppId] ?? [];

  const shipCells = new Map<string, Ship>();
  for (const ship of myFleet) {
    for (const cell of ship.cells) {
      shipCells.set(coordKey(cell), ship);
    }
  }

  const hitCells = new Set(
    oppShots.filter((s) => s.isHit).map((s) => coordKey(s.coordinate)),
  );
  const states: Record<string, DefenseCellState> = {};

  for (const [key, ship] of shipCells) {
    const isSunk = mySunkShips.includes(ship.type);
    const isHit = hitCells.has(key);

    if (isSunk) {
      states[key] = "sunk";
    } else if (isHit) {
      states[key] = "hit";
    } else {
      states[key] = "ship";
    }
  }

  for (const shot of oppShots) {
    if (!shot.isHit) {
      states[coordKey(shot.coordinate)] = "miss";
    }
  }

  return states;
}

function ShipsRemaining({
  state,
  playerId,
}: {
  state: KayakAttackState;
  playerId: string;
}) {
  const oppId = state.playerIds.find((id) => id !== playerId)!;
  const myIntact = SHIP_ORDER.filter(
    (t) => !(state.sunkShips[playerId] ?? []).includes(t),
  ).length;
  const theirIntact = SHIP_ORDER.filter(
    (t) => !(state.sunkShips[oppId] ?? []).includes(t),
  ).length;

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-3 border-b border-foreground/10 bg-surface px-4 py-1.5"
      title="Ships remaining"
    >
      <span className="min-w-0 truncate font-label text-[10px] font-bold uppercase tracking-wider text-foreground">
        You: {myIntact}
      </span>
      <span className="min-w-0 truncate text-right font-label text-[10px] font-bold uppercase tracking-wider text-outline">
        Them: {theirIntact}
      </span>
    </div>
  );
}

function SunkMomentOverlay({
  state,
  playerId,
  players,
}: {
  state: KayakAttackState;
  playerId: string;
  players: Player[];
}) {
  const { lastReveal } = state;
  if (!lastReveal || lastReveal.sunkEvents.length === 0) return null;

  const opponentName =
    players.find((p) => p.id !== playerId)?.name ?? "Opponent";

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-foreground/80 gap-4 px-6 pointer-events-none">
      {lastReveal.sunkEvents.map((evt, i) => {
        const isAttacker = evt.attackerId === playerId;
        const shipName = SHIP_DEFINITIONS[evt.shipType].name;

        return (
          <div
            key={i}
            className="bg-surface border-4 border-foreground rounded-2xl px-6 py-4 shadow-[6px_6px_0px_0px_#1c1b1b] text-center"
          >
            {isAttacker ? (
              <>
                <p className="font-headline font-bold text-2xl uppercase tracking-tight text-primary">
                  SUNK!
                </p>
                <p className="font-body text-sm text-foreground mt-1">
                  You sunk their <strong>{shipName}</strong>!
                </p>
              </>
            ) : (
              <>
                <p className="font-headline font-bold text-2xl uppercase tracking-tight text-red-600">
                  HIT!
                </p>
                <p className="font-body text-sm text-foreground mt-1">
                  {opponentName} sunk your <strong>{shipName}</strong>!
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FiringView({
  state,
  playerId,
  players,
  dispatch,
}: FiringViewProps) {
  const [selectedCoord, setSelectedCoord] = useState<Coordinate | null>(null);
  const [hasFired, setHasFired] = useState(false);

  useEffect(() => {
    setSelectedCoord(null);
    setHasFired(false);
  }, [state.round]);

  const attackCellStates = buildAttackCellStates(state, playerId, selectedCoord);
  const defenseCellStates = buildDefenseCellStates(state, playerId);

  const myShots = state.shots[playerId] ?? [];
  const alreadyFiredKeys = new Set(myShots.map((s) => coordKey(s.coordinate)));

  const isFiringPhase = state.phase === "firing";
  const isRevealPhase = state.phase === "revealing";
  const isSunkMoment = state.phase === "sunk-moment";

  const sunkMomentAttackCells: Set<string> = new Set();
  const sunkMomentDefCells: Set<string> = new Set();

  if (isSunkMoment && state.lastReveal) {
    for (const evt of state.lastReveal.sunkEvents) {
      const cellSet = evt.attackerId === playerId ? sunkMomentAttackCells : sunkMomentDefCells;
      for (const cell of evt.cells) {
        cellSet.add(coordKey(cell));
      }
    }
  }

  function handleCellTap(coord: Coordinate) {
    if (!isFiringPhase || hasFired) return;
    if (alreadyFiredKeys.has(coordKey(coord))) return;
    setSelectedCoord(coord);
  }

  function handleFire() {
    if (!selectedCoord || hasFired) return;
    setHasFired(true);
    dispatch({ type: "fire", coordinate: selectedCoord });
  }

  const oppName = players.find((p) => p.id !== playerId)?.name ?? "Opponent";

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <ShipsRemaining state={state} playerId={playerId} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="flex shrink-0 flex-col px-3 pb-1 pt-2">
          <p className="mb-1 font-label font-bold text-[10px] uppercase tracking-[0.2em] text-outline">
            Enemy Waters
          </p>
          <Grid
            mode="attack"
            cellStates={attackCellStates}
            onCellTap={handleCellTap}
            disabled={!isFiringPhase || hasFired}
            sunkMomentCells={sunkMomentAttackCells}
          />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-3 py-2">
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-40"
            disabled={!selectedCoord || hasFired || !isFiringPhase}
            onClick={handleFire}
          >
            {hasFired ? "Fired!" : "Fire!"}
          </Button>

          <div className="shrink-0 text-right min-w-[56px]">
            {hasFired && isFiringPhase && (
              <p className="font-body text-xs text-outline leading-tight">
                Waiting for<br />{oppName}…
              </p>
            )}
            {isRevealPhase && (
              <p className="font-body text-xs text-outline">Results…</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between px-3 pb-0.5 pt-1">
          <p className="font-label font-bold text-[10px] uppercase tracking-[0.2em] text-outline">
            Your Fleet
          </p>
          <p className="font-label text-[10px] text-outline/60">
            Round {state.round}
          </p>
        </div>

        <div className="shrink-0 px-3 pb-6">
          <Grid
            mode="defense"
            cellStates={defenseCellStates}
            sunkMomentCells={sunkMomentDefCells}
          />
        </div>
      </div>

      {isSunkMoment && (
        <SunkMomentOverlay
          state={state}
          playerId={playerId}
          players={players}
        />
      )}

      {isRevealPhase && state.lastReveal && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center">
          <div className="flex gap-4 px-4 py-2 bg-surface/90 border border-foreground/10 rounded-full shadow-md">
            {Object.entries(state.lastReveal.shots).map(([pid, shot]) => {
              const isMe = pid === playerId;
              return (
                <span
                  key={pid}
                  className={`font-label font-bold text-xs uppercase tracking-wider ${
                    shot.isHit ? "text-red-500" : "text-outline"
                  }`}
                >
                  {isMe ? "You" : oppName}:{" "}
                  {shot.isHit ? "HIT" : "Miss"}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
