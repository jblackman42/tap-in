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
    <div className="flex items-center justify-center gap-4">
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
          <div className="w-14 h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 flex items-center justify-center text-gray-300 text-xs">
            {handEmpty ? "—" : ""}
          </div>
        )}
        <span className="text-[10px] text-gray-400 font-medium">Wood</span>
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
                  ? "border-gray-200 bg-gray-50/30 text-gray-300 cursor-default"
                  : "border-violet-300 bg-violet-50 text-violet-500 cursor-pointer hover:bg-violet-100 active:bg-violet-200"
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
        <span className="text-[10px] text-gray-400 font-medium">
          {handEmpty ? (woodEmpty ? "" : "Pick up") : `Hand (${hand.length})`}
        </span>
      </div>
    </div>
  );
}
