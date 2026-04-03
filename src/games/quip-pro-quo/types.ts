import type { Player } from "@/lib/party/types";

export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export interface PromptAssignment {
  promptId: string;
  promptText: string;
}

export interface MatchupAnswer {
  answerId: string;
  playerId: string;
  text: string;
}

export type MatchupPhase = "active" | "reveal";

export interface Matchup {
  promptText: string;
  answers: MatchupAnswer[];
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
  eligibleVoterIds: string[];
  phase: MatchupPhase;
  quipProQuo: boolean;
  isRound3: boolean;
  pointsAwarded: Record<string, number>;
}

export type GamePhase =
  | "writing"
  | "voting"
  | "round-summary"
  | "final-scores";

export interface QuipProQuoState {
  phase: GamePhase;
  round: number;

  promptAssignments: Record<string, PromptAssignment[]>;
  answers: Record<string, Record<string, string | string[]>>;
  playersSubmitted: string[];
  timerEndsAt: number | null;

  matchups: Matchup[];
  currentMatchupIndex: number;

  scores: Record<string, number>;
  roundScores: Record<string, number[]>;

  usedPromptIds: string[];
  newPlayers: string[];
  playerIds: string[];
}

export type QuipProQuoAction =
  | { type: "submit-answer"; promptId: string; answer: string | string[] }
  | { type: "timer-expired" }
  | { type: "cast-vote"; answerId: string }
  | { type: "advance-matchup" }
  | { type: "start-next-round" }
  | { type: "play-again" };

export type QuipProQuoPlayerData = {
  experience: "experienced" | "new";
};

export type QuipProQuoPlayer = Player<QuipProQuoPlayerData>;
