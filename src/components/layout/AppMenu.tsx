"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import "@/games/registry";
import {
  clearPartySession,
  loadPartySession,
  savePartySession,
} from "@/lib/party/session";
import {
  forgetRecentParty,
  loadRecentParties,
  recentPartyToSession,
  type RecentPartyEntry,
} from "@/lib/party/recentParties";
import {
  probePartyPresence,
  type PresenceProbeResult,
} from "@/lib/party/presenceProbe";
import { getGame } from "@/lib/engine/registry";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function formatLastSeen(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 45) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function statusLabel(result: PresenceProbeResult | undefined): string {
  if (result === undefined) return "…";
  if (result === "active") return "Active";
  if (result === "empty") return "Likely ended";
  return "Unknown";
}

function statusClass(result: PresenceProbeResult | undefined): string {
  if (result === "active")
    return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  if (result === "empty") return "bg-amber-50 text-amber-900 ring-amber-200/80";
  return "bg-violet-50 text-violet-700 ring-violet-200/80";
}

export function AppMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [recent, setRecent] = useState<RecentPartyEntry[]>([]);
  const [probeByCode, setProbeByCode] = useState<
    Record<string, PresenceProbeResult | undefined>
  >({});

  const isHome = pathname === "/";
  const partyPathMatch = pathname.match(/^\/party\/([^/]+)/);
  const sessionCode = useSyncExternalStore(
    () => () => {},
    () => loadPartySession()?.code ?? null,
    () => null,
  );
  const inActiveParty =
    !!partyPathMatch &&
    !!sessionCode &&
    sessionCode === partyPathMatch[1];
  const showRecentParties = !inActiveParty;

  useLockBodyScroll(open);

  const refreshRecent = useCallback(() => {
    setRecent(loadRecentParties());
  }, []);

  function handleOpenMenu() {
    setRecent(loadRecentParties());
    setOpen(true);
  }

  useEffect(() => {
    if (!open || !showRecentParties || recent.length === 0) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProbeByCode({});
    });

    void (async () => {
      for (const entry of recent) {
        if (cancelled) return;
        setProbeByCode((prev) => ({ ...prev, [entry.code]: undefined }));
        const result = await probePartyPresence(entry.code);
        if (cancelled) return;
        setProbeByCode((prev) => ({ ...prev, [entry.code]: result }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, recent, showRecentParties]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setJoinCode("");
  }

  function goHome() {
    clearPartySession();
    close();
    router.push("/");
  }

  function joinWithCode() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    close();
    router.push(`/join/${code}`);
  }

  function rejoin(entry: RecentPartyEntry) {
    savePartySession(recentPartyToSession(entry));
    close();
    router.push(`/party/${entry.code}`);
  }

  function forget(entry: RecentPartyEntry) {
    forgetRecentParty(entry.code);
    refreshRecent();
    setProbeByCode((prev) => {
      const next = { ...prev };
      delete next[entry.code];
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={handleOpenMenu}
        className="fixed top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-violet-950 shadow-md ring-1 ring-violet-200/80 backdrop-blur-sm hover:bg-violet-50 active:bg-violet-100/80"
      >
        <span className="sr-only">Menu</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-menu-title"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-violet-100 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div>
              <h2
                id="app-menu-title"
                className="text-lg font-semibold text-violet-950"
              >
                Tap In
              </h2>
              <p className="text-xs text-violet-500 mt-0.5">Menu</p>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-violet-700 hover:bg-violet-100 active:bg-violet-200/60"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-10">
              {showRecentParties && recent.length > 0 && (
                <section className="flex flex-col gap-3" aria-label="Recent parties">
                  <div>
                    <p className="text-sm font-semibold text-violet-900">
                      Recent parties
                    </p>
                    <p className="text-xs text-violet-500 mt-1 leading-relaxed">
                      Rejoin with one tap if the room is still up. Status is a
                      best-effort hint.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {recent.map((entry) => {
                      const gameTitle = entry.gameId
                        ? getGame(entry.gameId)?.name ?? entry.gameId
                        : null;
                      const probe = probeByCode[entry.code];
                      return (
                        <li
                          key={entry.code}
                          className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm ring-1 ring-violet-100/60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-lg tracking-[0.2em] text-violet-950">
                                {entry.code}
                              </p>
                              {gameTitle && (
                                <p className="text-sm text-violet-700 truncate mt-0.5">
                                  {gameTitle}
                                </p>
                              )}
                              <p className="text-xs text-violet-500 mt-1">
                                Last here · {formatLastSeen(entry.lastSeenAt)}
                              </p>
                              <span
                                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusClass(probe)}`}
                              >
                                {statusLabel(probe)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="md"
                              className="flex-1"
                              onClick={() => rejoin(entry)}
                            >
                              Rejoin
                            </Button>
                            <Button
                              size="md"
                              variant="secondary"
                              className="shrink-0 px-4"
                              onClick={() => forget(entry)}
                            >
                              Forget
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-violet-900">
                  Join with code
                </p>
                <Input
                  label="Party code"
                  placeholder="Enter party code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Button
                  size="lg"
                  className="w-full"
                  onClick={joinWithCode}
                  disabled={joinCode.trim().length < 4}
                >
                  Continue to join
                </Button>
              </section>

              <section className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-violet-900">
                  Navigation
                </p>
                {!isHome ? (
                  <Button size="lg" variant="secondary" className="w-full" onClick={goHome}>
                    Home
                  </Button>
                ) : (
                  <p className="text-center text-sm text-violet-500 py-2">
                    You&apos;re on the home screen.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
