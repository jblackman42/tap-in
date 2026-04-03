"use client";

import { motion } from "framer-motion";
import {
  WOOD_PILE_PERSPECTIVE_PX,
  woodFlipAnimate,
  woodFlipInitial,
  woodFlipTransition,
} from "../animations";
import { cardLayoutId, type Card, type PlayerColor, type SelectedCard } from "../types";
import { GameCard, CardStack } from "./Card";

const spring = { type: "spring" as const, stiffness: 480, damping: 30 };

interface WoodPileAndHandProps {
  woodPile: Card[];
  hand: Card[];
  playerColor: PlayerColor;
  selectedCard: SelectedCard | null;
  accessibilityMode: boolean;
  onSelectWood: () => void;
  onFlipHand: () => void;
  onPickUpWood: () => void;
}

export function WoodPileAndHand({
  woodPile,
  hand,
  playerColor,
  selectedCard,
  accessibilityMode,
  onSelectWood,
  onFlipHand,
  onPickUpWood,
}: WoodPileAndHandProps) {
  const topWood = woodPile[woodPile.length - 1];
  const isWoodSelected = selectedCard?.source === "wood";
  const handEmpty = hand.length === 0;
  const woodEmpty = woodPile.length === 0;

  return (
    <div className="flex items-center justify-center gap-4 bg-[#2a2929] rounded-2xl border border-white/10 py-3 px-4">
      <div
        className="flex flex-col items-center gap-1"
        style={{ perspective: WOOD_PILE_PERSPECTIVE_PX }}
      >
        {topWood ? (
          <motion.div
            key={topWood.id}
            initial={woodFlipInitial}
            animate={woodFlipAnimate}
            transition={woodFlipTransition}
            className="relative transform-3d"
          >
            <GameCard
              layoutId={cardLayoutId(topWood)}
              suit={topWood.suit}
              number={topWood.number}
              size="md"
              state={isWoodSelected ? "selected" : "default"}
              accessibilityMode={accessibilityMode}
              onClick={onSelectWood}
            />
          </motion.div>
        ) : (
          <div className="w-14 h-20 rounded-lg border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/20 text-xs">
            {handEmpty ? "—" : ""}
          </div>
        )}
        <span className="text-[10px] text-white/40 font-label font-bold uppercase tracking-widest">Wood</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        {handEmpty ? (
          <motion.button
            type="button"
            onClick={woodEmpty ? undefined : onPickUpWood}
            disabled={woodEmpty}
            whileTap={!woodEmpty ? { scale: 0.94 } : undefined}
            transition={spring}
            className={`
              w-14 h-20 rounded-lg border-2 border-dashed flex items-center justify-center
              ${
                woodEmpty
                  ? "border-white/10 bg-white/5 text-white/20 cursor-default"
                  : "border-secondary text-secondary cursor-pointer hover:bg-secondary/20 active:bg-secondary/30"
              }
            `}
          >
            {!woodEmpty && <span className="text-lg">↩</span>}
          </motion.button>
        ) : (
          <motion.div
            className="relative cursor-pointer"
            onClick={onFlipHand}
            whileTap={{ scale: 0.98 }}
          >
            <CardStack count={hand.length} playerColor={playerColor} size="md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GameCard
                faceDown
                playerColor={playerColor}
                size="md"
                onClick={onFlipHand}
              />
            </div>
          </motion.div>
        )}
        <span className="text-[10px] text-white/40 font-label font-bold uppercase tracking-widest">
          {handEmpty ? (woodEmpty ? "" : "Pick up") : `Hand (${hand.length})`}
        </span>
      </div>
    </div>
  );
}
