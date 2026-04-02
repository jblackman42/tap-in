import { Outfit } from "next/font/google";

export const outfitWordmark = Outfit({
  subsets: ["latin"],
  variable: "--font-wordmark",
  weight: ["200", "600", "700", "800"],
});
