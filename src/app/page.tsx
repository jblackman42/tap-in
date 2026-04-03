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
    <div className="min-h-svh flex flex-col bg-white text-violet-950">
      <div className="flex-1 flex flex-col items-center px-4 pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-3 mb-10 sm:mb-14">
          <TapInWordmark />
          <p className="text-lg sm:text-xl text-violet-700/90 max-w-md leading-relaxed">
            Start a party, pick a game, you&apos;re in.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {step === "game" ? (
            <GamePicker
              selectedGameId={selectedGameId}
              onSelect={setSelectedGameId}
              onContinue={() => setStep("profile")}
            />
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
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-violet-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-violet-400">
                or join an existing party
              </span>
            </div>
          </div>

          <div className="mt-8 w-full">
            {joinStep === "enter-code" ? (
              <div className="space-y-3">
                <Input
                  label="Party code"
                  placeholder="Enter party code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-xl tracking-[0.3em] font-mono"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
