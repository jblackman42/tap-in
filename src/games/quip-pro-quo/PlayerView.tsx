"use client";

import { useState } from "react";
import type { PlayerViewProps } from "@/lib/engine/types";
import type { QuipProQuoState, QuipProQuoAction } from "./types";
import { WritingPhase } from "./components/WritingPhase";
import { ThriplashWriting } from "./components/ThriplashWriting";
import { WaitingScreen } from "./components/WaitingScreen";
import { VotingPhase } from "./components/VotingPhase";
import { RevealPhase } from "./components/RevealPhase";
import { RoundSummary } from "./components/RoundSummary";
import { FinalScores } from "./components/FinalScores";
import { NewPlayerGuide } from "./components/NewPlayerGuide";

export function QuipProQuoPlayerView({
  state,
  playerId,
  players,
  dispatch,
  onReturnToLobby,
}: PlayerViewProps<QuipProQuoState, QuipProQuoAction>) {
  const [guideDismissed, setGuideDismissed] = useState(false);
  const isNewPlayer = state.newPlayers.includes(playerId);
  const showGuide = isNewPlayer && state.round === 1 && state.phase === "writing" && !guideDismissed;

  const isHost = players.find((p) => p.id === playerId)?.isHost ?? false;

  if (state.phase === "final-scores") {
    return (
      <FinalScores
        state={state}
        players={players}
        playerId={playerId}
        isHost={isHost}
        onPlayAgain={() => onReturnToLobby?.()}
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
    const matchup = state.matchups[state.currentMatchupIndex];

    if (!matchup) return null;

    if (matchup.phase === "reveal") {
      return (
        <RevealPhase
          matchup={matchup}
          matchupIndex={state.currentMatchupIndex}
          totalMatchups={state.matchups.length}
          round={state.round}
          players={players}
          playerId={playerId}
          isHost={isHost}
          scores={state.scores}
          onAdvance={() => dispatch({ type: "advance-matchup" })}
        />
      );
    }

    return (
      <VotingPhase
        matchup={matchup}
        matchupIndex={state.currentMatchupIndex}
        totalMatchups={state.matchups.length}
        round={state.round}
        playerId={playerId}
        timerEndsAt={state.timerEndsAt}
        isHost={isHost}
        onVote={(answerId) => dispatch({ type: "cast-vote", answerId })}
        onTimerExpired={() => dispatch({ type: "timer-expired" })}
      />
    );
  }

  if (state.phase === "writing") {
    const myAssignments = state.promptAssignments[playerId] ?? [];
    const myAnswers = state.answers[playerId] ?? {};
    const hasSubmittedAll = state.playersSubmitted.includes(playerId);

    if (hasSubmittedAll) {
      return (
        <WaitingScreen
          playersSubmitted={state.playersSubmitted.length}
          totalPlayers={state.playerIds.length}
        />
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {showGuide && (
          <NewPlayerGuide onDismiss={() => setGuideDismissed(true)} />
        )}

        {state.round === 3 ? (
          <ThriplashWriting
            assignment={myAssignments[0]}
            timerEndsAt={state.timerEndsAt}
            isHost={isHost}
            onSubmit={(answers) =>
              dispatch({
                type: "submit-answer",
                promptId: myAssignments[0].promptId,
                answer: answers,
              })
            }
            onTimerExpired={() => dispatch({ type: "timer-expired" })}
          />
        ) : (
          <WritingPhase
            assignments={myAssignments}
            answers={myAnswers}
            round={state.round}
            timerEndsAt={state.timerEndsAt}
            isHost={isHost}
            onSubmit={(promptId, answer) =>
              dispatch({ type: "submit-answer", promptId, answer })
            }
            onTimerExpired={() => dispatch({ type: "timer-expired" })}
          />
        )}
      </div>
    );
  }

  return null;
}
