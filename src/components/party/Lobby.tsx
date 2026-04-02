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
        <div className="text-center">
          <p className="text-sm text-gray-500">Playing</p>
          <p className="text-xl font-bold text-gray-900">{game.name}</p>
        </div>
      )}

      {CustomLobby ? (
        <CustomLobby
          players={players}
          partyCode={partyCode}
          isHost={isHost}
        />
      ) : (
        <PlayerList players={players} currentPlayerId={currentPlayerId} />
      )}

      {isHost && game && (
        <div className="space-y-2">
          {players.length < game.minPlayers && (
            <p className="text-sm text-center text-amber-600">
              Need at least {game.minPlayers} players to start
              ({players.length}/{game.minPlayers})
            </p>
          )}
          {players.length > game.maxPlayers && (
            <p className="text-sm text-center text-red-600">
              Too many players (max {game.maxPlayers})
            </p>
          )}
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart}
            onClick={onStartGame}
          >
            Start Game
          </Button>
        </div>
      )}

      {!isHost && (
        <p className="text-center text-gray-400 text-sm">
          Waiting for the host to start the game...
        </p>
      )}
    </div>
  );
}
