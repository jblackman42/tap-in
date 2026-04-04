import type { Metadata, Viewport } from "next";
import { spaceGrotesk, plusJakartaSans, splineSans } from "@/lib/fonts";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tap In",
  description: "Start a party, pick a game, and play together in the same room.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fcf9f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${splineSans.variable} h-full min-h-svh antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-svh flex-col font-body">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
