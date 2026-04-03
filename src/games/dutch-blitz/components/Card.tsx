"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { Suit, PlayerColor } from "../types";

const SUIT_BG: Record<Suit, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
};

const SUIT_RING: Record<Suit, string> = {
  red: "ring-red-400",
  blue: "ring-blue-400",
  yellow: "ring-yellow-300",
  green: "ring-green-400",
};

const SUIT_TEXT: Record<Suit, string> = {
  red: "text-white",
  blue: "text-white",
  yellow: "text-gray-900",
  green: "text-white",
};

const PLAYER_COLOR_BG: Record<PlayerColor, string> = {
  pump: "bg-orange-700",
  carriage: "bg-purple-700",
  pail: "bg-cyan-700",
  plow: "bg-amber-800",
};

const SUIT_LABEL: Record<Suit, string> = {
  red: "R",
  blue: "B",
  yellow: "Y",
  green: "G",
};

type CardState = "default" | "selected" | "highlighted-dutch" | "highlighted-post" | "dimmed";

interface CardProps {
  suit?: Suit;
  number?: number;
  playerColor?: PlayerColor;
  faceDown?: boolean;
  state?: CardState;
  size?: "sm" | "md" | "lg";
  accessibilityMode?: boolean;
  depthBadge?: number;
  onClick?: () => void;
  className?: string;
  /** When false, card is visual-only (stacked under another card) */
  interactive?: boolean;
  /** Shared layout id for slide-to-destination between piles (same physical card) */
  layoutId?: string;
  /** Fires when Framer layout animation completes (shared `layoutId` transitions) */
  onLayoutAnimationComplete?: () => void;
}

const SIZE_CLASSES = {
  sm: "w-10 h-14 text-sm rounded-md",
  md: "w-14 h-20 text-xl rounded-lg",
  lg: "w-16 h-22 text-2xl rounded-xl",
};

function AccessibilityPattern({ suit, patternUrlId }: { suit: Suit; patternUrlId: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[inherit]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {suit === "red" && (
          <pattern id={patternUrlId} width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="6" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </pattern>
        )}
        {suit === "blue" && (
          <pattern id={patternUrlId} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.2" fill="rgba(255,255,255,0.4)" />
          </pattern>
        )}
        {suit === "yellow" && (
          <pattern id={patternUrlId} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M4 0L8 4L4 8L0 4Z" fill="rgba(0,0,0,0.15)" />
          </pattern>
        )}
        {suit === "green" && (
          <pattern id={patternUrlId} width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="6" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="6" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternUrlId})`} />
    </svg>
  );
}

const cardSpring = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.35 };

const layoutSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.45,
};

export function GameCard({
  suit,
  number,
  playerColor,
  faceDown = false,
  state = "default",
  size = "md",
  accessibilityMode = false,
  depthBadge,
  onClick,
  className = "",
  interactive = true,
  layoutId,
  onLayoutAnimationComplete,
}: CardProps) {
  const uid = useId().replace(/:/g, "");
  const patternUrlId = `pat-${uid}`;

  if (faceDown) {
    return (
      <motion.button
        type="button"
        layoutId={layoutId}
        onLayoutAnimationComplete={onLayoutAnimationComplete}
        onClick={onClick}
        disabled={!onClick}
        initial={false}
        whileTap={onClick ? { scale: 0.96 } : undefined}
        transition={layoutId ? { ...cardSpring, layout: layoutSpring } : cardSpring}
        className={`
          relative flex items-center justify-center
          ${playerColor ? PLAYER_COLOR_BG[playerColor] : "bg-gray-600"}
          ${SIZE_CLASSES[size]}
          shadow-md border-2 border-white/20
          ${onClick ? "cursor-pointer" : "cursor-default"}
          ${className}
        `}
      >
        <div className="w-3/4 h-3/4 rounded border border-white/30" />
      </motion.button>
    );
  }

  if (!suit || number === undefined) return null;

  const stateClasses = {
    default: "",
    /** Avoid transform on the layoutId node — breaks shared layout on mobile WebKit */
    selected: `ring-2 ${SUIT_RING[suit]} shadow-lg`,
    "highlighted-dutch": "ring-2 ring-green-400 shadow-green-400/30 shadow-md",
    "highlighted-post": "ring-2 ring-blue-400 shadow-blue-400/30 shadow-md",
    dimmed: "opacity-40",
  };

  const isInteractive = interactive && !!onClick;
  const liftSelected = state === "selected";

  return (
    <div
      className={liftSelected ? "relative z-10 -top-1.5" : "relative"}
    >
    <motion.button
      type="button"
      layoutId={layoutId}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
      onClick={onClick}
      disabled={!isInteractive}
      initial={layoutId ? false : { opacity: 0.94, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={layoutId ? { ...cardSpring, layout: layoutSpring } : cardSpring}
      whileTap={isInteractive ? { scale: 0.97 } : undefined}
      style={
        layoutId
          ? {
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }
          : undefined
      }
      className={`
        relative flex items-center justify-center
        ${SUIT_BG[suit]}
        ${SIZE_CLASSES[size]}
        shadow-md border border-white/30
        ${isInteractive ? "cursor-pointer" : "cursor-default pointer-events-none"}
        ${stateClasses[state]}
        ${className}
      `}
    >
      {accessibilityMode && <AccessibilityPattern suit={suit} patternUrlId={patternUrlId} />}

      <span
        className={`
          font-bold leading-none relative z-10
          ${SUIT_TEXT[suit]}
          ${accessibilityMode ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : ""}
        `}
      >
        {number}
      </span>

      <span
        className={`
          absolute top-0.5 left-1 text-[8px] font-bold opacity-70 z-10
          ${SUIT_TEXT[suit]}
        `}
      >
        {SUIT_LABEL[suit]}
      </span>

      {depthBadge !== undefined && depthBadge > 1 && (
        <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20">
          {depthBadge}
        </span>
      )}
    </motion.button>
    </div>
  );
}

interface CardStackProps {
  count: number;
  playerColor?: PlayerColor;
  size?: "sm" | "md";
  className?: string;
}

export function CardStack({ count, playerColor, size = "md", className = "" }: CardStackProps) {
  if (count === 0) return null;
  const layers = Math.min(count, 3);
  const dims = size === "sm" ? "w-10 h-14" : "w-14 h-20";

  return (
    <div className={`relative ${dims} ${className}`}>
      {Array.from({ length: layers }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={cardSpring}
          className={`
            absolute rounded-lg border border-white/20 shadow-sm
            ${playerColor ? PLAYER_COLOR_BG[playerColor] : "bg-gray-500"}
            ${dims}
          `}
          style={{
            top: `${(layers - 1 - i) * 2}px`,
            left: `${(layers - 1 - i) * 1}px`,
          }}
        />
      ))}
    </div>
  );
}
