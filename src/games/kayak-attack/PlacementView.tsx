"use client";

import type { KayakAttackState, KayakAttackAction, Ship } from "./types";
import { SHIP_DEFINITIONS, SHIP_ORDER } from "./types";
import { Grid } from "./Grid";
import type { DefenseCellState } from "./Grid";
import { Button } from "@/components/ui/Button";
import { generateRandomFleet } from "./placement";

interface PlacementViewProps {
  state: KayakAttackState;
  playerId: string;
  dispatch: (action: KayakAttackAction) => void;
}

function buildDefenseCellStates(fleet: Ship[]): Record<string, DefenseCellState> {
  const states: Record<string, DefenseCellState> = {};
  for (const ship of fleet) {
    for (const cell of ship.cells) {
      states[`${cell.col},${cell.row}`] = "ship";
    }
  }
  return states;
}

export function PlacementView({
  state,
  playerId,
  dispatch,
}: PlacementViewProps) {
  const isReady = state.placementReady[playerId] ?? false;

  const oppId = state.playerIds.find((id) => id !== playerId);
  const oppReady = oppId ? (state.placementReady[oppId] ?? false) : false;

  const myFleet = state.fleets[playerId] ?? [];
  const cellStates = buildDefenseCellStates(myFleet);

  if (isReady) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="space-y-2">
          <p className="font-headline font-bold text-xl uppercase tracking-tight text-foreground">
            Ready!
          </p>
          <p className="font-body text-sm text-outline">
            {oppReady
              ? "Both ready — starting battle…"
              : "Waiting for your opponent to set their fleet…"}
          </p>
        </div>
        {!oppReady && (
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-secondary"
                style={{ animation: `ka-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
      <div className="flex items-center justify-between shrink-0">
        <p className="font-headline font-bold text-sm uppercase tracking-wider text-foreground">
          Your Fleet
        </p>
      </div>

      <div className="w-full shrink-0">
        <Grid mode="defense" cellStates={cellStates} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 shrink-0">
        {SHIP_ORDER.map((type) => {
          const { name, size } = SHIP_DEFINITIONS[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: size }, (_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm bg-secondary/70 border border-secondary"
                  />
                ))}
              </div>
              <span className="font-body text-xs text-outline">{name}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 shrink-0 mt-auto pt-2">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => dispatch({ type: "reshuffle", fleet: generateRandomFleet() })}
        >
          Reshuffle
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => dispatch({ type: "placement-ready" })}
        >
          Ready!
        </Button>
      </div>
    </div>
  );
}
