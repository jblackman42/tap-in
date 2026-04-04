interface TapInWordmarkProps {
  className?: string;
  /** `compact` — app header; `default` — secondary hero; `large` — home hero */
  size?: "compact" | "default" | "large";
  /** Use `div` or `span` in nav/header when the page already has an `h1`. */
  as?: "h1" | "div" | "span";
}

export function TapInWordmark({
  className = "",
  size = "large",
  as: Comp = "h1",
}: TapInWordmarkProps) {
  const textSize =
    size === "large"
      ? "text-5xl sm:text-6xl md:text-7xl"
      : size === "compact"
        ? "text-xl sm:text-2xl md:text-3xl"
        : "text-3xl sm:text-4xl";

  return (
    <Comp
      className={`font-headline font-bold italic uppercase tracking-tighter ${textSize} leading-[0.95] text-primary drop-shadow-[4px_4px_0px_#006970] ${className}`}
    >
      Tap In
    </Comp>
  );
}
