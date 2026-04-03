"use client";

import { motion } from "framer-motion";
import { cardLayoutId, type Card, type SelectedCard } from "../types";
import { GameCard } from "./Card";

interface BlitzPileProps {
  pile: Card[];
  selectedCard: SelectedCard | null;
  accessibilityMode: boolean;
  onSelect: () => void;
}

function getBadgeColor(count: number): string {
  if (count <= 1) return "bg-primary animate-pulse shadow-[0_0_12px_rgba(187,0,88,0.6)]";
  if (count === 2) return "bg-primary shadow-[0_0_8px_rgba(187,0,88,0.4)]";
  if (count === 3) return "bg-tertiary";
  return "bg-[#555] shadow-[0_0_6px_rgba(85,85,85,0.4)]";
}

export function BlitzPile({
  pile,
  selectedCard,
  accessibilityMode,
  onSelect,
}: BlitzPileProps) {
  const topCard = pile[pile.length - 1];
  const count = pile.length;
  const isSelected = selectedCard?.source === "blitz";

  if (count === 0) {
    return (
      <div className="relative flex flex-col items-center gap-1">
        <motion.div
          initial={{ opacity: 0.8, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-28 rounded-2xl border-4 border-dashed border-tertiary-container bg-tertiary/20 flex items-center justify-center shadow-[6px_6px_0px_0px_#506600]"
        >
          <span className="font-headline font-bold text-tertiary-container text-xl uppercase tracking-tighter">
            BLITZ!
          </span>
        </motion.div>
        <span className="text-[10px] text-white/40 font-label font-bold uppercase tracking-widest">Blitz</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="relative">
        {count > 1 && (
          <>
            <div className="absolute top-1 left-0.5 z-0 w-20 h-28 rounded-2xl bg-white/10" />
            {count > 2 && (
              <div className="absolute top-2 left-1 z-0 w-20 h-28 rounded-2xl bg-white/5" />
            )}
          </>
        )}

        <div className="relative z-10 isolate">
          <GameCard
            layoutId={topCard ? cardLayoutId(topCard) : undefined}
            suit={topCard?.suit}
            number={topCard?.number}
            size="lg"
            state={isSelected ? "selected" : "default"}
            accessibilityMode={accessibilityMode}
            onClick={onSelect}
          />
        </div>

        <div
          className={`
            absolute -top-2 -right-2 min-w-6 h-6 px-1.5
            rounded-full flex items-center justify-center
            text-xs font-headline font-bold text-white z-20
            border-2 border-foreground
            ${getBadgeColor(count)}
          `}
        >
          {count}
        </div>
      </div>
      <span className="text-[10px] text-white/40 font-label font-bold uppercase tracking-widest">Blitz</span>
    </div>
  );
}
