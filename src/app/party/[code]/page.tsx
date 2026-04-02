"use client";

import { use, useCallback, useEffect, useState } from "react";
import "@/games/registry";
import { useParty } from "@/lib/party/useParty";
import { getGame } from "@/lib/engine/registry";
import { useGameEngine } from "@/lib/engine/useGameEngine";
import { usePlayerEngine } from "@/lib/engine/usePlayerEngine";
import { Lobby } from "@/components/party/Lobby";
import type { GameDefinition } from "@/lib/engine/types";

export default function PartyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { party, playerId, isHost, connected, broadcastUpdate } = useParty({
    code,
    autoConnect: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [game, setGame] = useState<GameDefinition<any, any, any> | null>(null);

  useEffect(() => {
    if (party?.gameId) {
      const g = getGame(party.gameId);
      if (g) setGame(g);
    }
  }, [party?.gameId]);

  const isPlaying = party?.status === "playing";

  const engine = useGameEngine({
    game: game!,
    partyCode: code,
    players: party?.players ?? [],
    isHost,
    active: isHost && connected,
  });

  const playerEngine = usePlayerEngine({
    partyCode: code,
    playerId: playerId ?? "",
    active: !isHost && connected,
  });

  const hostDispatch = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (action: any) => {
      if (playerId) {
        engine.dispatch(action, playerId);
      }
    },
    [engine, playerId],
  );

  const dispatch = isHost ? hostDispatch : playerEngine.dispatch;

  function handleStartGame() {
    if (!isHost || !party || !party.gameId) return;
    engine.start();
    broadcastUpdate({ gameId: party.gameId, status: "playing" });
  }

  if (!connected || !party) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-white">
        <p className="text-gray-400 text-lg">Connecting to party...</p>
      </div>
    );
  }

  if (isPlaying && game) {
    const GamePlayerView = game.PlayerView;
    const currentState = isHost
      ? engine.state
      : playerEngine.playerState ?? playerEngine.state;

    if (!currentState) {
      return (
        <div className="flex items-center justify-center min-h-dvh bg-white">
          <p className="text-gray-400 text-lg">Loading game...</p>
        </div>
      );
    }

    return (
      <div className="min-h-dvh bg-white px-4 py-6">
        <div className="w-full max-w-sm mx-auto">
          <GamePlayerView
            state={currentState}
            playerId={playerId ?? ""}
            players={party.players}
            dispatch={dispatch}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <Lobby
          partyCode={code}
          players={party.players}
          currentPlayerId={playerId}
          isHost={isHost}
          game={game}
          onStartGame={handleStartGame}
        />
      </div>
    </div>
  );
}
