"use client";

import { nanoid } from "nanoid";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type PresenceProbeResult = "active" | "empty" | "unknown";

function isProbePayload(p: {
  name: string;
  data?: Record<string, unknown>;
}): boolean {
  return (
    p.name === "__tapin_probe__" ||
    p.data?.tapinProbe === true
  );
}

/** Non-probe tracked presences (real players in the party channel). */
function countRealPlayers(
  state: Record<
    string,
    Array<{ name: string; data?: Record<string, unknown> }>
  >,
): number {
  let n = 0;
  for (const list of Object.values(state)) {
    for (const p of list) {
      if (!isProbePayload(p)) n++;
    }
  }
  return n;
}

/**
 * Best-effort: joins the party presence channel briefly, tracks a probe
 * presence, reads merged state, then untracks and leaves.
 */
export function probePartyPresence(code: string): Promise<PresenceProbeResult> {
  return new Promise((resolve) => {
    const topic = `realtime:tapin:${code}`;
    const existing = supabase.getChannels().find((c) => c.topic === topic);
    if (existing) {
      resolve("unknown");
      return;
    }

    const probeKey = `probe:${nanoid(8)}`;
    let channel: RealtimeChannel | null = null;
    let settled = false;
    let tracked = false;

    const finish = (result: PresenceProbeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void cleanup().finally(() => resolve(result));
    };

    const cleanup = async () => {
      if (!channel) return;
      try {
        await channel.untrack();
      } catch {
        /* ignore */
      }
      supabase.removeChannel(channel);
      channel = null;
    };

    const timer = setTimeout(() => finish("unknown"), 6000);

    channel = supabase.channel(`tapin:${code}`, {
      config: { presence: { key: probeKey } },
    });

    try {
      channel
        .on("presence", { event: "sync" }, () => {
          if (!channel || settled) return;
          const state = channel.presenceState<{
            name: string;
            data?: Record<string, unknown>;
          }>();
          const real = countRealPlayers(state);
          if (!tracked) {
            if (real > 0) finish("active");
            return;
          }
          if (real === 0) finish("empty");
          else finish("active");
        })
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED" || !channel || settled) return;
          try {
            await channel.track({
              id: probeKey,
              name: "__tapin_probe__",
              isHost: false,
              joinedAt: Date.now(),
              data: { tapinProbe: true },
            });
            tracked = true;
          } catch {
            finish("unknown");
          }
        });
    } catch {
      finish("unknown");
    }
  });
}
