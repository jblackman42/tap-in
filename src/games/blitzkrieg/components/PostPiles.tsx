"use client";

import { cardLayoutId, type Card, type SelectedCard } from "../types";
import { GameCard } from "./Card";

const STACK_STEP_PX = 12;
const SM_CARD_H_PX = 56;

interface PostPilesProps {
  piles: Card[][];
  selectedCard: SelectedCard | null;
  legalPostIndices: number[];
  accessibilityMode: boolean;
  onSelectPost: (pileIndex: number) => void;
  onPlayToPost: (pileIndex: number) => void;
}

export function PostPiles({
  piles,
  selectedCard,
  legalPostIndices,
  accessibilityMode,
  onSelectPost,
  onPlayToPost,
}: PostPilesProps) {
  const hasSelection = selectedCard !== null;
  const legalSet = new Set(legalPostIndices);

  return (
    <div className="flex items-end gap-2 justify-center">
      {piles.map((pile, i) => {
        if (!pile.length) {
          return (
            <div
              key={`post-${i}`}
              className="w-10 h-14 rounded-lg border border-dashed border-white/20 bg-white/5 shrink-0"
            />
          );
        }

        const isSelectedSource =
          selectedCard?.source === "post" && selectedCard?.pileIndex === i;

        const isLegalTarget = hasSelection && legalSet.has(i);

        let cardState: "default" | "selected" | "highlighted-post" | "dimmed" = "default";
        if (isSelectedSource) {
          cardState = "selected";
        } else if (hasSelection) {
          cardState = isLegalTarget ? "highlighted-post" : "dimmed";
        }

        const handleClick = () => {
          if (isSelectedSource) {
            onSelectPost(i);
          } else if (hasSelection && isLegalTarget) {
            onPlayToPost(i);
          } else if (!hasSelection) {
            onSelectPost(i);
          }
        };

        const stackHeightPx =
          (pile.length - 1) * STACK_STEP_PX + SM_CARD_H_PX;

        return (
          <div
            key={`post-${i}`}
            className="relative isolate shrink-0 w-10"
            style={{ minHeight: stackHeightPx }}
          >
            {pile.map((c, idx) => {
              const isTop = idx === pile.length - 1;
              const fromBottom = idx;
              return (
                <div
                  key={c.id}
                  className="absolute left-0 right-0 flex w-full justify-center pointer-events-none"
                  style={{
                    bottom: fromBottom * STACK_STEP_PX,
                    zIndex: idx + 1,
                  }}
                >
                  <div
                    className={`w-10 shrink-0 ${isTop ? "pointer-events-auto" : "pointer-events-none"}`}
                  >
                  <GameCard
                    layoutId={isTop ? cardLayoutId(c) : undefined}
                    suit={c.suit}
                    number={c.number}
                    size="sm"
                    state={isTop ? cardState : "default"}
                    accessibilityMode={accessibilityMode}
                    depthBadge={isTop && pile.length > 1 ? pile.length : undefined}
                    interactive={isTop}
                    onClick={isTop ? handleClick : undefined}
                  />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
