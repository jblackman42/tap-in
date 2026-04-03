import type { ComponentType } from "react";
import type { Player } from "@/lib/party/types";

export interface JoinField {
  name: string;
  label: string;
  type: "text" | "select" | "color" | "number";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
}

export interface PlayerViewProps<TState, TAction> {
  state: TState;
  playerId: string;
  players: Player[];
  dispatch: (action: TAction) => void;
  onReturnToLobby?: () => void;
}

export interface LobbyViewProps {
  players: Player[];
  partyCode: string;
  isHost: boolean;
}

export interface GameDefinition<
  TState = unknown,
  TAction = unknown,
  TPlayerData = Record<string, unknown>,
> {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;

  joinFields: JoinField[];

  createInitialState(players: Player<TPlayerData>[]): TState;

  reducer(state: TState, action: TAction, playerId: string): TState;

  getPlayerView(state: TState, playerId: string): Partial<TState>;

  PlayerView: ComponentType<PlayerViewProps<TState, TAction>>;
  LobbyView?: ComponentType<LobbyViewProps>;
}
