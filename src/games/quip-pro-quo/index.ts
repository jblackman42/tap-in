import type { GameDefinition } from "@/lib/engine/types";
import type {
  QuipProQuoState,
  QuipProQuoAction,
  QuipProQuoPlayerData,
  QuipProQuoPlayer,
  Prompt,
  Matchup,
} from "./types";
import { QuipProQuoPlayerView } from "./PlayerView";
import { QuipProQuoLobbyView } from "./LobbyView";
import { getCustomPrompts, clearCustomPrompts } from "./customPromptStore";
import {
  generateStandardPairings,
  generateThriplashPairings,
  buildAssignmentsFromPairings,
  buildThriplashAssignments,
  buildMatchupsFromPairings,
  buildThriplashMatchups,
} from "./matchmaking";
import { calculateMatchupPoints, isQuipProQuo } from "./scoring";

const WRITING_TIME_STANDARD = 90;
const WRITING_TIME_THRIPLASH = 120;

function initRound(
  round: number,
  playerIds: string[],
  usedPromptIds: string[],
  previousPairings: [string, string][],
  extraPrompts: Prompt[] = [],
): Pick<
  QuipProQuoState,
  "phase" | "round" | "promptAssignments" | "answers" | "playersSubmitted" | "timerEndsAt" | "matchups" | "currentMatchupIndex" | "usedPromptIds"
> {
  if (round === 3) {
    const { pairings, newUsedIds } = generateThriplashPairings(playerIds, usedPromptIds, extraPrompts);
    const assignments = buildThriplashAssignments(pairings);
    return {
      phase: "writing",
      round,
      promptAssignments: assignments,
      answers: {},
      playersSubmitted: [],
      timerEndsAt: Date.now() + WRITING_TIME_THRIPLASH * 1000,
      matchups: [],
      currentMatchupIndex: 0,
      usedPromptIds: newUsedIds,
    };
  }

  const { pairings, newUsedIds } = generateStandardPairings(playerIds, usedPromptIds, previousPairings, extraPrompts);
  const assignments = buildAssignmentsFromPairings(pairings);

  return {
    phase: "writing",
    round,
    promptAssignments: assignments,
    answers: {},
    playersSubmitted: [],
    timerEndsAt: Date.now() + WRITING_TIME_STANDARD * 1000,
    matchups: [],
    currentMatchupIndex: 0,
    usedPromptIds: newUsedIds,
  };
}

function transitionToVoting(state: QuipProQuoState): QuipProQuoState {
  const { round, promptAssignments, answers, playerIds } = state;

  let matchups: Matchup[];

  if (round === 3) {
    const pairings = Object.entries(promptAssignments).map(([pid, assignments]) => ({
      promptId: assignments[0].promptId,
      promptText: assignments[0].promptText,
      playerId: pid,
    }));
    matchups = buildThriplashMatchups(pairings, answers, playerIds);
  } else {
    const pairings = reconstructPairings(promptAssignments);
    matchups = buildMatchupsFromPairings(pairings, answers, playerIds);
  }

  return {
    ...state,
    phase: "voting",
    matchups,
    currentMatchupIndex: 0,
    timerEndsAt: Date.now() + 45_000,
  };
}

function reconstructPairings(assignments: Record<string, { promptId: string; promptText: string }[]>) {
  const promptPlayers = new Map<string, { promptId: string; promptText: string; playerIds: string[] }>();

  for (const [pid, prompts] of Object.entries(assignments)) {
    for (const prompt of prompts) {
      const existing = promptPlayers.get(prompt.promptId);
      if (existing) {
        existing.playerIds.push(pid);
      } else {
        promptPlayers.set(prompt.promptId, {
          promptId: prompt.promptId,
          promptText: prompt.promptText,
          playerIds: [pid],
        });
      }
    }
  }

  return Array.from(promptPlayers.values()).map((p) => ({
    promptId: p.promptId,
    promptText: p.promptText,
    playerIds: [p.playerIds[0], p.playerIds[1] ?? p.playerIds[0]] as [string, string],
  }));
}

export const quipProQuoGame: GameDefinition<
  QuipProQuoState,
  QuipProQuoAction,
  QuipProQuoPlayerData
> = {
  id: "quip-pro-quo",
  name: "Quip Pro Quo",
  description:
    "Write funny answers to prompts, then vote on your favorites. Most votes wins!",
  minPlayers: 3,
  maxPlayers: 8,

  joinFields: [],

  createInitialState(players: QuipProQuoPlayer[]): QuipProQuoState {
    const playerIds = players.map((p) => p.id);
    const scores: Record<string, number> = {};
    for (const p of players) scores[p.id] = 0;

    const custom = getCustomPrompts();
    clearCustomPrompts();

    const extraPrompts: Prompt[] = custom.map((text, i) => ({
      id: `custom-${i}`,
      text,
      category: "custom",
    }));

    const roundInit = initRound(1, playerIds, [], [], extraPrompts);

    return {
      ...roundInit,
      scores,
      roundScores: Object.fromEntries(playerIds.map((id) => [id, []])),
      newPlayers: [],
      playerIds,
    };
  },

  reducer(state: QuipProQuoState, action: QuipProQuoAction, playerId: string): QuipProQuoState {
    switch (action.type) {
      case "submit-answer": {
        if (state.phase !== "writing") return state;
        if (state.playersSubmitted.includes(playerId)) return state;

        const playerAnswers = { ...state.answers };
        const existing = playerAnswers[playerId] ?? {};
        playerAnswers[playerId] = { ...existing, [action.promptId]: action.answer };

        const playerAssignments = state.promptAssignments[playerId] ?? [];
        const allAnswered = playerAssignments.every(
          (a) => playerAnswers[playerId]?.[a.promptId] != null,
        );

        const newSubmitted = allAnswered
          ? [...state.playersSubmitted, playerId]
          : state.playersSubmitted;

        const newState = { ...state, answers: playerAnswers, playersSubmitted: newSubmitted };

        if (newSubmitted.length >= state.playerIds.length) {
          return transitionToVoting(newState);
        }

        return newState;
      }

      case "timer-expired": {
        if (state.phase === "writing") {
          const filledAnswers = { ...state.answers };

          for (const pid of state.playerIds) {
            const assignments = state.promptAssignments[pid] ?? [];
            if (!filledAnswers[pid]) filledAnswers[pid] = {};

            for (const assignment of assignments) {
              if (filledAnswers[pid][assignment.promptId] == null) {
                filledAnswers[pid][assignment.promptId] =
                  state.round === 3 ? ["", "", ""] : "";
              }
            }
          }

          return transitionToVoting({
            ...state,
            answers: filledAnswers,
            playersSubmitted: [...state.playerIds],
          });
        }

        if (state.phase === "voting") {
          const matchups = [...state.matchups];
          const current = { ...matchups[state.currentMatchupIndex] };

          if (current.phase === "active") {
            const unanimous = isQuipProQuo(current);
            const points = calculateMatchupPoints(
              { ...current, quipProQuo: unanimous },
              state.round,
            );

            current.phase = "reveal";
            current.quipProQuo = unanimous;
            current.pointsAwarded = points;
            matchups[state.currentMatchupIndex] = current;

            const newScores = { ...state.scores };
            for (const [pid, pts] of Object.entries(points)) {
              newScores[pid] = (newScores[pid] ?? 0) + pts;
            }

            return { ...state, matchups, scores: newScores, timerEndsAt: null };
          }
        }

        return state;
      }

      case "cast-vote": {
        if (state.phase !== "voting") return state;
        const matchups = [...state.matchups];
        const current = { ...matchups[state.currentMatchupIndex] };
        if (current.phase !== "active") return state;

        if (!current.eligibleVoterIds.includes(playerId)) return state;
        if (current.votes[playerId]) return state;

        const newVotes = { ...current.votes, [playerId]: action.answerId };
        const newCounts = { ...current.voteCounts };
        newCounts[action.answerId] = (newCounts[action.answerId] ?? 0) + 1;

        current.votes = newVotes;
        current.voteCounts = newCounts;

        const allVoted = current.eligibleVoterIds.every((id) => newVotes[id]);

        if (allVoted) {
          const unanimous = isQuipProQuo({ ...current, votes: newVotes, voteCounts: newCounts });
          current.quipProQuo = unanimous;
          current.phase = "reveal";

          const points = calculateMatchupPoints(current, state.round);
          current.pointsAwarded = points;

          const newScores = { ...state.scores };
          for (const [pid, pts] of Object.entries(points)) {
            newScores[pid] = (newScores[pid] ?? 0) + pts;
          }

          matchups[state.currentMatchupIndex] = current;
          return { ...state, matchups, scores: newScores, timerEndsAt: null };
        }

        matchups[state.currentMatchupIndex] = current;
        return { ...state, matchups };
      }

      case "advance-matchup": {
        if (state.phase !== "voting") return state;
        const currentMatchup = state.matchups[state.currentMatchupIndex];
        if (currentMatchup?.phase !== "reveal") return state;

        const nextIndex = state.currentMatchupIndex + 1;

        if (nextIndex >= state.matchups.length) {
          const roundScores = { ...state.roundScores };
          for (const pid of state.playerIds) {
            let roundTotal = 0;
            for (const matchup of state.matchups) {
              roundTotal += matchup.pointsAwarded[pid] ?? 0;
            }
            roundScores[pid] = [...(roundScores[pid] ?? []), roundTotal];
          }

          if (state.round >= 3) {
            return { ...state, phase: "final-scores", roundScores, timerEndsAt: null };
          }
          return { ...state, phase: "round-summary", roundScores, timerEndsAt: null };
        }

        return {
          ...state,
          currentMatchupIndex: nextIndex,
          timerEndsAt: Date.now() + 45_000,
        };
      }

      case "start-next-round": {
        if (state.phase !== "round-summary") return state;
        const nextRound = state.round + 1;

        const previousPairings: [string, string][] = [];
        if (state.round <= 2) {
          const pairings = reconstructPairings(state.promptAssignments);
          for (const p of pairings) {
            previousPairings.push(p.playerIds);
          }
        }

        const roundInit = initRound(nextRound, state.playerIds, state.usedPromptIds, previousPairings);

        return {
          ...state,
          ...roundInit,
        };
      }

      case "play-again": {
        return state;
      }

      default:
        return state;
    }
  },

  getPlayerView(state: QuipProQuoState, playerId: string): Partial<QuipProQuoState> {
    if (state.phase === "writing") {
      const myAssignments = state.promptAssignments[playerId] ?? [];
      const myAnswers = state.answers[playerId] ?? {};

      return {
        ...state,
        promptAssignments: { [playerId]: myAssignments },
        answers: { [playerId]: myAnswers },
      };
    }

    if (state.phase === "voting") {
      const matchups = state.matchups.map((matchup, i) => {
        if (i !== state.currentMatchupIndex) {
          return matchup;
        }

        if (matchup.phase === "active") {
          return {
            ...matchup,
            answers: matchup.answers.map((a) => ({
              ...a,
              playerId: "",
            })),
            votes: playerId in matchup.votes
              ? { [playerId]: matchup.votes[playerId] }
              : {},
          };
        }

        return matchup;
      });

      return { ...state, matchups, promptAssignments: {}, answers: {} };
    }

    return {
      ...state,
      promptAssignments: {},
      answers: {},
    };
  },

  PlayerView: QuipProQuoPlayerView,
  LobbyView: QuipProQuoLobbyView,
};
