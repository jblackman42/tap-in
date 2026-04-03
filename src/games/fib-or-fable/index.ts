import type { GameDefinition } from "@/lib/engine/types";
import type {
  FibOrFableState,
  FibOrFableAction,
  Question,
  QuestionAnswer,
} from "./types";
import { FibOrFablePlayerView } from "./PlayerView";
import { selectFacts } from "./prompts";
import { calculateQuestionPoints } from "./scoring";

const TOTAL_ROUNDS = 3;
const WRITING_TIME = 60;
const VOTING_TIME = 30;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function questionsPerRound(playerCount: number): number {
  return Math.min(playerCount, 5);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initRound(
  round: number,
  playerIds: string[],
  usedFactIds: string[],
): Pick<
  FibOrFableState,
  | "phase"
  | "round"
  | "questions"
  | "currentQuestionIndex"
  | "playersSubmitted"
  | "timerEndsAt"
  | "usedFactIds"
> {
  const count = questionsPerRound(playerIds.length);
  const { facts, newUsedIds } = selectFacts(count, usedFactIds);

  const questions: Question[] = facts.map((fact) => ({
    id: fact.id,
    factText: fact.text,
    truthAnswer: fact.answer,
    lies: {},
    answers: [],
    votes: {},
    voteCounts: {},
    eligibleVoterIds: [],
    phase: "active",
    pointsAwarded: {},
    nobodyGotIt: false,
  }));

  return {
    phase: "writing",
    round,
    questions,
    currentQuestionIndex: 0,
    playersSubmitted: [],
    timerEndsAt: Date.now() + WRITING_TIME * 1000,
    usedFactIds: newUsedIds,
  };
}

function buildAnswersForQuestion(
  question: Question,
  playerIds: string[],
): Question {
  const liesByNorm = new Map<string, { text: string; pids: string[] }>();

  for (const pid of playerIds) {
    const lie = question.lies[pid];
    if (lie == null) continue;
    const key = normalize(lie);
    const existing = liesByNorm.get(key);
    if (existing) {
      existing.pids.push(pid);
    } else {
      liesByNorm.set(key, { text: lie, pids: [pid] });
    }
  }

  const lieAnswers: QuestionAnswer[] = Array.from(liesByNorm.values()).map(
    ({ text, pids }) => ({
      answerId: `${question.id}-lie-${pids.join("-")}`,
      text,
      isTruth: false,
      playerIds: pids,
    }),
  );

  const truthAnswer: QuestionAnswer = {
    answerId: `${question.id}-truth`,
    text: question.truthAnswer,
    isTruth: true,
    playerIds: [],
  };

  const allAnswers = shuffleArray([...lieAnswers, truthAnswer]);

  const voteCounts: Record<string, number> = {};
  for (const a of allAnswers) {
    voteCounts[a.answerId] = 0;
  }

  return {
    ...question,
    answers: allAnswers,
    voteCounts,
    eligibleVoterIds: [...playerIds],
  };
}

function transitionToVoting(state: FibOrFableState): FibOrFableState {
  const questions = state.questions.map((q) =>
    buildAnswersForQuestion(q, state.playerIds),
  );

  return {
    ...state,
    phase: "voting",
    questions,
    currentQuestionIndex: 0,
    timerEndsAt: Date.now() + VOTING_TIME * 1000,
  };
}

export const fibOrFableGame: GameDefinition<FibOrFableState, FibOrFableAction> =
  {
    id: "fib-or-fable",
    name: "Fib or Fable",
    description:
      "Bizarre true facts with a word blanked out — write a fake answer, fool your friends, spot the truth!",
    minPlayers: 3,
    maxPlayers: 8,

    joinFields: [],

    createInitialState(players): FibOrFableState {
      const playerIds = players.map((p) => p.id);
      const scores: Record<string, number> = {};
      for (const p of players) scores[p.id] = 0;

      const roundInit = initRound(1, playerIds, []);

      return {
        ...roundInit,
        totalRounds: TOTAL_ROUNDS,
        scores,
        roundScores: Object.fromEntries(playerIds.map((id) => [id, []])),
        playerIds,
        rejections: {},
        playAgainVotes: [],
      };
    },

    reducer(
      state: FibOrFableState,
      action: FibOrFableAction,
      playerId: string,
    ): FibOrFableState {
      switch (action.type) {
        case "submit-lie": {
          if (state.phase !== "writing") return state;
          if (state.playersSubmitted.includes(playerId)) return state;

          const targetQ = state.questions.find(
            (q) => q.id === action.questionId,
          );
          if (!targetQ) return state;

          const submitted = action.answer.trim() || "…";
          const normSubmitted = normalize(submitted);
          const normTruth = normalize(targetQ.truthAnswer);

          if (normSubmitted === normTruth) {
            return {
              ...state,
              rejections: {
                ...state.rejections,
                [playerId]: {
                  questionId: action.questionId,
                  reason: "Too close to the truth — try again!",
                },
              },
            };
          }

          const questions = state.questions.map((q) =>
            q.id === action.questionId
              ? {
                  ...q,
                  lies: { ...q.lies, [playerId]: submitted },
                }
              : q,
          );

          const allAnswered = questions.every(
            (q) => q.lies[playerId] != null,
          );
          const newSubmitted = allAnswered
            ? [...state.playersSubmitted, playerId]
            : state.playersSubmitted;

          const newState = {
            ...state,
            questions,
            playersSubmitted: newSubmitted,
            rejections: { ...state.rejections, [playerId]: null },
          };

          if (newSubmitted.length >= state.playerIds.length) {
            return transitionToVoting(newState);
          }

          return newState;
        }

        case "cast-vote": {
          if (state.phase !== "voting") return state;
          const questions = [...state.questions];
          const current = { ...questions[state.currentQuestionIndex] };
          if (current.phase !== "active") return state;
          if (!current.eligibleVoterIds.includes(playerId)) return state;
          if (current.votes[playerId]) return state;

          const newVotes = { ...current.votes, [playerId]: action.answerId };
          const newCounts = { ...current.voteCounts };
          newCounts[action.answerId] = (newCounts[action.answerId] ?? 0) + 1;

          current.votes = newVotes;
          current.voteCounts = newCounts;

          const allVoted = current.eligibleVoterIds.every(
            (id) => newVotes[id],
          );

          if (allVoted) {
            current.phase = "reveal";
            const { pointsAwarded, nobodyGotIt } = calculateQuestionPoints(
              { ...current, votes: newVotes, voteCounts: newCounts },
              state.round,
            );
            current.pointsAwarded = pointsAwarded;
            current.nobodyGotIt = nobodyGotIt;

            const newScores = { ...state.scores };
            for (const [pid, pts] of Object.entries(pointsAwarded)) {
              newScores[pid] = (newScores[pid] ?? 0) + pts;
            }

            questions[state.currentQuestionIndex] = current;
            return { ...state, questions, scores: newScores, timerEndsAt: null };
          }

          questions[state.currentQuestionIndex] = current;
          return { ...state, questions };
        }

        case "timer-expired": {
          if (state.phase === "writing") {
            const questions = state.questions.map((q) => {
              const lies = { ...q.lies };
              for (const pid of state.playerIds) {
                if (lies[pid] == null) {
                  lies[pid] = "…";
                }
              }
              return { ...q, lies };
            });
            return transitionToVoting({
              ...state,
              questions,
              playersSubmitted: [...state.playerIds],
            });
          }

          if (state.phase === "voting") {
            const questions = [...state.questions];
            const current = { ...questions[state.currentQuestionIndex] };
            if (current.phase === "active") {
              current.phase = "reveal";
              const { pointsAwarded, nobodyGotIt } = calculateQuestionPoints(
                current,
                state.round,
              );
              current.pointsAwarded = pointsAwarded;
              current.nobodyGotIt = nobodyGotIt;

              const newScores = { ...state.scores };
              for (const [pid, pts] of Object.entries(pointsAwarded)) {
                newScores[pid] = (newScores[pid] ?? 0) + pts;
              }

              questions[state.currentQuestionIndex] = current;
              return {
                ...state,
                questions,
                scores: newScores,
                timerEndsAt: null,
              };
            }
          }

          return state;
        }

        case "advance-question": {
          if (state.phase !== "voting") return state;
          const currentQ = state.questions[state.currentQuestionIndex];
          if (currentQ?.phase !== "reveal") return state;

          const nextIndex = state.currentQuestionIndex + 1;

          if (nextIndex >= state.questions.length) {
            const roundScores = { ...state.roundScores };
            for (const pid of state.playerIds) {
              let roundTotal = 0;
              for (const q of state.questions) {
                roundTotal += q.pointsAwarded[pid] ?? 0;
              }
              roundScores[pid] = [...(roundScores[pid] ?? []), roundTotal];
            }

            if (state.round >= state.totalRounds) {
              return {
                ...state,
                phase: "final-scores",
                roundScores,
                timerEndsAt: null,
              };
            }
            return {
              ...state,
              phase: "round-summary",
              roundScores,
              timerEndsAt: null,
            };
          }

          return {
            ...state,
            currentQuestionIndex: nextIndex,
            timerEndsAt: Date.now() + VOTING_TIME * 1000,
          };
        }

        case "start-next-round": {
          if (state.phase !== "round-summary") return state;
          const nextRound = state.round + 1;

          const roundInit = initRound(
            nextRound,
            state.playerIds,
            state.usedFactIds,
          );

          return { ...state, ...roundInit };
        }

        case "vote-play-again": {
          if (state.phase !== "final-scores") return state;
          if (state.playAgainVotes.includes(playerId)) return state;
          return {
            ...state,
            playAgainVotes: [...state.playAgainVotes, playerId],
          };
        }

        default:
          return state;
      }
    },

    getPlayerView(
      state: FibOrFableState,
      playerId: string,
    ): Partial<FibOrFableState> {
      const playerRejection = state.rejections[playerId] ?? null;

      if (state.phase === "writing") {
        return {
          ...state,
          questions: state.questions.map((q) => ({
            ...q,
            truthAnswer: "",
            lies:
              q.lies[playerId] != null
                ? { [playerId]: q.lies[playerId] }
                : {},
            answers: [],
          })),
          rejections: { [playerId]: playerRejection },
        };
      }

      if (state.phase === "voting") {
        const questions = state.questions.map((q, i) => {
          if (i !== state.currentQuestionIndex) return q;

          if (q.phase === "active") {
            return {
              ...q,
              truthAnswer: "",
              lies: {},
              answers: q.answers
                .filter((a) => !a.playerIds.includes(playerId))
                .map((a) => ({
                  ...a,
                  isTruth: false,
                  playerIds: [],
                })),
              votes:
                playerId in q.votes
                  ? { [playerId]: q.votes[playerId] }
                  : {},
            };
          }

          return q;
        });

        return { ...state, questions, rejections: {} };
      }

      return { ...state, rejections: {} };
    },

    PlayerView: FibOrFablePlayerView,
  };
