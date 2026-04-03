"use client";

import { useCallback } from "react";
import type { PlayerViewProps } from "@/lib/engine/types";
import type { FibOrFableState, FibOrFableAction } from "./types";
import { WritingPhase } from "./components/WritingPhase";
import { WaitingScreen } from "./components/WaitingScreen";
import { VotingPhase } from "./components/VotingPhase";
import { RevealPhase } from "./components/RevealPhase";
import { RoundSummary } from "./components/RoundSummary";
import { FinalScores } from "./components/FinalScores";
import { TimerBar } from "./components/TimerBar";

export function FibOrFablePlayerView({
  state,
  playerId,
  players,
  dispatch,
  onReturnToLobby,
}: PlayerViewProps<FibOrFableState, FibOrFableAction>) {
  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false;

  const handleTimerExpired = useCallback(
    () => dispatch({ type: "timer-expired" }),
    [dispatch],
  );

  if (state.phase === "final-scores") {
    return (
      <FinalScores
        state={state}
        players={players}
        playerId={playerId}
        isHost={isHost}
        onPlayAgain={() => onReturnToLobby?.()}
        onVotePlayAgain={() => dispatch({ type: "vote-play-again" })}
      />
    );
  }

  if (state.phase === "round-summary") {
    return (
      <RoundSummary
        state={state}
        players={players}
        playerId={playerId}
        isHost={isHost}
        onStartNextRound={() => dispatch({ type: "start-next-round" })}
      />
    );
  }

  if (state.phase === "voting") {
    const question = state.questions[state.currentQuestionIndex];
    if (!question) return null;

    if (question.phase === "reveal") {
      return (
        <RevealPhase
          question={question}
          questionIndex={state.currentQuestionIndex}
          totalQuestions={state.questions.length}
          round={state.round}
          totalRounds={state.totalRounds}
          players={players}
          playerId={playerId}
          isHost={isHost}
          scores={state.scores}
          onAdvance={() => dispatch({ type: "advance-question" })}
        />
      );
    }

    return (
      <VotingPhase
        question={question}
        questionIndex={state.currentQuestionIndex}
        totalQuestions={state.questions.length}
        round={state.round}
        playerId={playerId}
        timerEndsAt={state.timerEndsAt}
        isHost={isHost}
        onVote={(answerId) => dispatch({ type: "cast-vote", answerId })}
        onTimerExpired={handleTimerExpired}
      />
    );
  }

  if (state.phase === "writing") {
    const hasSubmitted = state.playersSubmitted.includes(playerId);

    const myLies: Record<string, string> = {};
    for (const q of state.questions) {
      if (q.lies[playerId] != null) {
        myLies[q.id] = q.lies[playerId];
      }
    }

    const myRejection = state.rejections?.[playerId] ?? null;

    return (
      <div className="flex-1 flex flex-col px-1 pt-4">
        <TimerBar
          timerEndsAt={state.timerEndsAt}
          isHost={isHost}
          onTimerExpired={handleTimerExpired}
        />
        {hasSubmitted ? (
          <WaitingScreen
            playersSubmitted={state.playersSubmitted.length}
            totalPlayers={state.playerIds.length}
          />
        ) : (
          <WritingPhase
            questions={state.questions}
            lies={myLies}
            rejection={myRejection}
            round={state.round}
            onSubmit={(questionId, answer) =>
              dispatch({ type: "submit-lie", questionId, answer })
            }
          />
        )}
      </div>
    );
  }

  return null;
}
