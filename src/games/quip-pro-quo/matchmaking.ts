import type { Prompt, PromptAssignment, Matchup, MatchupAnswer } from "./types";
import { selectPrompts } from "./prompts";

export interface RoundPairing {
  promptId: string;
  promptText: string;
  playerIds: [string, string];
}

/**
 * Generates pairings for a standard round (R1 or R2).
 * Each player receives exactly 2 prompts and is paired with 2 different opponents.
 * Uses round-robin rotation to maximize opponent diversity.
 */
export function generateStandardPairings(
  playerIds: string[],
  usedPromptIds: string[],
  previousPairings: [string, string][],
  extraPrompts: Prompt[] = [],
): { pairings: RoundPairing[]; newUsedIds: string[] } {
  const n = playerIds.length;
  const numMatchups = n;
  const prompts = selectPrompts(numMatchups, usedPromptIds, extraPrompts);

  const pairs = generatePairs(playerIds, previousPairings);

  const pairings: RoundPairing[] = pairs.slice(0, numMatchups).map((pair, i) => ({
    promptId: prompts[i].id,
    promptText: prompts[i].text,
    playerIds: pair,
  }));

  const newUsedIds = [...usedPromptIds, ...prompts.map((p) => p.id)];
  return { pairings, newUsedIds };
}

/**
 * Generates pairs using a round-robin schedule.
 * Tries to avoid recent pairings when possible.
 */
function generatePairs(
  playerIds: string[],
  previousPairings: [string, string][],
): [string, string][] {
  const n = playerIds.length;
  const recentPairSet = new Set(
    previousPairings.map(([a, b]) => [a, b].sort().join(":")),
  );

  const allPossiblePairs: [string, string][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allPossiblePairs.push([playerIds[i], playerIds[j]]);
    }
  }

  const fresh = allPossiblePairs.filter(
    ([a, b]) => !recentPairSet.has([a, b].sort().join(":")),
  );
  const stale = allPossiblePairs.filter(
    ([a, b]) => recentPairSet.has([a, b].sort().join(":")),
  );

  const pool = [...fresh.sort(() => Math.random() - 0.5), ...stale.sort(() => Math.random() - 0.5)];

  const result: [string, string][] = [];
  const usage = new Map<string, number>();
  for (const id of playerIds) usage.set(id, 0);

  for (const pair of pool) {
    const [a, b] = pair;
    if ((usage.get(a)! < 2) && (usage.get(b)! < 2)) {
      result.push(pair);
      usage.set(a, usage.get(a)! + 1);
      usage.set(b, usage.get(b)! + 1);
    }

    if (result.length >= playerIds.length) break;
  }

  if (result.length < playerIds.length) {
    for (const pair of pool) {
      if (result.includes(pair)) continue;
      result.push(pair);
      if (result.length >= playerIds.length) break;
    }
  }

  return result;
}

export interface ThriplashPairing {
  promptId: string;
  promptText: string;
  playerId: string;
}

/**
 * Generates Thriplash pairings for Round 3.
 * Each player gets 1 prompt and writes 3 answers.
 */
export function generateThriplashPairings(
  playerIds: string[],
  usedPromptIds: string[],
  extraPrompts: Prompt[] = [],
): { pairings: ThriplashPairing[]; newUsedIds: string[] } {
  const prompts = selectPrompts(playerIds.length, usedPromptIds, extraPrompts);

  const pairings: ThriplashPairing[] = playerIds.map((pid, i) => ({
    promptId: prompts[i].id,
    promptText: prompts[i].text,
    playerId: pid,
  }));

  const newUsedIds = [...usedPromptIds, ...prompts.map((p) => p.id)];
  return { pairings, newUsedIds };
}

/**
 * Builds prompt assignments from standard pairings.
 * Returns a map of playerId -> their prompt assignments.
 */
export function buildAssignmentsFromPairings(
  pairings: RoundPairing[],
): Record<string, PromptAssignment[]> {
  const assignments: Record<string, PromptAssignment[]> = {};

  for (const pairing of pairings) {
    for (const pid of pairing.playerIds) {
      if (!assignments[pid]) assignments[pid] = [];
      assignments[pid].push({
        promptId: pairing.promptId,
        promptText: pairing.promptText,
      });
    }
  }

  return assignments;
}

/**
 * Builds prompt assignments from Thriplash pairings.
 */
export function buildThriplashAssignments(
  pairings: ThriplashPairing[],
): Record<string, PromptAssignment[]> {
  const assignments: Record<string, PromptAssignment[]> = {};

  for (const pairing of pairings) {
    assignments[pairing.playerId] = [
      {
        promptId: pairing.promptId,
        promptText: pairing.promptText,
      },
    ];
  }

  return assignments;
}

/**
 * Builds matchups from standard pairings and submitted answers.
 */
export function buildMatchupsFromPairings(
  pairings: RoundPairing[],
  answers: Record<string, Record<string, string | string[]>>,
  allPlayerIds: string[],
): Matchup[] {
  return pairings.map((pairing) => {
    const matchupAnswers: MatchupAnswer[] = pairing.playerIds.map((pid) => {
      const raw = answers[pid]?.[pairing.promptId];
      const text = typeof raw === "string" ? raw : "…";
      return {
        answerId: `${pairing.promptId}-${pid}`,
        playerId: pid,
        text: text || "…",
      };
    });

    const writerIds = new Set(pairing.playerIds);
    const eligibleVoterIds = allPlayerIds.filter((id) => !writerIds.has(id));

    return {
      promptText: pairing.promptText,
      answers: matchupAnswers,
      votes: {},
      voteCounts: Object.fromEntries(matchupAnswers.map((a) => [a.answerId, 0])),
      eligibleVoterIds,
      phase: "active" as const,
      quipProQuo: false,
      isRound3: false,
      pointsAwarded: {},
    };
  });
}

/**
 * Builds matchups from Thriplash pairings and submitted answers.
 */
export function buildThriplashMatchups(
  pairings: ThriplashPairing[],
  answers: Record<string, Record<string, string | string[]>>,
  allPlayerIds: string[],
): Matchup[] {
  return pairings.map((pairing) => {
    const rawAnswers = answers[pairing.playerId]?.[pairing.promptId];
    const answerTexts = Array.isArray(rawAnswers) ? rawAnswers : ["…", "…", "…"];

    const matchupAnswers: MatchupAnswer[] = answerTexts.map((text, i) => ({
      answerId: `${pairing.promptId}-${pairing.playerId}-${i}`,
      playerId: pairing.playerId,
      text: text || "…",
    }));

    const eligibleVoterIds = allPlayerIds.filter((id) => id !== pairing.playerId);

    return {
      promptText: pairing.promptText,
      answers: matchupAnswers,
      votes: {},
      voteCounts: Object.fromEntries(matchupAnswers.map((a) => [a.answerId, 0])),
      eligibleVoterIds,
      phase: "active" as const,
      quipProQuo: false,
      isRound3: true,
      pointsAwarded: {},
    };
  });
}

/**
 * Extracts [playerA, playerB] pairs from completed pairings for history tracking.
 */
export function extractPairHistory(pairings: RoundPairing[]): [string, string][] {
  return pairings.map((p) => p.playerIds);
}
