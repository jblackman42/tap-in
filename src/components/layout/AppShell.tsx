"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppMenu } from "./AppMenu";
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Memphis dot pattern background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] memphis-dots z-0" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] memphis-squiggles z-0" />
      {children}
      <Toaster
        position="top-center"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "bg-surface-lowest! text-foreground! border-2! border-foreground/10! shadow-[4px_4px_0px_0px_rgba(28,27,27,0.1)]! font-body!",
            title: "text-foreground! font-headline! font-bold! uppercase! text-sm!",
            description: "text-outline! font-body!",
            closeButton:
              "text-foreground! hover:bg-surface-high! active:bg-surface-highest!",
          },
        }}
      />
      <AppMenu />
      <Analytics />
    </>
  );
}
