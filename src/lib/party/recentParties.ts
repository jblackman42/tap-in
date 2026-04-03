import type { PartySession } from "./session";

const STORAGE_KEY = "tapin:recentParties";
const MAX_ENTRIES = 10;

export interface RecentPartyEntry {
  code: string;
  playerId: string;
  name: string;
  intent: "create" | "join";
  gameId?: string;
  data?: Record<string, unknown>;
  lastSeenAt: number;
}

function parse(raw: string | null): RecentPartyEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentPartyEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as RecentPartyEntry).code === "string" &&
        typeof (e as RecentPartyEntry).playerId === "string" &&
        typeof (e as RecentPartyEntry).name === "string" &&
        ((e as RecentPartyEntry).intent === "create" ||
          (e as RecentPartyEntry).intent === "join") &&
        typeof (e as RecentPartyEntry).lastSeenAt === "number",
    );
  } catch {
    return [];
  }
}

export function loadRecentParties(): RecentPartyEntry[] {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(STORAGE_KEY));
}

function save(entries: RecentPartyEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Upsert from a party session (e.g. right after savePartySession). */
export function recordRecentPartyFromSession(session: PartySession): void {
  const entries = loadRecentParties();
  const now = Date.now();
  const idx = entries.findIndex((e) => e.code === session.code);
  const next: RecentPartyEntry = {
    code: session.code,
    playerId: session.playerId,
    name: session.name,
    intent: session.intent,
    gameId: session.gameId,
    data: session.data,
    lastSeenAt: now,
  };
  if (idx >= 0) {
    entries[idx] = {
      ...entries[idx],
      ...next,
      lastSeenAt: now,
    };
  } else {
    entries.unshift(next);
  }
  const deduped = dedupeAndCap(entries);
  save(deduped);
}

/** Merge gameId (and refresh lastSeenAt) when known from the live party. */
export function touchRecentParty(code: string, updates: { gameId?: string | null }): void {
  const entries = loadRecentParties();
  const idx = entries.findIndex((e) => e.code === code);
  if (idx < 0) return;
  const cur = entries[idx];
  entries[idx] = {
    ...cur,
    lastSeenAt: Date.now(),
    ...(updates.gameId != null && updates.gameId !== ""
      ? { gameId: updates.gameId }
      : {}),
  };
  save(dedupeAndCap(entries));
}

function dedupeAndCap(entries: RecentPartyEntry[]): RecentPartyEntry[] {
  const byCode = new Map<string, RecentPartyEntry>();
  for (const e of entries) {
    const prev = byCode.get(e.code);
    if (!prev || e.lastSeenAt >= prev.lastSeenAt) {
      byCode.set(e.code, e);
    }
  }
  const sorted = Array.from(byCode.values()).sort(
    (a, b) => b.lastSeenAt - a.lastSeenAt,
  );
  return sorted.slice(0, MAX_ENTRIES);
}

export function forgetRecentParty(code: string): void {
  const entries = loadRecentParties().filter((e) => e.code !== code);
  save(entries);
}

export function recentPartyToSession(entry: RecentPartyEntry): PartySession {
  return {
    intent: entry.intent,
    code: entry.code,
    playerId: entry.playerId,
    name: entry.name,
    gameId: entry.gameId,
    data: entry.data,
  };
}
