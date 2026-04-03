"use client";

import type { Player } from "@/lib/party/types";
import type { GameDefinition } from "@/lib/engine/types";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { PlayerList } from "./PlayerList";
import { Button } from "@/components/ui/Button";

interface LobbyProps {
  partyCode: string;
  players: Player[];
  currentPlayerId: string | null;
  isHost: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  game: GameDefinition<any, any, any> | null;
  onStartGame: () => void;
}

export function Lobby({
  partyCode,
  players,
  currentPlayerId,
  isHost,
  game,
  onStartGame,
}: LobbyProps) {
  const canStart =
    isHost &&
    game &&
    players.length >= game.minPlayers &&
    players.length <= game.maxPlayers;

  const CustomLobby = game?.LobbyView;

  return (
    <div className="space-y-6">
      {isHost && <QRCodeDisplay code={partyCode} />}

      {game && (
        <div className="flex justify-center">
          <div className="bg-tertiary-container text-foreground px-6 py-2 rounded-full rotate-[-2deg] shadow-[4px_4px_0px_#1c1b1b] flex items-center gap-2">
            <span className="font-headline font-bold text-lg uppercase">
              Playing: {game.name}
            </span>
          </div>
        </div>
      )}

      {CustomLobby ? (
        <CustomLobby
          players={players}
          partyCode={partyCode}
          isHost={isHost}
        />
      ) : (
        <>
          <PlayerList players={players} currentPlayerId={currentPlayerId} />
          {!isHost && (
            <p className="text-center font-label text-outline text-sm uppercase tracking-wider">
              Waiting for the host to start the game...
            </p>
          )}
        </>
      )}

      {isHost && game && (
        <div className="space-y-3">
          {players.length < game.minPlayers && (
            <p className="text-sm text-center font-label font-bold text-primary">
              Need at least {game.minPlayers} players to start
              ({players.length}/{game.minPlayers})
            </p>
          )}
          {players.length > game.maxPlayers && (
            <p className="text-sm text-center font-label font-bold text-error">
              Too many players (max {game.maxPlayers})
            </p>
          )}
          <Button
            size="lg"
            className="w-full py-6 text-2xl"
            disabled={!canStart}
            onClick={onStartGame}
          >
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
}
