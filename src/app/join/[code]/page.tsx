"use client";

import { use, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import "@/games/registry";
import { savePartySession } from "@/lib/party/session";
import { recordRecentPartyFromSession } from "@/lib/party/recentParties";
import { JoinForm } from "@/components/party/JoinForm";

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function handleJoin(name: string, data: Record<string, unknown>) {
    setLoading(true);
    const playerId = nanoid();

    const session = {
      intent: "join" as const,
      code,
      playerId,
      name,
      data,
    };
    savePartySession(session);
    recordRecentPartyFromSession(session);

    router.push(`/party/${code}`);
  }

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 py-12 relative z-10">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-headline font-bold text-3xl italic tracking-tighter text-primary drop-shadow-[4px_4px_0px_#006970] uppercase">
            Tap In
          </h1>
          <p className="font-label text-outline uppercase tracking-widest text-sm mt-2">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-surface px-6 py-12 relative z-10">
      <div className="w-full max-w-sm">
        <JoinForm
          variant="join"
          fields={[]}
          partyCode={code}
          onSubmit={handleJoin}
          loading={loading}
        />
      </div>
    </div>
  );
}
