"use client";

import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  code: string;
}

export function QRCodeDisplay({ code }: QRCodeDisplayProps) {
  const joinUrl = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/join/${code}`,
    () => null as string | null,
  );

  return (
    <div className="flex flex-col items-center gap-6 rounded-[40px] bg-surface border-8 border-foreground p-8 shadow-[12px_12px_0px_0px_#006970] relative overflow-hidden">
      <span className="absolute top-4 right-6 font-headline font-bold text-xs text-primary/30 uppercase tracking-[0.2em] select-none">
        Tap In
      </span>
      {joinUrl != null && joinUrl !== "" ? (
        <div className="bg-surface-lowest p-4 rounded-[2rem] w-full max-w-[200px] aspect-square flex items-center justify-center">
          <QRCodeSVG
            value={joinUrl}
            size={168}
            bgColor="#ffffff"
            fgColor="#1c1b1b"
            level="M"
            className="rounded-lg"
          />
        </div>
      ) : (
        <div className="w-[200px] h-[200px] bg-surface-highest rounded-[2rem] animate-pulse" />
      )}
      <div className="text-center space-y-2">
        <p className="font-label font-bold text-primary uppercase tracking-widest text-xs">
          Party Code
        </p>
        <h2 className="font-headline font-bold text-5xl tracking-[0.2em] text-foreground">
          {code}
        </h2>
        <p className="font-body text-sm font-medium text-outline max-w-[200px] mx-auto leading-relaxed mt-2">
          Scan the QR code or enter the code to join
        </p>
      </div>
    </div>
  );
}
