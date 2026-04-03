"use client";

import {
  use,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "@/games/registry";
import { useParty } from "@/lib/party/useParty";
import { loadPartySession } from "@/lib/party/session";
import { touchRecentParty } from "@/lib/party/recentParties";
import { getGame } from "@/lib/engine/registry";
import { useGameEngine } from "@/lib/engine/useGameEngine";
import { usePlayerEngine } from "@/lib/engine/usePlayerEngine";
import { Lobby } from "@/components/party/Lobby";
import { Button } from "@/components/ui/Button";
import type { GameDefinition } from "@/lib/engine/types";
import type { Player } from "@/lib/party/types";

function ConnectingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-svh bg-white px-4">
      <p className="text-gray-400 text-lg text-center">{message}</p>
    </div>
  );
}

export default function PartyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code } = use(params);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [connectTimedOut, setConnectTimedOut] = useState(false);

  const hasSessionForCode = useSyncExternalStore(
    () => () => {},
    () => {
      const s = loadPartySession();
      return !!(s && s.code === code);
    },
    () => true,
  );

  const onPlayerLeave = useCallback((player: Player) => {
    toast(`${player.name} disconnected`, {
      description: "They left the party.",
    });
  }, []);

  const {
    party,
    playerId,
    isHost,
    connected,
    connectionIssue,
    broadcastUpdate,
  } = useParty({
    code,
    autoConnect: true,
    reconnectAttempt,
    onPlayerLeave,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const game: GameDefinition<any, any, any> | null = party?.gameId
    ? getGame(party.gameId) ?? null
    : null;

  useEffect(() => {
    if (party?.gameId) {
      touchRecentParty(code, { gameId: party.gameId });
    }
  }, [code, party?.gameId]);

  useEffect(() => {
    if (!hasSessionForCode) return;
    if (connected || connectionIssue !== "none") return;
    const t = setTimeout(() => setConnectTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, [hasSessionForCode, connected, connectionIssue, reconnectAttempt]);

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

  if (!hasSessionForCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 gap-6">
        <div className="w-full max-w-sm text-center space-y-2">
          <h1 className="text-xl font-semibold text-violet-950">
            No saved session
          </h1>
          <p className="text-violet-700/90 text-sm leading-relaxed">
            This device doesn&apos;t have party credentials for{" "}
            <span className="font-mono tracking-wider">{code}</span>. Join again
            with the party code or QR link, or open the menu to rejoin from
            recent parties.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="lg" className="w-full" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/join/${code}`)}
          >
            Join this party
          </Button>
        </div>
      </div>
    );
  }

  const connectionFailed =
    connectionIssue !== "none" || connectTimedOut;

  if (connectionFailed && !connected) {
    const detail =
      connectionIssue === "timed_out"
        ? "The connection timed out."
        : connectionIssue === "channel_error"
          ? "Could not connect to the party channel."
          : "Couldn’t reach the party in time.";

    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 gap-6">
        <div className="w-full max-w-sm text-center space-y-2">
          <h1 className="text-xl font-semibold text-violet-950">
            Couldn&apos;t connect
          </h1>
          <p className="text-violet-700/90 text-sm leading-relaxed">{detail}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setConnectTimedOut(false);
              setReconnectAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Home
          </Button>
        </div>
      </div>
    );
  }

  const partyEnded =
    connected &&
    party &&
    party.players.length > 0 &&
    !party.players.some((p) => p.isHost);

  if (partyEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 gap-6">
        <div className="w-full max-w-sm text-center space-y-2">
          <h1 className="text-xl font-semibold text-violet-950">
            This party has ended
          </h1>
          <p className="text-violet-700/90 text-sm leading-relaxed">
            The host is no longer in the party. Start a new one from home or
            join another code.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full max-w-xs"
          onClick={() => router.push("/")}
        >
          Home
        </Button>
      </div>
    );
  }

  if (!connected || !party) {
    return <ConnectingScreen message="Connecting to party…" />;
  }

  if (isPlaying && game) {
    const GamePlayerView = game.PlayerView;
    const currentState = isHost
      ? engine.state
      : playerEngine.playerState ?? playerEngine.state;

    if (!currentState) {
      return <ConnectingScreen message="Loading game…" />;
    }

    return (
      <div className="h-svh min-h-0 overflow-hidden bg-white px-4 flex flex-col">
        <div className="w-full max-w-sm mx-auto flex-1 min-h-0 flex flex-col">
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
    <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 py-12">
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
