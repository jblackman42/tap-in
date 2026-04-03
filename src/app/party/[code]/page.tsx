"use client";

import {
  use,
  useCallback,
  useEffect,
  useRef,
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
    <div className="flex items-center justify-center min-h-svh bg-surface px-6 relative z-10">
      <p className="font-headline font-bold text-xl text-outline text-center uppercase tracking-wider">
        {message}
      </p>
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

  const broadcastRef = useRef<{ broadcastUpdate: (u: Partial<import("@/lib/party/types").Party>) => void; party: import("@/lib/party/types").Party | null }>({ broadcastUpdate: () => {}, party: null });

  const onPlayerLeave = useCallback((player: Player) => {
    toast(`${player.name} disconnected`, {
      description: "They left the party.",
    });
  }, []);

  const onPlayerJoin = useCallback(() => {
    const { broadcastUpdate, party } = broadcastRef.current;
    if (party?.gameId) {
      broadcastUpdate({ gameId: party.gameId });
    }
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
    onPlayerJoin,
  });

  broadcastRef.current = { broadcastUpdate, party };

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
    if (isHost && connected && party?.gameId) {
      broadcastUpdate({ gameId: party.gameId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, connected]);

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

  const handleReturnToLobby = useCallback(() => {
    broadcastUpdate({ status: "lobby" });
  }, [broadcastUpdate]);

  if (!hasSessionForCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 gap-6 relative z-10">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground">
            No saved session
          </h1>
          <p className="font-body text-sm text-outline leading-relaxed">
            This device doesn&apos;t have party credentials for{" "}
            <span className="font-headline font-bold tracking-wider">{code}</span>. Join again
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
          : "Couldn't reach the party in time.";

    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 gap-6 relative z-10">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground">
            Couldn&apos;t connect
          </h1>
          <p className="font-body text-sm text-outline leading-relaxed">{detail}</p>
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
      <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 gap-6 relative z-10">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground">
            This party has ended
          </h1>
          <p className="font-body text-sm text-outline leading-relaxed">
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

    const fullBleed = game.id === "blitzkrieg";

    return (
      <div className={`h-svh min-h-0 overflow-hidden bg-surface flex flex-col relative z-10 ${fullBleed ? "" : "px-4"}`}>
        <div className={`flex-1 min-h-0 flex flex-col ${fullBleed ? "w-full" : "w-full max-w-sm mx-auto"}`}>
          <GamePlayerView
            state={currentState}
            playerId={playerId ?? ""}
            players={party.players}
            dispatch={dispatch}
            onReturnToLobby={handleReturnToLobby}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 py-12 relative z-10">
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
