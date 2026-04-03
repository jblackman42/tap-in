"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { parseJoinCodeFromScan } from "@/lib/party/parse-join-qr";
import { Button } from "@/components/ui/Button";

function makeReaderElementId(reactId: string): string {
  const safe = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `join-qr-${safe || "reader"}`;
}

async function teardownScanner(
  scanner: Html5Qrcode | null | undefined,
  readerId: string,
) {
  if (scanner) {
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      /* already stopped or race with DOM clear */
    }
    try {
      scanner.clear();
    } catch {
      /* not scanning / already cleared */
    }
  }
  const el = document.getElementById(readerId);
  if (el) {
    el.innerHTML = "";
  }
}

interface JoinQrScanStepProps {
  onValidCode: (code: string) => void;
  onBack: () => void;
}

function JoinQrScanStep({ onValidCode, onBack }: JoinQrScanStepProps) {
  const readerId = makeReaderElementId(useId());
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  /** Previous effect’s full teardown (stop + DOM); next run awaits this first. */
  const teardownChainRef = useRef(Promise.resolve());
  const doneRef = useRef(false);
  const lastInvalidToastAt = useRef(0);
  const onValidCodeRef = useRef(onValidCode);
  onValidCodeRef.current = onValidCode;

  useEffect(() => {
    doneRef.current = false;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const qrbox =
      typeof window !== "undefined"
        ? Math.min(Math.max(window.innerWidth - 48, 200), 320)
        : 280;

    const config = { fps: 10, qrbox: { width: qrbox, height: qrbox } };

    const onDecoded = async (decodedText: string) => {
      if (doneRef.current) return;

      const code = parseJoinCodeFromScan(decodedText);
      if (code) {
        doneRef.current = true;
        try {
          if (scanner && scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          /* already stopped */
        }
        try {
          scanner?.clear();
        } catch {
          /* noop */
        }
        scannerRef.current = null;
        onValidCodeRef.current(code);
        return;
      }

      const now = Date.now();
      if (now - lastInvalidToastAt.current > 2500) {
        lastInvalidToastAt.current = now;
        toast.error("That isn’t a Tap In party QR code", {
          description: "Try scanning the code from the host’s screen.",
        });
      }
    };

    const onFrameError = () => {
      /* decode miss per frame — ignore */
    };

    const run = async () => {
      await teardownChainRef.current;

      if (cancelled) return;

      const container = document.getElementById(readerId);
      if (!container) return;
      container.innerHTML = "";

      scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      if (cancelled) {
        await teardownScanner(scanner, readerId);
        scanner = null;
        scannerRef.current = null;
        return;
      }

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onDecoded,
          onFrameError,
        );
      } catch {
        if (cancelled) {
          await teardownScanner(scanner, readerId);
          scanner = null;
          scannerRef.current = null;
          return;
        }
        try {
          await scanner.start(
            { facingMode: "user" },
            config,
            onDecoded,
            onFrameError,
          );
        } catch {
          if (cancelled) {
            await teardownScanner(scanner, readerId);
            scanner = null;
            scannerRef.current = null;
            return;
          }
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices.length === 0) {
              throw new Error("No camera found");
            }
            if (cancelled) {
              await teardownScanner(scanner, readerId);
              scanner = null;
              scannerRef.current = null;
              return;
            }
            await scanner.start(
              devices[0].id,
              config,
              onDecoded,
              onFrameError,
            );
          } catch (err) {
            if (!cancelled) {
              setStarting(false);
              setCameraError(
                err instanceof Error
                  ? err.message
                  : "Could not access the camera. Check permissions and try again.",
              );
            }
            await teardownScanner(scanner, readerId);
            scanner = null;
            scannerRef.current = null;
            return;
          }
        }
      }

      if (cancelled) {
        await teardownScanner(scanner, readerId);
        scanner = null;
        scannerRef.current = null;
        return;
      }

      setStarting(false);
      setCameraError(null);
    };

    const runPromise = run();

    return () => {
      cancelled = true;
      doneRef.current = true;
      teardownChainRef.current = (async () => {
        await runPromise.catch(() => {});
        await teardownScanner(scanner, readerId);
        scannerRef.current = null;
      })();
    };
  }, [readerId]);

  return (
    <div className="min-h-svh flex flex-col bg-white px-4 pt-8 pb-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" type="button" onClick={onBack}>
            Back
          </Button>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-violet-950">Scan party QR</h1>
          <p className="text-sm text-violet-700/90 mt-2 leading-relaxed">
            Allow camera access when prompted, then point at the QR code on the
            host&apos;s screen.
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
          {cameraError ? (
            <div className="text-center space-y-4 max-w-md">
              <p className="text-red-600 text-sm">{cameraError}</p>
              <Button variant="secondary" onClick={onBack}>
                Go back
              </Button>
            </div>
          ) : (
            <>
              <div
                id={readerId}
                className="join-qr-reader w-full max-w-[min(100%,320px)] overflow-hidden rounded-2xl bg-black/5 [&_video]:rounded-2xl [&_video~video]:hidden [&_canvas]:hidden!"
              />
              {starting && (
                <p className="text-sm text-violet-400 mt-4">Starting camera…</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinQrScanStep;
