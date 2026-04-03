import type { Matchup } from "./types";

const POINTS_PER_VOTE: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
};

const QUIP_PRO_QUO_BONUS = 500;

export function getPointsPerVote(round: number): number {
  return POINTS_PER_VOTE[round] ?? 100;
}

/**
 * Calculates points awarded for a matchup after voting is complete.
 * Returns a map of playerId -> points earned.
 */
export function calculateMatchupPoints(
  matchup: Matchup,
  round: number,
): Record<string, number> {
  const ppv = getPointsPerVote(round);
  const points: Record<string, number> = {};

  for (const answer of matchup.answers) {
    const voteCount = matchup.voteCounts[answer.answerId] ?? 0;
    const earned = voteCount * ppv;
    points[answer.playerId] = (points[answer.playerId] ?? 0) + earned;
  }

  if (matchup.quipProQuo) {
    const winningAnswerId = Object.entries(matchup.voteCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const winner = matchup.answers.find((a) => a.answerId === winningAnswerId);
    if (winner) {
      points[winner.playerId] = (points[winner.playerId] ?? 0) + QUIP_PRO_QUO_BONUS;
    }
  }

  return points;
}

/**
 * Determines whether a matchup qualifies for the Quip Pro Quo bonus.
 * Unanimous vote with more than 1 eligible voter.
 */
export function isQuipProQuo(matchup: Matchup): boolean {
  if (matchup.eligibleVoterIds.length <= 1) return false;

  const totalVotes = Object.values(matchup.voteCounts).reduce((a, b) => a + b, 0);
  if (totalVotes === 0) return false;

  const maxVotes = Math.max(...Object.values(matchup.voteCounts));
  return maxVotes === totalVotes;
}
