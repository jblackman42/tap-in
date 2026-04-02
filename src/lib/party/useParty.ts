"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Party, Player } from "./types";
import {
  loadPartySession,
  clearPartySession,
  type PartySession,
} from "./session";

interface UsePartyOptions {
  code?: string;
  autoConnect?: boolean;
  onPlayerJoin?: (player: Player) => void;
  onPlayerLeave?: (player: Player) => void;
}

interface UsePartyReturn {
  party: Party | null;
  playerId: string | null;
  isHost: boolean;
  channel: RealtimeChannel | null;
  connected: boolean;
  leaveParty: () => void;
  updatePartyStatus: (status: Party["status"]) => void;
  setGameId: (gameId: string) => void;
  broadcastUpdate: (update: Partial<Party>) => void;
}

export function useParty(options: UsePartyOptions = {}): UsePartyReturn {
  const { code, autoConnect = false } = options;
  const [party, setParty] = useState<Party | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const optionsRef = useRef(options);
  const connectedRef = useRef(false);
  optionsRef.current = options;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    connectedRef.current = false;
    setConnected(false);
  }, []);

  const connect = useCallback(
    (session: PartySession) => {
      if (connectedRef.current) return;
      connectedRef.current = true;

      const isCreator = session.intent === "create";
      const pid = session.playerId;

      setPlayerId(pid);
      setIsHost(isCreator);
      setParty({
        code: session.code,
        hostId: isCreator ? pid : "",
        gameId: session.gameId ?? null,
        players: [],
        status: "lobby",
        createdAt: Date.now(),
      });

      cleanup();

      const channel = supabase.channel(`tapin:${session.code}`, {
        config: { presence: { key: pid } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const presenceState = channel.presenceState<{
            id: string;
            name: string;
            isHost: boolean;
            joinedAt: number;
            data: Record<string, unknown>;
          }>();

          const deduped = new Map<string, Player>();
          for (const p of Object.values(presenceState).flat()) {
            if (!deduped.has(p.id)) {
              deduped.set(p.id, {
                id: p.id,
                name: p.name,
                isHost: p.isHost,
                joinedAt: p.joinedAt,
                data: p.data,
              });
            }
          }
          const players: Player[] = Array.from(deduped.values())
            .sort((a, b) => a.joinedAt - b.joinedAt);

          setParty((prev) => (prev ? { ...prev, players } : null));
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          for (const p of newPresences) {
            const player = p as unknown as Player;
            if (player.id !== pid) {
              optionsRef.current.onPlayerJoin?.(player);
            }
          }
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          for (const p of leftPresences) {
            const player = p as unknown as Player;
            optionsRef.current.onPlayerLeave?.(player);
          }
        })
        .on("broadcast", { event: "party:update" }, ({ payload }) => {
          setParty((prev) => (prev ? { ...prev, ...payload } : null));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            await channel.track({
              id: pid,
              name: session.name,
              isHost: isCreator,
              joinedAt: Date.now(),
              data: session.data ?? {},
            });
          }
        });

      channelRef.current = channel;
    },
    [cleanup],
  );

  useEffect(() => {
    if (!autoConnect || !code || connectedRef.current) return;

    const session = loadPartySession();
    if (session && session.code === code) {
      connect(session);
    }

    return cleanup;
  }, [autoConnect, code, connect, cleanup]);

  const leaveParty = useCallback(() => {
    cleanup();
    clearPartySession();
    setParty(null);
    setPlayerId(null);
    setIsHost(false);
  }, [cleanup]);

  const updatePartyStatus = useCallback(
    (status: Party["status"]) => {
      if (!channelRef.current || !isHost) return;
      channelRef.current.send({
        type: "broadcast",
        event: "party:update",
        payload: { status },
      });
      setParty((prev) => (prev ? { ...prev, status } : null));
    },
    [isHost],
  );

  const setGameId = useCallback(
    (gameId: string) => {
      if (!channelRef.current || !isHost) return;
      channelRef.current.send({
        type: "broadcast",
        event: "party:update",
        payload: { gameId },
      });
      setParty((prev) => (prev ? { ...prev, gameId } : null));
    },
    [isHost],
  );

  const broadcastUpdate = useCallback(
    (update: Partial<Party>) => {
      if (!channelRef.current || !isHost) return;
      channelRef.current.send({
        type: "broadcast",
        event: "party:update",
        payload: update,
      });
      setParty((prev) => (prev ? { ...prev, ...update } : null));
    },
    [isHost],
  );

  return {
    party,
    playerId,
    isHost,
    channel: channelRef.current,
    connected,
    leaveParty,
    updatePartyStatus,
    setGameId,
    broadcastUpdate,
  };
}
