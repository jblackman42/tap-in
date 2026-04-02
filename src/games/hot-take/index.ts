import type { GameDefinition } from "@/lib/engine/types";
import { HotTakePlayerView } from "./PlayerView";

const PROMPTS = [
  "Pineapple on pizza",
  "Cereal is a soup",
  "Hot dogs are sandwiches",
  "Water is wet",
  "Cats are better than dogs",
  "Toilet paper: over is the only correct way",
  "GIF is pronounced with a hard G",
  "Putting ketchup on steak is fine",
  "Socks with sandals look great",
  "The best Star Wars movie is a prequel",
  "Ranch goes on everything",
  "Crocs are fashionable",
  "Monday is the best day of the week",
  "Candy corn is delicious",
  "Sleeping with socks on is normal",
  "Ice cream is better than cake",
  "Texting is better than calling",
  "Reclining your airplane seat is perfectly fine",
  "Breakfast for dinner is superior",
  "Math is fun",
];

export interface HotTakeState {
  phase: "voting" | "judging" | "reveal" | "scores";
  round: number;
  totalRounds: number;
  prompt: string;
  judgeId: string;
  votes: Record<string, "hot" | "cold">;
  judgeGuess: "hot" | "cold" | null;
  scores: Record<string, number>;
  usedPrompts: string[];
  majorityVote: "hot" | "cold" | null;
  judgeCorrect: boolean | null;
}

export type HotTakeAction =
  | { type: "vote"; vote: "hot" | "cold" }
  | { type: "judge-guess"; guess: "hot" | "cold" }
  | { type: "next-round" };

function pickRandomPrompt(used: string[]): string {
  const available = PROMPTS.filter((p) => !used.includes(p));
  if (available.length === 0) {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

function getMajority(votes: Record<string, "hot" | "cold">): "hot" | "cold" {
  const values = Object.values(votes);
  const hotCount = values.filter((v) => v === "hot").length;
  return hotCount >= values.length / 2 ? "hot" : "cold";
}

export const hotTakeGame: GameDefinition<HotTakeState, HotTakeAction> = {
  id: "hot-take",
  name: "Hot Take",
  description:
    "Vote on spicy opinions. The judge tries to guess the majority — get it right for points!",
  minPlayers: 3,
  maxPlayers: 20,

  joinFields: [],

  createInitialState(players) {
    const totalRounds = Math.min(players.length * 2, 10);
    const prompt = pickRandomPrompt([]);
    const scores: Record<string, number> = {};
    for (const p of players) {
      scores[p.id] = 0;
    }

    return {
      phase: "voting",
      round: 1,
      totalRounds,
      prompt,
      judgeId: players[0].id,
      votes: {},
      judgeGuess: null,
      scores,
      usedPrompts: [prompt],
      majorityVote: null,
      judgeCorrect: null,
    };
  },

  reducer(state, action, playerId) {
    switch (action.type) {
      case "vote": {
        if (state.phase !== "voting" || playerId === state.judgeId) return state;
        const votes = { ...state.votes, [playerId]: action.vote };
        const voterCount =
          Object.keys(state.scores).length - 1;
        const allVoted = Object.keys(votes).length >= voterCount;
        return {
          ...state,
          votes,
          phase: allVoted ? "judging" : "voting",
        };
      }
      case "judge-guess": {
        if (state.phase !== "judging" || playerId !== state.judgeId) return state;
        const majority = getMajority(state.votes);
        const correct = action.guess === majority;
        const newScores = { ...state.scores };
        if (correct) {
          newScores[state.judgeId] = (newScores[state.judgeId] || 0) + 1;
        } else {
          for (const id of Object.keys(newScores)) {
            if (id !== state.judgeId) {
              newScores[id] = (newScores[id] || 0) + 1;
            }
          }
        }
        return {
          ...state,
          phase: "reveal",
          judgeGuess: action.guess,
          majorityVote: majority,
          judgeCorrect: correct,
          scores: newScores,
        };
      }
      case "next-round": {
        if (state.phase !== "reveal") return state;
        if (state.round >= state.totalRounds) {
          return { ...state, phase: "scores" };
        }
        const playerIds = Object.keys(state.scores);
        const currentJudgeIdx = playerIds.indexOf(state.judgeId);
        const nextJudgeId =
          playerIds[(currentJudgeIdx + 1) % playerIds.length];
        const prompt = pickRandomPrompt(state.usedPrompts);
        return {
          ...state,
          phase: "voting",
          round: state.round + 1,
          prompt,
          judgeId: nextJudgeId,
          votes: {},
          judgeGuess: null,
          majorityVote: null,
          judgeCorrect: null,
          usedPrompts: [...state.usedPrompts, prompt],
        };
      }
      default:
        return state;
    }
  },

  getPlayerView(state, playerId) {
    return {
      ...state,
      votes:
        state.phase === "reveal" || state.phase === "scores"
          ? state.votes
          : playerId === state.judgeId
            ? {}
            : { [playerId]: state.votes[playerId] },
    };
  },

  PlayerView: HotTakePlayerView,
};
