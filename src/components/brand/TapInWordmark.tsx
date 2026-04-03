interface TapInWordmarkProps {
  className?: string;
  size?: "default" | "large";
}

export function TapInWordmark({ className = "", size = "large" }: TapInWordmarkProps) {
  const textSize =
    size === "large"
      ? "text-5xl sm:text-6xl md:text-7xl"
      : "text-3xl sm:text-4xl";

  return (
    <h1
      className={`font-headline font-bold italic uppercase tracking-tighter ${textSize} leading-[0.95] text-primary drop-shadow-[4px_4px_0px_#006970] ${className}`}
    >
      Tap In
    </h1>
  );
}
