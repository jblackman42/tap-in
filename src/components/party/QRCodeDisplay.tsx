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
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-violet-600 tracking-wider uppercase">
        Tap In
      </p>
      {joinUrl != null && joinUrl !== "" ? (
        <QRCodeSVG
          value={joinUrl}
          size={200}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          level="M"
          className="rounded-lg"
        />
      ) : (
        <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg animate-pulse" />
      )}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Party Code</p>
        <p className="text-3xl font-bold tracking-[0.3em] text-gray-900">
          {code}
        </p>
      </div>
      <p className="text-xs text-gray-400">
        Scan the QR code or enter the code to join
      </p>
    </div>
  );
}
