"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Player } from "@/lib/party/types";
import type { GameDefinition } from "./types";

interface UseGameEngineOptions<TState, TAction, TPlayerData> {
  game: GameDefinition<TState, TAction, TPlayerData>;
  partyCode: string;
  players: Player<TPlayerData>[];
  isHost: boolean;
  active: boolean;
}

interface UseGameEngineReturn<TState, TAction> {
  state: TState | null;
  started: boolean;
  start: () => void;
  dispatch: (action: TAction, playerId: string) => void;
}

export function useGameEngine<TState, TAction, TPlayerData = Record<string, unknown>>({
  game,
  partyCode,
  players,
  isHost,
  active,
}: UseGameEngineOptions<TState, TAction, TPlayerData>): UseGameEngineReturn<TState, TAction> {
  const [state, setState] = useState<TState | null>(null);
  const [started, setStarted] = useState(false);
  const stateRef = useRef<TState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelReadyRef = useRef(false);
  const privateChannelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const privateReadyRef = useRef<Set<string>>(new Set());
  const playersRef = useRef(players);
  // Keep latest players/state for async broadcast callbacks without resubscribing channels.
  // eslint-disable-next-line react-hooks/refs -- intentional ref sync
  playersRef.current = players;

  // eslint-disable-next-line react-hooks/refs -- intentional ref sync
  stateRef.current = state;

  const broadcastState = useCallback(
    (newState: TState) => {
      if (!channelRef.current || !channelReadyRef.current) return;

      channelRef.current.send({
        type: "broadcast",
        event: "game:state",
        payload: { state: newState },
      });

      const currentPlayers = playersRef.current;
      for (const player of currentPlayers) {
        const playerView = game.getPlayerView(newState, player.id);
        const privateChannel = privateChannelsRef.current.get(player.id);

        if (privateChannel && privateReadyRef.current.has(player.id)) {
          privateChannel.send({
            type: "broadcast",
            event: "game:player-state",
            payload: { state: playerView },
          });
        }
      }
    },
    [game],
  );

  useEffect(() => {
    if (!isHost || !partyCode) return;

    const channel = supabase.channel(`tapin:${partyCode}:game`);

    channel
      .on("broadcast", { event: "game:action" }, ({ payload }) => {
        const { action, playerId } = payload as {
          action: TAction;
          playerId: string;
        };

        if (stateRef.current !== null) {
          const newState = game.reducer(stateRef.current, action, playerId);
          stateRef.current = newState;
          setState(newState);
          broadcastState(newState);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelReadyRef.current = true;
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      channelReadyRef.current = false;
      for (const ch of privateChannelsRef.current.values()) {
        supabase.removeChannel(ch);
      }
      privateChannelsRef.current.clear();
      privateReadyRef.current.clear();
    };
  }, [isHost, partyCode, game, broadcastState]);

  useEffect(() => {
    if (!isHost || !partyCode || !active) return;

    for (const player of players) {
      if (!privateChannelsRef.current.has(player.id)) {
        const ch = supabase.channel(
          `tapin:${partyCode}:private:${player.id}`,
        );
        ch.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            privateReadyRef.current.add(player.id);
          }
        });
        privateChannelsRef.current.set(player.id, ch);
      }
    }
  }, [isHost, partyCode, active, players]);

  const dispatch = useCallback(
    (action: TAction, playerId: string) => {
      if (stateRef.current === null) return;
      const newState = game.reducer(stateRef.current, action, playerId);
      stateRef.current = newState;
      setState(newState);
      broadcastState(newState);
    },
    [game, broadcastState],
  );

  const start = useCallback(() => {
    if (!isHost) return;

    const initialState = game.createInitialState(playersRef.current);
    stateRef.current = initialState;
    setState(initialState);
    setStarted(true);

    function tryBroadcast() {
      if (channelRef.current && channelReadyRef.current) {
        broadcastState(initialState);
      }
    }

    tryBroadcast();

    const delays = [200, 500, 1000, 2000];
    for (const delay of delays) {
      setTimeout(() => {
        if (stateRef.current !== null) {
          broadcastState(stateRef.current);
        }
      }, delay);
    }
  }, [isHost, game, broadcastState]);

  return { state, started, start, dispatch };
}
