"use client";

import { LayoutGroup, motion } from "framer-motion";
import type { Player } from "@/lib/party/types";
import type {
  DutchPile,
  LocalGameState,
  PlayerColor,
} from "../types";
import { ScoreStrip } from "./ScoreStrip";
import { OpponentStrip } from "./OpponentStrip";
import { DutchPilesRow, type DutchRemoteIncoming } from "./DutchPilesRow";
import { PostPiles } from "./PostPiles";
import { BlitzPile } from "./BlitzPile";
import { WoodPileAndHand } from "./WoodPileAndHand";

interface GameBoardProps {
  players: Player[];
  playerId: string;
  scores: Record<string, number>;
  blitzCounts: Record<string, number>;
  dutchPiles: DutchPile[];
  dutchPlayBridge: { pileIndex: number; cardId: string } | null;
  dutchIncoming: Record<number, DutchRemoteIncoming>;
  local: LocalGameState;
  playerColor: PlayerColor;
  accessibilityMode: boolean;
  leftHanded: boolean;
  legalDutchIndices: number[];
  canStartNewDutch: boolean;
  legalPostIndices: number[];
  onSelectBlitz: () => void;
  onSelectPost: (pileIndex: number) => void;
  onSelectWood: () => void;
  onPlayToDutch: (pileIndex: number) => void;
  onStartNewDutch: () => void;
  onPlayToPost: (pileIndex: number) => void;
  onFlipHand: () => void;
  onPickUpWood: () => void;
  onDeselect: () => void;
  onDutchBridgeLayoutComplete?: () => void;
  onRemoteIncomingComplete?: (pileIndex: number) => void;
}

export function GameBoard({
  players,
  playerId,
  scores,
  blitzCounts,
  dutchPiles,
  dutchPlayBridge,
  dutchIncoming,
  local,
  playerColor,
  accessibilityMode,
  leftHanded,
  legalDutchIndices,
  canStartNewDutch,
  legalPostIndices,
  onSelectBlitz,
  onSelectPost,
  onSelectWood,
  onPlayToDutch,
  onStartNewDutch,
  onPlayToPost,
  onFlipHand,
  onPickUpWood,
  onDeselect,
  onDutchBridgeLayoutComplete,
  onRemoteIncomingComplete,
}: GameBoardProps) {
  return (
    <LayoutGroup id="blitzkrieg-board">
    <motion.div
      layoutRoot
      className="flex flex-col h-full min-h-0 bg-[#1c1b1b] select-none relative"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDeselect();
      }}
    >
      {/* Faint Memphis dot pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] memphis-dots" />

      {/* Score strip */}
      <div className="shrink-0 px-2 pt-2 relative z-10">
        <ScoreStrip
          players={players}
          scores={scores}
          currentPlayerId={playerId}
        />
      </div>

      {/* Opponent Blitz strip */}
      <div className="shrink-0 py-1.5 relative z-10">
        <OpponentStrip
          players={players}
          blitzCounts={blitzCounts}
          currentPlayerId={playerId}
        />
      </div>

      {/* Center piles — striped background */}
      <div className="shrink-0 border-y-2 border-tertiary-container/30 bg-[#2a2929] relative z-10">
        <DutchPilesRow
          piles={dutchPiles}
          dutchPlayBridge={dutchPlayBridge}
          dutchIncoming={dutchIncoming}
          selectedCard={local.selectedCard}
          legalPileIndices={legalDutchIndices}
          canStartNew={canStartNewDutch}
          accessibilityMode={accessibilityMode}
          onPlayToPile={onPlayToDutch}
          onStartNewPile={onStartNewDutch}
          onDutchBridgeLayoutComplete={onDutchBridgeLayoutComplete}
          onRemoteIncomingComplete={onRemoteIncomingComplete}
        />
      </div>

      {/* Player zone */}
      <div className="flex-1 flex flex-col justify-end gap-3 px-3 pb-3 pt-2 relative z-10">
        <div
          className={`flex items-end justify-between gap-2 ${
            leftHanded ? "flex-row-reverse" : ""
          }`}
        >
          <PostPiles
            piles={local.postPiles}
            selectedCard={local.selectedCard}
            legalPostIndices={legalPostIndices}
            accessibilityMode={accessibilityMode}
            onSelectPost={onSelectPost}
            onPlayToPost={onPlayToPost}
          />
          <BlitzPile
            pile={local.blitzPile}
            selectedCard={local.selectedCard}
            accessibilityMode={accessibilityMode}
            onSelect={onSelectBlitz}
          />
        </div>

        <WoodPileAndHand
          woodPile={local.woodPile}
          hand={local.hand}
          playerColor={playerColor}
          selectedCard={local.selectedCard}
          accessibilityMode={accessibilityMode}
          onSelectWood={onSelectWood}
          onFlipHand={onFlipHand}
          onPickUpWood={onPickUpWood}
        />
      </div>
    </motion.div>
    </LayoutGroup>
  );
}
