import type { GameDefinition } from "@/lib/engine/types";
import { deriveSeed } from "./cards";
import type {
  DutchBlitzState,
  DutchBlitzAction,
  DutchBlitzPlayerData,
  PlayerColor,
} from "./types";
import { PLAYER_COLORS } from "./types";
import { DutchBlitzPlayerViewComponent } from "./PlayerView";

function computeRoundScores(state: DutchBlitzState): DutchBlitzState {
  const newScores = { ...state.scores };
  const newHistory = { ...state.scoreHistory };

  for (const pid of Object.keys(newScores)) {
    const dutchCards = state.cardsPlayedToDutch[pid] ?? 0;
    const blitzRemaining = state.blitzCounts[pid] ?? 0;
    const roundNet = dutchCards - blitzRemaining * 2;
    newScores[pid] = (newScores[pid] ?? 0) + roundNet;
    newHistory[pid] = [...(newHistory[pid] ?? []), newScores[pid]];
  }

  return { ...state, scores: newScores, scoreHistory: newHistory };
}

function triggerBlitz(
  state: DutchBlitzState,
  callerId: string,
): DutchBlitzState {
  const scored = computeRoundScores({ ...state, blitzCallerId: callerId });
  const hasWinner = Object.values(scored.scores).some((s) => s >= 75);

  return {
    ...scored,
    phase: hasWinner ? "game-over" : "round-end",
    blitzCallerId: callerId,
    roundStarterId: callerId,
  };
}

export const dutchBlitzGame: GameDefinition<
  DutchBlitzState,
  DutchBlitzAction,
  DutchBlitzPlayerData
> = {
  id: "dutch-blitz",
  name: "Dutch Blitz",
  description:
    "A fast-paced card game — race to empty your Blitz pile before anyone else!",
  minPlayers: 2,
  maxPlayers: 4,

  joinFields: [
    {
      name: "handedness",
      label: "Which hand do you use?",
      type: "select",
      options: [
        { label: "Right-handed", value: "right" },
        { label: "Left-handed", value: "left" },
      ],
      required: true,
      defaultValue: "right",
    },
  ],

  createInitialState(players) {
    const scores: Record<string, number> = {};
    const scoreHistory: Record<string, number[]> = {};
    const playerColors: Record<string, PlayerColor> = {};
    const blitzCounts: Record<string, number> = {};
    const cardsPlayedToDutch: Record<string, number> = {};
    const dealSeeds: Record<string, number> = {};

    players.forEach((p, i) => {
      scores[p.id] = 0;
      scoreHistory[p.id] = [];
      playerColors[p.id] = PLAYER_COLORS[i % PLAYER_COLORS.length];
      blitzCounts[p.id] = 10;
      cardsPlayedToDutch[p.id] = 0;
      dealSeeds[p.id] = deriveSeed(1, p.id);
    });

    return {
      phase: "pre-round",
      round: 1,
      dutchPiles: [],
      blitzCounts,
      cardsPlayedToDutch,
      scores,
      scoreHistory,
      blitzCallerId: null,
      roundStarterId: players[0]?.id ?? null,
      playerColors,
      dealSeeds,
      rejections: {},
      playerCount: players.length,
    };
  },

  reducer(state, action, playerId) {
    if (state.phase === "round-end" || state.phase === "game-over") {
      if (action.type !== "begin-round") return state;
    }

    switch (action.type) {
      case "play-to-dutch": {
        if (state.phase !== "playing") return state;

        const { card, pileIndex, isNewPile, newBlitzCount } = action;

        if (isNewPile) {
          if (card.number !== 1) {
            return {
              ...state,
              rejections: {
                ...state.rejections,
                [playerId]: { card, timestamp: Date.now() },
              },
            };
          }

          const newPile = { topCard: { suit: card.suit, number: 1 }, depth: 1 };
          const newState: DutchBlitzState = {
            ...state,
            dutchPiles: [...state.dutchPiles, newPile],
            cardsPlayedToDutch: {
              ...state.cardsPlayedToDutch,
              [playerId]: (state.cardsPlayedToDutch[playerId] ?? 0) + 1,
            },
            blitzCounts: {
              ...state.blitzCounts,
              [playerId]: newBlitzCount,
            },
            rejections: { ...state.rejections, [playerId]: null },
          };

          if (newBlitzCount === 0) return triggerBlitz(newState, playerId);
          return newState;
        }

        const pile = state.dutchPiles[pileIndex];
        if (!pile) {
          return {
            ...state,
            rejections: {
              ...state.rejections,
              [playerId]: { card, timestamp: Date.now() },
            },
          };
        }

        if (
          card.suit !== pile.topCard.suit ||
          card.number !== pile.topCard.number + 1
        ) {
          return {
            ...state,
            rejections: {
              ...state.rejections,
              [playerId]: { card, timestamp: Date.now() },
            },
          };
        }

        const updatedPile = {
          topCard: { suit: card.suit, number: card.number },
          depth: pile.depth + 1,
        };

        let newPiles: typeof state.dutchPiles;
        if (updatedPile.depth >= 10) {
          newPiles = state.dutchPiles.filter((_, i) => i !== pileIndex);
        } else {
          newPiles = state.dutchPiles.map((p, i) =>
            i === pileIndex ? updatedPile : p,
          );
        }

        const newState: DutchBlitzState = {
          ...state,
          dutchPiles: newPiles,
          cardsPlayedToDutch: {
            ...state.cardsPlayedToDutch,
            [playerId]: (state.cardsPlayedToDutch[playerId] ?? 0) + 1,
          },
          blitzCounts: {
            ...state.blitzCounts,
            [playerId]: newBlitzCount,
          },
          rejections: { ...state.rejections, [playerId]: null },
        };

        if (newBlitzCount === 0) return triggerBlitz(newState, playerId);
        return newState;
      }

      case "update-blitz-count": {
        if (state.phase !== "playing") return state;

        const newState: DutchBlitzState = {
          ...state,
          blitzCounts: {
            ...state.blitzCounts,
            [playerId]: action.count,
          },
        };

        if (action.count === 0) return triggerBlitz(newState, playerId);
        return newState;
      }

      case "begin-round": {
        if (
          state.phase !== "pre-round" &&
          state.phase !== "round-end"
        ) {
          return state;
        }
        if (playerId !== state.roundStarterId) return state;

        const nextRound =
          state.phase === "pre-round" ? state.round : state.round + 1;
        const newSeeds: Record<string, number> = {};
        const newBlitz: Record<string, number> = {};
        const newPlayed: Record<string, number> = {};

        for (const pid of Object.keys(state.scores)) {
          newSeeds[pid] = deriveSeed(nextRound, pid);
          newBlitz[pid] = 10;
          newPlayed[pid] = 0;
        }

        return {
          ...state,
          phase: "playing",
          round: nextRound,
          dutchPiles: [],
          blitzCounts: newBlitz,
          cardsPlayedToDutch: newPlayed,
          dealSeeds: newSeeds,
          blitzCallerId: null,
          rejections: {},
        };
      }

      default:
        return state;
    }
  },

  getPlayerView(state, playerId): Partial<DutchBlitzState> {
    const { rejections, ...rest } = state;
    return {
      ...rest,
      lastRejection: rejections[playerId] ?? null,
    } as unknown as Partial<DutchBlitzState>;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PlayerView: DutchBlitzPlayerViewComponent as any,
};
