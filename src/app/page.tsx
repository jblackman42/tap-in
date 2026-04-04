"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import "@/games/registry";
import { generatePartyCode } from "@/lib/party/party-code";
import { savePartySession } from "@/lib/party/session";
import { recordRecentPartyFromSession } from "@/lib/party/recentParties";
import { getGame } from "@/lib/engine/registry";
import { TapInWordmark } from "@/components/brand/TapInWordmark";
import { GamePicker } from "@/components/party/GamePicker";
import { JoinForm } from "@/components/party/JoinForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const JoinQrScanStep = dynamic(
  () => import("@/components/party/JoinQrScanStep"),
  { ssr: false },
);

type Step = "game" | "profile";

type JoinStep = "default" | "scan-qr" | "enter-code";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("game");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinStep, setJoinStep] = useState<JoinStep>("default");
  const [creating, setCreating] = useState(false);

  const selectedGame = selectedGameId ? getGame(selectedGameId) : null;

  function handleGameSelect(gameId: string) {
    setSelectedGameId(gameId);
    setStep("profile");
  }

  function handleHostProfile(name: string, data: Record<string, unknown>) {
    if (!selectedGameId) return;
    setCreating(true);
    const code = generatePartyCode();
    const playerId = nanoid();

    const session = {
      intent: "create" as const,
      code,
      playerId,
      name,
      data,
      gameId: selectedGameId,
    };
    savePartySession(session);
    recordRecentPartyFromSession(session);

    router.push(`/party/${code}`);
  }

  function handleJoinWithCode() {
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  }

  const handleQrValidCode = useCallback(
    (code: string) => {
      router.push(`/join/${code}`);
    },
    [router],
  );

  const handleQrBack = useCallback(() => {
    setJoinStep("default");
  }, []);

  if (joinStep === "scan-qr") {
    return (
      <JoinQrScanStep onValidCode={handleQrValidCode} onBack={handleQrBack} />
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-surface text-foreground">
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-16">
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center gap-3 mb-10">
          <TapInWordmark />
          <div className="transform -rotate-1">
            <p className="font-headline font-bold text-lg text-secondary uppercase tracking-tight">
              Start a party, pick a game, you&apos;re in.
            </p>
            <div className="h-2 w-24 bg-primary mt-2 mx-auto" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          {step === "game" ? (
            <GamePicker onSelect={handleGameSelect} />
          ) : selectedGame ? (
            <JoinForm
              key={selectedGameId}
              variant="host"
              fields={selectedGame.joinFields}
              onSubmit={handleHostProfile}
              loading={creating}
              onBack={() => setStep("game")}
            />
          ) : null}

          <div className="relative mt-12">
            <div className="flex items-center gap-4">
              <div className="h-1 flex-1 bg-surface-highest" />
              <span className="font-label text-xs font-bold text-outline uppercase tracking-widest">
                or join an existing party
              </span>
              <div className="h-1 flex-1 bg-surface-highest" />
            </div>
          </div>

          <div className="mt-8 w-full">
            {joinStep === "enter-code" ? (
              <div className="bg-surface-highest p-6 rounded-[2rem] border-4 border-foreground space-y-4">
                <Input
                  label="Party code"
                  placeholder="ENTER CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-3xl tracking-[0.5em] font-headline font-bold"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleJoinWithCode}
                  disabled={joinCode.trim().length < 4}
                >
                  Join party
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setJoinStep("default");
                    setJoinCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setJoinStep("scan-qr")}
                >
                  Join with QR code
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setJoinStep("enter-code")}
                >
                  Join with party code
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
