import { outfitWordmark } from "@/lib/fonts";

interface TapInWordmarkProps {
  className?: string;
  size?: "default" | "large";
}

export function TapInWordmark({ className = "", size = "large" }: TapInWordmarkProps) {
  const textSize =
    size === "large"
      ? "text-6xl sm:text-7xl md:text-8xl"
      : "text-4xl sm:text-5xl";

  return (
    <h1
      className={`${outfitWordmark.className} ${textSize} leading-[0.95] tracking-tight ${className}`}
    >
      <span className="font-bold text-violet-950">Tap</span>
      <span className="font-extralight text-violet-600"> In</span>
    </h1>
  );
}
