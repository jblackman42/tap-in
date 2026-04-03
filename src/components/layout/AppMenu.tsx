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
    return "bg-tertiary text-white";
  if (result === "empty")
    return "bg-secondary-container text-secondary-dark";
  return "bg-surface-high text-outline";
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
        className="fixed top-4 right-4 z-50 flex h-12 w-12 items-center justify-center bg-tertiary-container text-foreground rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_#1c1b1b] hover:rotate-2 hover:scale-110 transition-transform active:translate-y-0.5 active:translate-x-0.5"
      >
        <span className="sr-only">Menu</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
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
          className="fixed inset-0 z-100 flex flex-col bg-surface/95 backdrop-blur-md memphis-diag"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-menu-title"
        >
          <div className="flex shrink-0 items-center justify-between bg-transparent px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex flex-col">
              <span
                id="app-menu-title"
                className="text-3xl font-headline font-bold italic tracking-tighter text-primary drop-shadow-[4px_4px_0px_#006970] uppercase"
              >
                Tap In
              </span>
              <span className="font-headline font-bold text-xs tracking-[0.2em] uppercase text-secondary">
                Menu
              </span>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="flex h-12 w-12 items-center justify-center bg-surface-highest rounded-full border-2 border-foreground hover:rotate-90 transition-transform active:scale-90"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-10">
              {showRecentParties && recent.length > 0 && (
                <section className="flex flex-col gap-4" aria-label="Recent parties">
                  <div className="space-y-1">
                    <h2 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground -rotate-1 origin-left">
                      Recent Parties
                    </h2>
                    <p className="font-label text-sm text-outline leading-tight">
                      Rejoin with one tap if the room is still up.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {recent.map((entry, i) => {
                      const gameTitle = entry.gameId
                        ? getGame(entry.gameId)?.name ?? entry.gameId
                        : null;
                      const probe = probeByCode[entry.code];
                      const shadowColors = ["#506600", "#006970", "#bb0058", "#1c1b1b"];
                      const shadowColor = shadowColors[i % shadowColors.length];
                      return (
                        <li
                          key={entry.code}
                          className="bg-surface-low p-5 wobbly-br-1 border-4 border-foreground/10 relative overflow-hidden"
                          style={{ boxShadow: `8px 8px 0px 0px ${shadowColor}20` }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="bg-foreground text-surface px-2 py-0.5 font-label font-bold text-[10px] tracking-widest uppercase inline-block rounded-sm">
                                Code: {entry.code}
                              </span>
                              {gameTitle && (
                                <h3 className="font-headline font-bold text-xl text-foreground uppercase mt-1">
                                  {gameTitle}
                                </h3>
                              )}
                              <p className="font-label text-xs text-outline mt-0.5">
                                Last here · {formatLastSeen(entry.lastSeenAt)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusClass(probe)}`}
                            >
                              {statusLabel(probe)}
                            </span>
                          </div>
                          <div className="flex gap-3">
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
                              className="shrink-0 px-5"
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

              <section className="flex flex-col gap-4">
                <h2 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground rotate-1 origin-left">
                  Join with Code
                </h2>
                <div className="bg-surface-highest p-6 rounded-[2rem] border-4 border-foreground shadow-[12px_12px_0px_0px_#bb0058]">
                  <Input
                    label="Party code"
                    placeholder="ENTER CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="text-center text-3xl tracking-[0.5em] font-headline font-bold"
                    maxLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <Button
                    size="lg"
                    className="w-full mt-4"
                    variant="secondary"
                    onClick={joinWithCode}
                    disabled={joinCode.trim().length < 4}
                  >
                    Continue to join
                  </Button>
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="font-headline font-bold text-2xl uppercase tracking-tight text-foreground -rotate-1">
                  Navigation
                </h2>
                {!isHome ? (
                  <Button size="lg" variant="secondary" className="w-full" onClick={goHome}>
                    Home
                  </Button>
                ) : (
                  <p className="text-center text-sm font-label text-outline py-2">
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
