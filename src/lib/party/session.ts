const STORAGE_KEY = "tapin:session";

export interface PartySession {
  intent: "create" | "join";
  code: string;
  playerId: string;
  name: string;
  gameId?: string;
  data?: Record<string, unknown>;
}

export function savePartySession(session: PartySession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadPartySession(): PartySession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartySession;
  } catch {
    return null;
  }
}

export function clearPartySession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
