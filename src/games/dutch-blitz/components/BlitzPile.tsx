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
  if (count <= 1) return "bg-red-500 animate-pulse";
  if (count === 2) return "bg-red-500";
  if (count === 3) return "bg-amber-500";
  return "bg-gray-600";
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
          className="w-14 h-20 rounded-lg border-2 border-dashed border-green-400 bg-green-50 flex items-center justify-center text-green-500 text-xs font-bold"
        >
          BLITZ!
        </motion.div>
        <span className="text-[10px] text-gray-400 font-medium">Blitz</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="relative">
        {count > 1 && (
          <>
            <div className="absolute top-1 left-0.5 z-0 w-14 h-20 rounded-lg bg-gray-300 opacity-40" />
            {count > 2 && (
              <div className="absolute top-2 left-1 z-0 w-14 h-20 rounded-lg bg-gray-300 opacity-20" />
            )}
          </>
        )}

        <div className="relative z-10 isolate">
          <GameCard
            layoutId={topCard ? cardLayoutId(topCard) : undefined}
            suit={topCard?.suit}
            number={topCard?.number}
            size="md"
            state={isSelected ? "selected" : "default"}
            accessibilityMode={accessibilityMode}
            onClick={onSelect}
          />
        </div>

        <div
          className={`
            absolute -top-2 -right-2 min-w-5 h-5 px-1
            rounded-full flex items-center justify-center
            text-[10px] font-bold text-white z-20
            ${getBadgeColor(count)}
          `}
        >
          {count}
        </div>
      </div>
      <span className="text-[10px] text-gray-400 font-medium">Blitz</span>
    </div>
  );
}
