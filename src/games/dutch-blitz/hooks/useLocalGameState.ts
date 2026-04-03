"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDeck, seededShuffle, dealCards } from "../cards";
import {
  canStackOnPost,
  canPlayOnDutch,
  canStartDutchPile,
} from "../types";
import type {
  Card,
  CardFace,
  DutchPile,
  LocalGameState,
  PlayerColor,
  SelectedCard,
  DutchBlitzAction,
} from "../types";

interface UseLocalGameStateOptions {
  playerColor: PlayerColor | null;
  dealSeed: number | null;
  postCount: number;
  phase: string;
  round: number;
  dutchPiles: DutchPile[];
  lastRejection: { card: CardFace; timestamp: number } | null;
  dispatch: (action: DutchBlitzAction) => void;
}

function topOf(pile: Card[]): Card | undefined {
  return pile[pile.length - 1];
}

function refillPostFromBlitzFn(
  prevState: LocalGameState,
  emptyPileIndex: number,
): { state: LocalGameState; blitzChanged: boolean } {
  if (prevState.blitzPile.length === 0) {
    return { state: prevState, blitzChanged: false };
  }

  const blitzCard = prevState.blitzPile[prevState.blitzPile.length - 1];
  const newBlitz = prevState.blitzPile.slice(0, -1);
  const newPosts = prevState.postPiles.map((pile, i) =>
    i === emptyPileIndex ? [blitzCard] : pile,
  );

  return {
    state: { ...prevState, blitzPile: newBlitz, postPiles: newPosts },
    blitzChanged: true,
  };
}

function computePlayToDutch(
  prev: LocalGameState,
  dutchPiles: DutchPile[],
  pileIndex: number,
  isNewPile: boolean,
): { newState: LocalGameState; action: DutchBlitzAction } | null {
  const sel = prev.selectedCard;
  if (!sel) return null;

  if (isNewPile && !canStartDutchPile(sel.card)) return null;
  if (
    !isNewPile &&
    dutchPiles[pileIndex] &&
    !canPlayOnDutch(sel.card, dutchPiles[pileIndex])
  ) {
    return null;
  }

  let newState: LocalGameState = { ...prev };

  if (sel.source === "blitz") {
    newState.blitzPile = prev.blitzPile.slice(0, -1);
  } else if (sel.source === "wood") {
    newState.woodPile = prev.woodPile.slice(0, -1);
  } else if (sel.source === "post" && sel.pileIndex !== undefined) {
    newState.postPiles = prev.postPiles.map((pile, i) =>
      i === sel.pileIndex ? pile.slice(0, -1) : pile,
    );
  }

  newState.selectedCard = null;

  if (sel.source === "post" && sel.pileIndex !== undefined) {
    if (newState.postPiles[sel.pileIndex].length === 0) {
      const result = refillPostFromBlitzFn(newState, sel.pileIndex);
      newState = result.state;
    }
  }

  const action: DutchBlitzAction = {
    type: "play-to-dutch",
    card: { suit: sel.card.suit, number: sel.card.number },
    pileIndex,
    isNewPile,
    newBlitzCount: newState.blitzPile.length,
  };

  return { newState, action };
}

function computePlayToPost(
  prev: LocalGameState,
  toPileIndex: number,
): { newState: LocalGameState; action: DutchBlitzAction | null } | null {
  const sel = prev.selectedCard;
  if (!sel) return null;

  const targetPile = prev.postPiles[toPileIndex];
  const targetTop = topOf(targetPile);

  if (targetTop && !canStackOnPost(sel.card, targetTop)) {
    return null;
  }

  let newState: LocalGameState = { ...prev };

  if (sel.source === "blitz") {
    newState.blitzPile = prev.blitzPile.slice(0, -1);
  } else if (sel.source === "wood") {
    newState.woodPile = prev.woodPile.slice(0, -1);
  } else if (sel.source === "post" && sel.pileIndex !== undefined) {
    newState.postPiles = prev.postPiles.map((pile, i) =>
      i === sel.pileIndex ? pile.slice(0, -1) : pile,
    );
  }

  newState.postPiles = newState.postPiles.map((pile, i) =>
    i === toPileIndex ? [...pile, sel.card] : pile,
  );

  newState.selectedCard = null;

  let blitzChanged = false;
  if (sel.source === "post" && sel.pileIndex !== undefined) {
    const emptyIndex = sel.pileIndex;
    if (newState.postPiles[emptyIndex].length === 0) {
      const result = refillPostFromBlitzFn(newState, emptyIndex);
      newState = result.state;
      blitzChanged = result.blitzChanged;
    }
  }

  if (sel.source === "blitz") {
    blitzChanged = true;
  }

  const action: DutchBlitzAction | null = blitzChanged
    ? { type: "update-blitz-count", count: newState.blitzPile.length }
    : null;

  return { newState, action };
}

function computeMovePostToPost(
  prev: LocalGameState,
  fromPileIndex: number,
  toPileIndex: number,
): { newState: LocalGameState; action: DutchBlitzAction | null } | null {
  const fromPile = prev.postPiles[fromPileIndex];
  const toPile = prev.postPiles[toPileIndex];
  if (!fromPile || fromPile.length === 0) return null;

  const fromBottom = fromPile[0];
  const toTop = topOf(toPile);

  if (toTop && !canStackOnPost(fromBottom, toTop)) return null;
  if (!toTop && fromPile.length === prev.postPiles[fromPileIndex].length) {
    return null;
  }

  const newPosts = prev.postPiles.map((pile, i) => {
    if (i === fromPileIndex) return [];
    if (i === toPileIndex) return [...pile, ...fromPile];
    return pile;
  });

  let newState: LocalGameState = {
    ...prev,
    postPiles: newPosts,
    selectedCard: null,
  };

  const result = refillPostFromBlitzFn(newState, fromPileIndex);
  newState = result.state;

  const action: DutchBlitzAction | null = result.blitzChanged
    ? { type: "update-blitz-count", count: newState.blitzPile.length }
    : null;

  return { newState, action };
}

export function useLocalGameState({
  playerColor,
  dealSeed,
  postCount,
  phase,
  round,
  dutchPiles,
  lastRejection,
  dispatch,
}: UseLocalGameStateOptions) {
  const [local, setLocal] = useState<LocalGameState>({
    blitzPile: [],
    postPiles: [],
    woodPile: [],
    hand: [],
    selectedCard: null,
  });

  const localRef = useRef(local);
  // eslint-disable-next-line react-hooks/refs -- keep latest local for stable effect closures
  localRef.current = local;

  const lastProcessedRejectionRef = useRef<number>(0);
  const lastInitRoundRef = useRef<number>(0);
  const flipInProgressRef = useRef(false);

  useEffect(() => {
    if (
      phase !== "playing" ||
      !playerColor ||
      dealSeed === null ||
      lastInitRoundRef.current === round
    ) {
      return;
    }

    lastInitRoundRef.current = round;
    const deck = createDeck(playerColor);
    const shuffled = seededShuffle(deck, dealSeed);
    const dealt = dealCards(shuffled, postCount);

    const next: LocalGameState = {
      blitzPile: dealt.blitz,
      postPiles: dealt.postPiles,
      woodPile: [],
      hand: dealt.hand,
      selectedCard: null,
    };
    localRef.current = next;
    setLocal(next);
    lastProcessedRejectionRef.current = 0;
  }, [phase, playerColor, dealSeed, postCount, round]);

  useEffect(() => {
    if (
      !lastRejection ||
      lastRejection.timestamp <= lastProcessedRejectionRef.current
    ) {
      return;
    }
    lastProcessedRejectionRef.current = lastRejection.timestamp;
    const rejectedCard: Card = {
      suit: lastRejection.card.suit,
      number: lastRejection.card.number,
      playerColor: playerColor ?? "pump",
      id: `${playerColor}-${lastRejection.card.suit}-${lastRejection.card.number}`,
    };

    setLocal((prev) => {
      const next = {
        ...prev,
        woodPile: [...prev.woodPile, rejectedCard],
      };
      localRef.current = next;
      return next;
    });
  }, [lastRejection, playerColor]);

  const selectCard = useCallback(
    (source: "blitz" | "post" | "wood", pileIndex?: number) => {
      setLocal((prev) => {
        let card: Card | undefined;
        if (source === "blitz") {
          card = topOf(prev.blitzPile);
        } else if (source === "post" && pileIndex !== undefined) {
          card = topOf(prev.postPiles[pileIndex]);
        } else if (source === "wood") {
          card = topOf(prev.woodPile);
        }
        if (!card) return prev;

        if (
          prev.selectedCard &&
          prev.selectedCard.card.id === card.id
        ) {
          const next = { ...prev, selectedCard: null };
          localRef.current = next;
          return next;
        }

        const next = {
          ...prev,
          selectedCard: { card, source, pileIndex },
        };
        localRef.current = next;
        return next;
      });
    },
    [],
  );

  const deselectCard = useCallback(() => {
    setLocal((prev) => {
      const next = { ...prev, selectedCard: null };
      localRef.current = next;
      return next;
    });
  }, []);

  const flipHand = useCallback(() => {
    if (flipInProgressRef.current) return;
    const prev = localRef.current;
    if (prev.hand.length === 0) return;

    const total = Math.min(3, prev.hand.length);
    flipInProgressRef.current = true;

    const moveOne = () => {
      setLocal((p) => {
        if (p.hand.length === 0) return p;
        const flipped = p.hand.slice(0, 1);
        const remaining = p.hand.slice(1);
        const next = {
          ...p,
          hand: remaining,
          woodPile: [...p.woodPile, ...flipped],
          selectedCard: null,
        };
        localRef.current = next;
        return next;
      });
    };

    moveOne();
    for (let i = 1; i < total; i++) {
      window.setTimeout(moveOne, i * 72);
    }
    window.setTimeout(() => {
      flipInProgressRef.current = false;
    }, total * 72 + 40);
  }, []);

  const pickUpWoodPile = useCallback(() => {
    setLocal((prev) => {
      if (prev.woodPile.length === 0) return prev;
      const next = {
        ...prev,
        hand: [...prev.woodPile].reverse(),
        woodPile: [],
        selectedCard: null,
      };
      localRef.current = next;
      return next;
    });
  }, []);

  const playToPost = useCallback(
    (toPileIndex: number) => {
      const result = computePlayToPost(localRef.current, toPileIndex);
      if (!result) return;
      localRef.current = result.newState;
      setLocal(result.newState);
      if (result.action) {
        dispatch(result.action);
      }
    },
    [dispatch],
  );

  const movePostToPost = useCallback(
    (fromPileIndex: number, toPileIndex: number) => {
      const result = computeMovePostToPost(
        localRef.current,
        fromPileIndex,
        toPileIndex,
      );
      if (!result) return;
      localRef.current = result.newState;
      setLocal(result.newState);
      if (result.action) {
        dispatch(result.action);
      }
    },
    [dispatch],
  );

  const playToDutch = useCallback(
    (pileIndex: number, isNewPile: boolean) => {
      const result = computePlayToDutch(
        localRef.current,
        dutchPiles,
        pileIndex,
        isNewPile,
      );
      if (!result) return;
      localRef.current = result.newState;
      setLocal(result.newState);
      dispatch(result.action);
    },
    [dispatch, dutchPiles],
  );

  const getLegalDutchTargets = useCallback(
    (sel: SelectedCard | null): { pileIndices: number[]; canStartNew: boolean } => {
      if (!sel) return { pileIndices: [], canStartNew: false };

      const indices: number[] = [];
      for (let i = 0; i < dutchPiles.length; i++) {
        if (canPlayOnDutch(sel.card, dutchPiles[i])) {
          indices.push(i);
        }
      }

      return {
        pileIndices: indices,
        canStartNew: canStartDutchPile(sel.card),
      };
    },
    [dutchPiles],
  );

  const getLegalPostTargets = useCallback(
    (sel: SelectedCard | null): number[] => {
      if (!sel) return [];

      const indices: number[] = [];
      for (let i = 0; i < local.postPiles.length; i++) {
        if (sel.source === "post" && sel.pileIndex === i) continue;

        const targetTop = topOf(local.postPiles[i]);
        if (!targetTop || canStackOnPost(sel.card, targetTop)) {
          indices.push(i);
        }
      }
      return indices;
    },
    [local.postPiles],
  );

  return {
    local,
    selectCard,
    deselectCard,
    flipHand,
    pickUpWoodPile,
    playToPost,
    movePostToPost,
    playToDutch,
    getLegalDutchTargets,
    getLegalPostTargets,
  };
}
