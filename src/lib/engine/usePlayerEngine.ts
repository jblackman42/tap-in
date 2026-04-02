"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface UsePlayerEngineOptions {
  partyCode: string;
  playerId: string;
  active: boolean;
}

interface UsePlayerEngineReturn<TState, TAction> {
  state: TState | null;
  playerState: Partial<TState> | null;
  dispatch: (action: TAction) => void;
}

export function usePlayerEngine<TState, TAction>({
  partyCode,
  playerId,
  active,
}: UsePlayerEngineOptions): UsePlayerEngineReturn<TState, TAction> {
  const [state, setState] = useState<TState | null>(null);
  const [playerState, setPlayerState] = useState<Partial<TState> | null>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  const privateChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!active || !playerId) return;

    const gameChannel = supabase.channel(`tapin:${partyCode}:game`);

    gameChannel
      .on("broadcast", { event: "game:state" }, ({ payload }) => {
        setState(payload.state as TState);
      })
      .subscribe();

    gameChannelRef.current = gameChannel;

    const privateChannel = supabase.channel(
      `tapin:${partyCode}:private:${playerId}`,
    );

    privateChannel
      .on("broadcast", { event: "game:player-state" }, ({ payload }) => {
        setPlayerState(payload.state as Partial<TState>);
      })
      .subscribe();

    privateChannelRef.current = privateChannel;

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(privateChannel);
      gameChannelRef.current = null;
      privateChannelRef.current = null;
    };
  }, [active, partyCode, playerId]);

  const dispatch = useCallback(
    (action: TAction) => {
      if (!gameChannelRef.current) return;

      gameChannelRef.current.send({
        type: "broadcast",
        event: "game:action",
        payload: { action, playerId },
      });
    },
    [playerId],
  );

  return { state, playerState, dispatch };
}
