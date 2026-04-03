"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppMenu } from "./AppMenu";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "bg-white! text-violet-950! border-violet-200! shadow-lg!",
            title: "text-violet-950!",
            description: "text-violet-700!",
            closeButton:
              "text-violet-600! hover:bg-violet-100! active:bg-violet-200/60!",
          },
        }}
      />
      <AppMenu />
    </>
  );
}
