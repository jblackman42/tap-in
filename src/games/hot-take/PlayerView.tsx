"use client";

import type { PlayerViewProps } from "@/lib/engine/types";
import type { HotTakeState, HotTakeAction } from "./index";
import { Button } from "@/components/ui/Button";

export function HotTakePlayerView({
  state,
  playerId,
  players,
  dispatch,
}: PlayerViewProps<HotTakeState, HotTakeAction>) {
  const isJudge = playerId === state.judgeId;
  const judgeName = players.find((p) => p.id === state.judgeId)?.name ?? "Judge";

  function getPlayerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  if (state.phase === "scores") {
    const sorted = Object.entries(state.scores).sort(([, a], [, b]) => b - a);
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Final Scores</h2>
        <div className="space-y-2">
          {sorted.map(([id, score], idx) => (
            <div
              key={id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                idx === 0 ? "bg-yellow-50 ring-2 ring-yellow-400" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">
                  {idx + 1}
                </span>
                <span className="font-medium text-gray-900">
                  {getPlayerName(id)}
                  {id === playerId && (
                    <span className="text-gray-400 ml-1">(you)</span>
                  )}
                </span>
              </div>
              <span className="text-xl font-bold text-violet-600">{score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Round {state.round}/{state.totalRounds}
        </span>
        <span>Judge: {isJudge ? "You" : judgeName}</span>
      </div>

      <div className="text-center py-4">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
          The take
        </p>
        <p className="text-2xl font-bold text-gray-900">
          &ldquo;{state.prompt}&rdquo;
        </p>
      </div>

      {state.phase === "voting" && !isJudge && (
        <div className="space-y-3">
          {state.votes[playerId] ? (
            <div className="text-center py-4">
              <p className="text-lg font-medium text-gray-600">
                You voted{" "}
                <span
                  className={
                    state.votes[playerId] === "hot"
                      ? "text-red-500"
                      : "text-blue-500"
                  }
                >
                  {state.votes[playerId] === "hot" ? "Hot Take" : "Cold Take"}
                </span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Waiting for other players...
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500">Is this a...</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 active:bg-red-700"
                  onClick={() => dispatch({ type: "vote", vote: "hot" })}
                >
                  Hot Take
                </Button>
                <Button
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                  onClick={() => dispatch({ type: "vote", vote: "cold" })}
                >
                  Cold Take
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {state.phase === "voting" && isJudge && (
        <div className="text-center py-4">
          <p className="text-lg font-medium text-gray-600">
            You&apos;re the judge this round
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Waiting for everyone to vote...
          </p>
        </div>
      )}

      {state.phase === "judging" && isJudge && (
        <div className="space-y-3">
          <p className="text-center text-gray-600 font-medium">
            What did the majority vote?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="bg-red-500 hover:bg-red-600 active:bg-red-700"
              onClick={() => dispatch({ type: "judge-guess", guess: "hot" })}
            >
              Hot Take
            </Button>
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
              onClick={() => dispatch({ type: "judge-guess", guess: "cold" })}
            >
              Cold Take
            </Button>
          </div>
        </div>
      )}

      {state.phase === "judging" && !isJudge && (
        <div className="text-center py-4">
          <p className="text-lg font-medium text-gray-600">
            Waiting for {judgeName} to guess...
          </p>
        </div>
      )}

      {state.phase === "reveal" && (
        <div className="space-y-4">
          <div
            className={`text-center py-4 rounded-2xl ${
              state.judgeCorrect ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <p className="text-lg font-bold">
              {state.judgeCorrect
                ? `${isJudge ? "You got" : `${judgeName} got`} it right!`
                : `${isJudge ? "You got" : `${judgeName} got`} it wrong!`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Majority voted{" "}
              <span
                className={
                  state.majorityVote === "hot"
                    ? "text-red-500 font-bold"
                    : "text-blue-500 font-bold"
                }
              >
                {state.majorityVote === "hot" ? "Hot Take" : "Cold Take"}
              </span>
              {" — "}
              {judgeName} guessed{" "}
              <span
                className={
                  state.judgeGuess === "hot"
                    ? "text-red-500 font-bold"
                    : "text-blue-500 font-bold"
                }
              >
                {state.judgeGuess === "hot" ? "Hot Take" : "Cold Take"}
              </span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Votes
            </p>
            {Object.entries(state.votes).map(([id, vote]) => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {getPlayerName(id)}
                </span>
                <span
                  className={`text-sm font-medium ${
                    vote === "hot" ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {vote === "hot" ? "Hot" : "Cold"}
                </span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => dispatch({ type: "next-round" })}
          >
            {state.round >= state.totalRounds ? "See Final Scores" : "Next Round"}
          </Button>
        </div>
      )}
    </div>
  );
}
