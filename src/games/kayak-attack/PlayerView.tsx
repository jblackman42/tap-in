"use client";

import { useEffect, useRef } from "react";
import type { PlayerViewProps } from "@/lib/engine/types";
import type { KayakAttackState, KayakAttackAction } from "./types";
import { PlacementView } from "./PlacementView";
import { FiringView } from "./FiringView";
import { GameOverView } from "./GameOverView";

const REVEAL_PAUSE_MS = 2_000;
const SUNK_MOMENT_MS = 3_000;

export function KayakAttackPlayerView({
  state,
  playerId,
  players,
  dispatch,
  onReturnToLobby,
}: PlayerViewProps<KayakAttackState, KayakAttackAction>) {
  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false;

  const stateRef = useRef(state);
  stateRef.current = state;

  // Revealing phase — auto-advance after pause
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHost) return;
    if (state.phase !== "revealing") return;

    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);

    revealTimerRef.current = setTimeout(() => {
      if (stateRef.current.phase === "revealing") {
        dispatch({ type: "advance-round" });
      }
    }, REVEAL_PAUSE_MS);

    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [isHost, state.phase, state.round, dispatch]);

  // Sunk-moment phase — auto-advance after pause
  const sunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHost) return;
    if (state.phase !== "sunk-moment") return;

    if (sunkTimerRef.current) clearTimeout(sunkTimerRef.current);

    sunkTimerRef.current = setTimeout(() => {
      if (stateRef.current.phase === "sunk-moment") {
        dispatch({ type: "advance-round" });
      }
    }, SUNK_MOMENT_MS);

    return () => {
      if (sunkTimerRef.current) clearTimeout(sunkTimerRef.current);
    };
  }, [isHost, state.phase, state.round, dispatch]);

  if (state.phase === "placement") {
    return (
      <PlacementView
        state={state}
        playerId={playerId}
        dispatch={dispatch}
      />
    );
  }

  if (
    state.phase === "firing" ||
    state.phase === "revealing" ||
    state.phase === "sunk-moment"
  ) {
    return (
      <FiringView
        state={state}
        playerId={playerId}
        players={players}
        dispatch={dispatch}
      />
    );
  }

  if (state.phase === "game-over") {
    return (
      <GameOverView
        state={state}
        playerId={playerId}
        players={players}
        dispatch={dispatch}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  return null;
}
