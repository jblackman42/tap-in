"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  cardIdMatchesFace,
  dutchPileLayoutId,
  layoutIdFromCardId,
  type CardFace,
  type DutchPile,
  type SelectedCard,
} from "../types";
import { GameCard } from "./Card";

const spring = { type: "spring" as const, stiffness: 480, damping: 30 };

const incomingSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 30,
  mass: 0.4,
};

export type DutchRemoteIncoming = {
  nonce: number;
  fromX: number;
  fromY: number;
  prevTop: CardFace | null;
  prevDepth: number | null;
};

interface DutchPilesRowProps {
  piles: DutchPile[];
  dutchPlayBridge: { pileIndex: number; cardId: string } | null;
  dutchIncoming: Record<number, DutchRemoteIncoming>;
  selectedCard: SelectedCard | null;
  legalPileIndices: number[];
  canStartNew: boolean;
  accessibilityMode: boolean;
  onPlayToPile: (index: number) => void;
  onStartNewPile: () => void;
  onDutchBridgeLayoutComplete?: () => void;
  onRemoteIncomingComplete?: (pileIndex: number) => void;
}

export function DutchPilesRow({
  piles,
  dutchPlayBridge,
  dutchIncoming,
  selectedCard,
  legalPileIndices,
  canStartNew,
  accessibilityMode,
  onPlayToPile,
  onStartNewPile,
  onDutchBridgeLayoutComplete,
  onRemoteIncomingComplete,
}: DutchPilesRowProps) {
  const hasSelection = selectedCard !== null;
  const legalSet = new Set(legalPileIndices);

  const items = piles.map((pile, i) => {
    const isLegal = legalSet.has(i);
    let cardState: "default" | "highlighted-dutch" | "dimmed" = "default";
    if (hasSelection) {
      cardState = isLegal ? "highlighted-dutch" : "dimmed";
    }

    const bridgeActive =
      dutchPlayBridge !== null &&
      dutchPlayBridge.pileIndex === i &&
      cardIdMatchesFace(dutchPlayBridge.cardId, pile.topCard);

    const layoutId =
      bridgeActive && dutchPlayBridge
        ? layoutIdFromCardId(dutchPlayBridge.cardId)
        : dutchPileLayoutId(i, pile.topCard);

    const incoming = dutchIncoming[i];

    let inner: ReactNode;

    if (incoming && !bridgeActive) {
      const { prevTop, prevDepth, fromX, fromY, nonce } = incoming;
      const hasBase = prevTop !== null;

      inner = (
        <div className="relative h-20 w-14 shrink-0">
          {hasBase && (
            <div className="absolute inset-0 z-0">
              <GameCard
                suit={prevTop.suit}
                number={prevTop.number}
                size="md"
                state="default"
                accessibilityMode={accessibilityMode}
                depthBadge={
                  prevDepth !== null && prevDepth > 1 ? prevDepth : undefined
                }
                interactive={false}
              />
            </div>
          )}
          <motion.div
            key={`dutch-in-${i}-${nonce}`}
            layout={false}
            initial={{ x: fromX, y: fromY, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={incomingSpring}
            onAnimationComplete={() => onRemoteIncomingComplete?.(i)}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <GameCard
              suit={pile.topCard.suit}
              number={pile.topCard.number}
              size="md"
              state={cardState}
              accessibilityMode={accessibilityMode}
              depthBadge={pile.depth > 1 ? pile.depth : undefined}
              onClick={
                hasSelection && isLegal ? () => onPlayToPile(i) : undefined
              }
            />
          </motion.div>
        </div>
      );
    } else {
      inner = (
        <GameCard
          layoutId={layoutId}
          suit={pile.topCard.suit}
          number={pile.topCard.number}
          size="md"
          state={cardState}
          accessibilityMode={accessibilityMode}
          depthBadge={pile.depth}
          onClick={hasSelection && isLegal ? () => onPlayToPile(i) : undefined}
          onLayoutAnimationComplete={
            bridgeActive ? onDutchBridgeLayoutComplete : undefined
          }
        />
      );
    }

    return (
      <motion.div
        key={`dutch-pile-slot-${i}`}
        layout={false}
        initial={false}
        transition={spring}
      >
        {inner}
      </motion.div>
    );
  });

  if (hasSelection && canStartNew) {
    items.push(
      <motion.div
        key="new-pile"
        layout
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
      >
        <motion.button
          type="button"
          onClick={onStartNewPile}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="w-14 h-20 rounded-lg border-2 border-dashed border-tertiary-container bg-tertiary/20 flex items-center justify-center text-tertiary-container text-2xl font-bold cursor-pointer"
        >
          +
        </motion.button>
      </motion.div>,
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-white/30 text-xs font-label uppercase tracking-widest">
        No center piles yet — play a 1 to start one!
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 px-2 py-2">
      {items}
    </div>
  );
}
