"use client";

import type { KayakAttackState, KayakAttackAction } from "./types";
import { SHIP_DEFINITIONS, SHIP_ORDER } from "./types";
import type { Player } from "@/lib/party/types";
import { Button } from "@/components/ui/Button";
import { generateRandomFleet } from "./placement";

interface GameOverViewProps {
  state: KayakAttackState;
  playerId: string;
  players: Player[];
  dispatch: (action: KayakAttackAction) => void;
  onReturnToLobby?: () => void;
}

function calcAccuracy(state: KayakAttackState, playerId: string): number {
  const shots = state.shots[playerId] ?? [];
  if (shots.length === 0) return 0;
  const hits = shots.filter((s) => s.isHit).length;
  return Math.round((hits / shots.length) * 100);
}

function SunkTimeline({
  state,
  playerId,
  players,
}: {
  state: KayakAttackState;
  playerId: string;
  players: Player[];
}) {
  const oppId = state.playerIds.find((id) => id !== playerId)!;
  const myName = players.find((p) => p.id === playerId)?.name ?? "You";
  const oppName = players.find((p) => p.id !== playerId)?.name ?? "Opponent";

  // Collect all sunk ship events from shot history
  const events: Array<{ round: number; attackerName: string; shipName: string }> = [];

  for (const attackerId of [playerId, oppId]) {
    const shots = state.shots[attackerId] ?? [];
    const attackerName = attackerId === playerId ? myName : oppName;
    for (const shot of shots) {
      if (shot.shipSunk) {
        events.push({
          round: shot.round,
          attackerName,
          shipName: SHIP_DEFINITIONS[shot.shipSunk].name,
        });
      }
    }
  }

  events.sort((a, b) => a.round - b.round);

  if (events.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="font-label font-bold text-[10px] uppercase tracking-widest text-outline">
        Ships Sunk
      </p>
      <div className="space-y-1">
        {events.map((evt, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-1.5 bg-surface border border-foreground/10 rounded-lg"
          >
            <span className="font-body text-xs text-outline">
              Rd {evt.round} — {evt.attackerName}
            </span>
            <span className="font-headline font-bold text-xs text-foreground uppercase tracking-wide">
              {evt.shipName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameOverView({
  state,
  playerId,
  players,
  dispatch,
  onReturnToLobby,
}: GameOverViewProps) {
  const { winnerId, isDraw, round } = state;
  const iWon = winnerId === playerId;
  const myName = players.find((p) => p.id === playerId)?.name ?? "You";
  const oppName = players.find((p) => p.id !== playerId)?.name ?? "Opponent";

  const myAccuracy = calcAccuracy(state, playerId);
  const myShots = (state.shots[playerId] ?? []).length;

  function handleRematch() {
    const p1 = state.playerIds[0];
    const p2 = state.playerIds[1];
    dispatch({
      type: "rematch",
      fleets: {
        [p1]: generateRandomFleet(),
        [p2]: generateRandomFleet(),
      },
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
      {/* Result headline */}
      <div className="text-center space-y-1">
        {isDraw ? (
          <>
            <p className="font-headline font-bold text-4xl uppercase tracking-tighter text-foreground">
              DRAW!
            </p>
            <p className="font-body text-sm text-outline">
              You both went down on the same round.
            </p>
          </>
        ) : iWon ? (
          <>
            <p className="font-headline font-bold text-4xl uppercase tracking-tighter text-primary">
              VICTORY!
            </p>
            <p className="font-body text-sm text-outline">
              {myName} wins! You sunk the fleet.
            </p>
          </>
        ) : (
          <>
            <p className="font-headline font-bold text-4xl uppercase tracking-tighter text-foreground/50">
              SUNK.
            </p>
            <p className="font-body text-sm text-outline">
              {oppName} wins. Better luck next time.
            </p>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border-2 border-foreground/10 rounded-xl p-3 text-center">
          <p className="font-headline font-bold text-2xl text-foreground">{round}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">
            Rounds
          </p>
        </div>
        <div className="bg-surface border-2 border-foreground/10 rounded-xl p-3 text-center">
          <p className="font-headline font-bold text-2xl text-foreground">{myShots}</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">
            Shots
          </p>
        </div>
        <div className="bg-surface border-2 border-foreground/10 rounded-xl p-3 text-center">
          <p className="font-headline font-bold text-2xl text-foreground">{myAccuracy}%</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">
            Accuracy
          </p>
        </div>
      </div>

      {/* Sunk timeline */}
      <SunkTimeline state={state} playerId={playerId} players={players} />

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-auto pt-2">
        <Button size="lg" className="w-full" onClick={handleRematch}>
          Rematch
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={onReturnToLobby}
        >
          Leave
        </Button>
      </div>
    </div>
  );
}
