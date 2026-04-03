import { Space_Grotesk, Plus_Jakarta_Sans, Spline_Sans } from "next/font/google";

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["700"],
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const splineSans = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-label",
  weight: ["400", "500", "600", "700"],
});
