import { useState, useCallback, useReducer } from "react";
import { GameState, GameAction, Card, ActionCard } from "./types/game";
import { BotStyle } from "./features/game-engine/bot";
import { Menu } from "./features/game-engine/Menu";
import { Board } from "./features/game-engine/Board";
import { ReactionModal } from "./features/game-engine/ReactionModal";
import { dispatchAction, canDispatch } from "./features/game-engine/api";
import { restructureProperties } from "./features/game-engine/rules";
import { AudioProvider, useGamifiedAudio } from "./features/audio/AudioContext";
import { useGamification } from "./hooks/useGamification";
import { StageWrapper } from "./components/layout/StageWrapper";
import { MobileContainer } from "./components/layout/MobileContainer";
import { FloatingPoints } from "./components/ui/FloatingPoints";
import { AchievementPopup } from "./components/ui/AchievementPopup";
import { ErrorBoundary } from "./components/ErrorBoundary";

const initialGameState: GameState = {
  gameId: "local-session",
  status: "LOBBY",
  players: [
    {
      id: "human",
      name: "Boardroom Player",
      isBot: false,
      hand: [],
      bank: [],
      properties: restructureProperties([]),
    },
    {
      id: "bot",
      name: "Rich Aunt Bot",
      isBot: true,
      hand: [],
      bank: [],
      properties: restructureProperties([]),
    },
  ],
  currentPlayerIndex: 0,
  deck: [],
  discardPile: [],
  actionPointsLeft: 0,
  currentTurnActionsPerformed: 0,
  winnerId: null,
  reactionQueue: null,
  pendingDiscardPlayerId: null,
  logs: [],
};

interface GameStageContentProps {
  gameState: GameState;
  botStyle: BotStyle;
  onStartGame: (style: BotStyle, roomCode?: string) => void;
  onActionDispatch: (action: GameAction) => boolean;
  onReactionRespond: (
    useJSN: boolean,
    jsnCardId?: string,
    selectedCardIds?: string[],
  ) => void;
  onReactionTimeout: () => void;
  gamification: ReturnType<typeof useGamification>;
}

function GameStageContent({
  gameState,
  botStyle,
  onStartGame,
  onActionDispatch,
  onReactionRespond,
  onReactionTimeout,
  gamification,
}: GameStageContentProps) {
  const {
    floatingPoints,
    recentAchievement,
    gainXP,
    unlockAchievement,
    incrementStreak,
    resetStreak,
    triggerScreenShake,
  } = gamification;

  const players = Array.isArray(gameState?.players) ? gameState.players : [];
  const humanPlayer = players.find((p) => p?.id === "human");
  const humanHand = Array.isArray(humanPlayer?.hand) ? humanPlayer.hand : [];
  const humanJSNCard: Card | null =
    humanHand.find(
      (c) =>
        c &&
        c.type === "Action" &&
        (c as ActionCard).actionType === "Just Say No",
    ) || null;

  return (
    <>
      {gameState.status === "LOBBY" ? (
        <Menu onStartGame={onStartGame} />
      ) : (
        <Board
          state={gameState}
          onDispatch={onActionDispatch}
          botStyle={botStyle}
          gainXP={gainXP}
          unlockAchievement={unlockAchievement}
          incrementStreak={incrementStreak}
          resetStreak={resetStreak}
          triggerScreenShake={triggerScreenShake}
        />
      )}

      {/* Reaction counting HUD overlay */}
      {gameState.reactionQueue &&
        gameState.reactionQueue.targetPlayerId === "human" && (
          <ReactionModal
            reaction={gameState.reactionQueue}
            onReact={onReactionRespond}
            onTimeout={onReactionTimeout}
            jsnCard={humanJSNCard}
            humanPlayer={humanPlayer}
          />
        )}

      {/* Floating flying text overlays */}
      <FloatingPoints items={floatingPoints} />

      {/* Achievements unlocks chimes */}
      <AchievementPopup achievement={recentAchievement} />
    </>
  );
}

function GameOrchestrator() {
  const [gameState, dispatch] = useReducer(dispatchAction, initialGameState);
  const [botStyle, setBotStyle] = useState<BotStyle>("Aggressive");
  const { playSound } = useGamifiedAudio();

  const gamification = useGamification(playSound);
  const { unlockAchievement } = gamification;

  const handleStartGame = (style: BotStyle, roomCode?: string) => {
    setBotStyle(style);
    playSound("cardSweep");

    const action: GameAction = {
      type: "START_GAME",
      payload: { roomCode, botStyle: style },
    };

    dispatch(action);
  };

  const handleActionDispatch = useCallback(
    (action: GameAction): boolean => {
      if (canDispatch(gameState, action)) {
        dispatch(action);
        return true;
      }
      return false;
    },
    [gameState],
  );

  const handleReactionRespond = useCallback(
    (useJSN: boolean, jsnCardId?: string, selectedCardIds?: string[]) => {
      if (useJSN) {
        playSound("jsnPlay");
        unlockAchievement("SHIELD_MASTER");
      }
      handleActionDispatch({
        type: "RESPOND_TO_ACTION",
        payload: { playerId: "human", useJSN, jsnCardId, selectedCardIds },
      });
    },
    [handleActionDispatch, playSound, unlockAchievement],
  );

  const handleReactionTimeout = useCallback(() => {
    handleActionDispatch({ type: "REACTION_TIMED_OUT" });
  }, [handleActionDispatch]);

  return (
    <StageWrapper>
      <MobileContainer screenShake={gamification.screenShake}>
        <ErrorBoundary onReset={() => dispatch({ type: "RESET_GAME" })}>
          <GameStageContent
            gameState={gameState}
            botStyle={botStyle}
            onStartGame={handleStartGame}
            onActionDispatch={handleActionDispatch}
            onReactionRespond={handleReactionRespond}
            onReactionTimeout={handleReactionTimeout}
            gamification={gamification}
          />
        </ErrorBoundary>
      </MobileContainer>
    </StageWrapper>
  );
}

function App() {
  return (
    <AudioProvider>
      <GameOrchestrator />
    </AudioProvider>
  );
}

export default App;
