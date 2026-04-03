"use client";

import { use, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import "@/games/registry";
import { getAllGames } from "@/lib/engine/registry";
import { savePartySession } from "@/lib/party/session";
import { recordRecentPartyFromSession } from "@/lib/party/recentParties";
import { JoinForm } from "@/components/party/JoinForm";
import type { JoinField } from "@/lib/engine/types";

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

  const allGames = getAllGames();
  const defaultFields: JoinField[] =
    allGames.length > 0 ? allGames[0].joinFields : [];

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
      <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tap In</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <JoinForm
          variant="join"
          fields={defaultFields}
          partyCode={code}
          onSubmit={handleJoin}
          loading={loading}
        />
      </div>
    </div>
  );
}
