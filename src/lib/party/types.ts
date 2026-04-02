export interface Player<TData = Record<string, unknown>> {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  data: TData;
}

export interface Party {
  code: string;
  hostId: string;
  gameId: string | null;
  players: Player[];
  status: "lobby" | "playing" | "finished";
  createdAt: number;
}
