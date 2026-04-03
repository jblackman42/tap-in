import type { Question } from "./types";

const POINTS_PER_ROUND: Record<number, number> = {
  1: 500,
  2: 1000,
  3: 1500,
};

export function getPointsForRound(round: number): number {
  return POINTS_PER_ROUND[round] ?? 500;
}

/**
 * After all votes are in for a question, compute points for each player.
 *
 * - Fool points: for each vote your LIE received, you get `pointsPerAction`.
 * - Correct guess: if you voted for the truth, you get `pointsPerAction`.
 * - "Nobody Got It": if zero players voted for the truth, nobody gets guess pts.
 */
export function calculateQuestionPoints(
  question: Question,
  round: number,
): { pointsAwarded: Record<string, number>; nobodyGotIt: boolean } {
  const pts = getPointsForRound(round);
  const pointsAwarded: Record<string, number> = {};

  const truthAnswerId = question.answers.find((a) => a.isTruth)?.answerId;
  let truthVoters = 0;

  for (const [voterId, answerId] of Object.entries(question.votes)) {
    if (answerId === truthAnswerId) {
      pointsAwarded[voterId] = (pointsAwarded[voterId] ?? 0) + pts;
      truthVoters++;
    } else {
      const lieAnswer = question.answers.find((a) => a.answerId === answerId);
      if (lieAnswer && lieAnswer.playerIds.length > 0) {
        for (const liarId of lieAnswer.playerIds) {
          pointsAwarded[liarId] = (pointsAwarded[liarId] ?? 0) + pts;
        }
      }
    }
  }

  return {
    pointsAwarded,
    nobodyGotIt: truthVoters === 0 && Object.keys(question.votes).length > 0,
  };
}
