export interface FibFact {
  id: string;
  category: string;
  text: string;
  answer: string;
}

export interface QuestionAnswer {
  answerId: string;
  text: string;
  isTruth: boolean;
  playerIds: string[];
}

export type QuestionPhase = "active" | "reveal";

export interface Question {
  id: string;
  factText: string;
  truthAnswer: string;
  lies: Record<string, string>;
  answers: QuestionAnswer[];
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
  eligibleVoterIds: string[];
  phase: QuestionPhase;
  pointsAwarded: Record<string, number>;
  nobodyGotIt: boolean;
}

export type GamePhase =
  | "writing"
  | "voting"
  | "round-summary"
  | "final-scores";

export interface FibOrFableState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  questions: Question[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  roundScores: Record<string, number[]>;
  playerIds: string[];
  playersSubmitted: string[];
  timerEndsAt: number | null;
  usedFactIds: string[];
  rejections: Record<string, { questionId: string; reason: string } | null>;
  playAgainVotes: string[];
}

export type FibOrFableAction =
  | { type: "submit-lie"; questionId: string; answer: string }
  | { type: "cast-vote"; answerId: string }
  | { type: "advance-question" }
  | { type: "start-next-round" }
  | { type: "timer-expired" }
  | { type: "vote-play-again" };
