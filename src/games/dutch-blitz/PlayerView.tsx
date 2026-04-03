"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerViewProps } from "@/lib/engine/types";
import {
  cardIdMatchesFace,
  type CardFace,
  type DutchBlitzPlayerView,
  type DutchBlitzAction,
  type DutchBlitzPlayerData,
  type DutchPile,
} from "./types";
import { useLocalGameState } from "./hooks/useLocalGameState";
import type { DutchRemoteIncoming } from "./components/DutchPilesRow";
import { GameBoard } from "./components/GameBoard";
import { BeginRound } from "./components/BeginRound";
import { RoundSummary } from "./components/RoundSummary";
import { FinalScoreScreen } from "./components/FinalScoreScreen";

export function DutchBlitzPlayerViewComponent({
  state,
  playerId,
  players,
  dispatch,
}: PlayerViewProps<DutchBlitzPlayerView, DutchBlitzAction>) {
  const router = useRouter();

  const playerData = useMemo(() => {
    const p = players.find((pl) => pl.id === playerId);
    const raw = (p?.data ?? {}) as Record<string, unknown>;
    return {
      handedness: (raw.handedness as "left" | "right") ?? "right",
    } satisfies DutchBlitzPlayerData;
  }, [players, playerId]);

  const playerColor = state.playerColors[playerId] ?? "pump";
  const dealSeed = state.dealSeeds[playerId] ?? null;
  const postCount = state.playerCount === 2 ? 5 : 3;

  const {
    local,
    selectCard,
    deselectCard,
    flipHand,
    pickUpWoodPile,
    playToPost,
    playToDutch,
    getLegalDutchTargets,
    getLegalPostTargets,
  } = useLocalGameState({
    playerColor,
    dealSeed,
    postCount,
    phase: state.phase,
    round: state.round,
    dutchPiles: state.dutchPiles,
    lastRejection: state.lastRejection ?? null,
    dispatch,
  });

  const dutchTargets = useMemo(
    () => getLegalDutchTargets(local.selectedCard),
    [getLegalDutchTargets, local.selectedCard],
  );

  const postTargets = useMemo(
    () => getLegalPostTargets(local.selectedCard),
    [getLegalPostTargets, local.selectedCard],
  );

  /** Short-lived Framer layout bridge so the actor's card keeps `layoutId` when it lands on Dutch. */
  const [dutchPlayBridge, setDutchPlayBridge] = useState<{
    pileIndex: number;
    cardId: string;
  } | null>(null);
  /** Remote plays: new top flies in; base shows previous top until animation ends. */
  const [dutchIncoming, setDutchIncoming] = useState<
    Record<number, DutchRemoteIncoming>
  >({});

  const prevDutchPilesRef = useRef<DutchPile[]>(state.dutchPiles);
  const dutchPilesInitRef = useRef(true);
  const dutchPlayBridgeRef = useRef(dutchPlayBridge);
  // eslint-disable-next-line react-hooks/refs -- keep latest bridge flag for effect timing
  dutchPlayBridgeRef.current = dutchPlayBridge;
  const bridgeMaxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** iOS WebKit often fires `onLayoutAnimationComplete` immediately; ignore if too soon after bridge start. */
  const dutchBridgeSetAtRef = useRef(0);

  useEffect(() => {
    dutchPilesInitRef.current = true;
    prevDutchPilesRef.current = state.dutchPiles;
  }, [state.round]);

  useEffect(() => {
    if (state.phase !== "playing") {
      prevDutchPilesRef.current = state.dutchPiles;
      dutchPilesInitRef.current = true;
      return;
    }

    const prev = prevDutchPilesRef.current;
    const next = state.dutchPiles;

    if (dutchPilesInitRef.current) {
      dutchPilesInitRef.current = false;
      prevDutchPilesRef.current = next;
      return;
    }

    if (next.length < prev.length) {
      prevDutchPilesRef.current = next;
      return;
    }

    const changes: { index: number; top: CardFace }[] = [];

    if (next.length > prev.length) {
      for (let i = prev.length; i < next.length; i++) {
        const pile = next[i];
        if (pile) changes.push({ index: i, top: pile.topCard });
      }
    }

    for (let i = 0; i < Math.min(prev.length, next.length); i++) {
      const pt = prev[i].topCard;
      const nt = next[i].topCard;
      if (pt.suit !== nt.suit || pt.number !== nt.number) {
        changes.push({ index: i, top: nt });
      }
    }

    for (const ch of changes) {
      const b = dutchPlayBridgeRef.current;
      if (
        b &&
        b.pileIndex === ch.index &&
        cardIdMatchesFace(b.cardId, ch.top)
      ) {
        continue;
      }
      const prevPile = prev[ch.index];
      const prevTop = prevPile?.topCard ?? null;
      const prevDepth = prevPile?.depth ?? null;
      const fromX = (Math.random() - 0.5) * 200;
      const fromY = (Math.random() - 0.5) * 200;
      setDutchIncoming((m) => ({
        ...m,
        [ch.index]: {
          nonce: Date.now() + Math.random(),
          fromX,
          fromY,
          prevTop,
          prevDepth,
        },
      }));
    }

    prevDutchPilesRef.current = next;
  }, [state.dutchPiles, state.phase]);

  const clearDutchBridgeTimeout = useCallback(() => {
    if (bridgeMaxTimeoutRef.current) {
      clearTimeout(bridgeMaxTimeoutRef.current);
      bridgeMaxTimeoutRef.current = null;
    }
  }, []);

  const handleDutchBridgeLayoutComplete = useCallback(() => {
    if (Date.now() - dutchBridgeSetAtRef.current < 120) {
      return;
    }
    clearDutchBridgeTimeout();
    setDutchPlayBridge(null);
  }, [clearDutchBridgeTimeout]);

  const handleRemoteIncomingComplete = useCallback((pileIndex: number) => {
    setDutchIncoming((m) => {
      if (!(pileIndex in m)) return m;
      const next = { ...m };
      delete next[pileIndex];
      return next;
    });
  }, []);

  const handleSelectBlitz = useCallback(() => {
    selectCard("blitz");
  }, [selectCard]);

  const handleSelectPost = useCallback(
    (pileIndex: number) => {
      selectCard("post", pileIndex);
    },
    [selectCard],
  );

  const handleSelectWood = useCallback(() => {
    selectCard("wood");
  }, [selectCard]);

  const handlePlayToDutch = useCallback(
    (pileIndex: number) => {
      const cardId = local.selectedCard?.card.id;
      playToDutch(pileIndex, false);
      if (cardId) {
        clearDutchBridgeTimeout();
        dutchBridgeSetAtRef.current = Date.now();
        setDutchPlayBridge({ pileIndex, cardId });
        bridgeMaxTimeoutRef.current = setTimeout(() => {
          bridgeMaxTimeoutRef.current = null;
          setDutchPlayBridge(null);
        }, 1200);
      }
    },
    [local.selectedCard, playToDutch, clearDutchBridgeTimeout],
  );

  const handleStartNewDutch = useCallback(() => {
    const cardId = local.selectedCard?.card.id;
    const pileIndex = state.dutchPiles.length;
    playToDutch(pileIndex, true);
    if (cardId) {
      clearDutchBridgeTimeout();
      dutchBridgeSetAtRef.current = Date.now();
      setDutchPlayBridge({ pileIndex, cardId });
      bridgeMaxTimeoutRef.current = setTimeout(() => {
        bridgeMaxTimeoutRef.current = null;
        setDutchPlayBridge(null);
      }, 1200);
    }
  }, [local.selectedCard, playToDutch, state.dutchPiles.length, clearDutchBridgeTimeout]);

  const handlePlayToPost = useCallback(
    (pileIndex: number) => {
      playToPost(pileIndex);
    },
    [playToPost],
  );

  const handleFlipHand = useCallback(() => {
    flipHand();
  }, [flipHand]);

  const handlePickUpWood = useCallback(() => {
    pickUpWoodPile();
  }, [pickUpWoodPile]);

  const handleDeselect = useCallback(() => {
    deselectCard();
  }, [deselectCard]);

  const handleBeginRound = useCallback(() => {
    dispatch({ type: "begin-round" });
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: "begin-round" });
  }, [dispatch]);

  const handleLeave = useCallback(() => {
    router.push("/");
  }, [router]);

  if (state.phase === "pre-round" || (state.phase === "round-end" && !state.blitzCallerId)) {
    const starterName =
      players.find((p) => p.id === state.roundStarterId)?.name ?? "Host";

    return (
      <BeginRound
        round={state.round}
        isStarter={playerId === state.roundStarterId}
        starterName={starterName}
        players={players}
        scores={state.scores}
        onBeginRound={handleBeginRound}
      />
    );
  }

  if (state.phase === "round-end" && state.blitzCallerId) {
    const callerName =
      players.find((p) => p.id === state.blitzCallerId)?.name ?? "Someone";

    return (
      <RoundSummary
        round={state.round}
        blitzCallerName={callerName}
        blitzCallerId={state.blitzCallerId}
        players={players}
        blitzCounts={state.blitzCounts}
        cardsPlayedToDutch={state.cardsPlayedToDutch}
        scores={state.scores}
        isStarter={playerId === state.roundStarterId}
        onBeginRound={handleBeginRound}
      />
    );
  }

  if (state.phase === "game-over") {
    return (
      <FinalScoreScreen
        players={players}
        scores={state.scores}
        scoreHistory={state.scoreHistory}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <GameBoard
      players={players}
      playerId={playerId}
      scores={state.scores}
      blitzCounts={state.blitzCounts}
      dutchPiles={state.dutchPiles}
      dutchPlayBridge={dutchPlayBridge}
      dutchIncoming={dutchIncoming}
      local={local}
      playerColor={playerColor}
      accessibilityMode={false}
      leftHanded={playerData.handedness === "left"}
      legalDutchIndices={dutchTargets.pileIndices}
      canStartNewDutch={dutchTargets.canStartNew}
      legalPostIndices={postTargets}
      onSelectBlitz={handleSelectBlitz}
      onSelectPost={handleSelectPost}
      onSelectWood={handleSelectWood}
      onPlayToDutch={handlePlayToDutch}
      onStartNewDutch={handleStartNewDutch}
      onPlayToPost={handlePlayToPost}
      onFlipHand={handleFlipHand}
      onPickUpWood={handlePickUpWood}
      onDeselect={handleDeselect}
      onDutchBridgeLayoutComplete={handleDutchBridgeLayoutComplete}
      onRemoteIncomingComplete={handleRemoteIncomingComplete}
    />
  );
}
