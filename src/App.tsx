import { useState, useCallback, useReducer } from "react";
import { GameState, GameAction, SoundEffectType } from "./types/game";
import { BotStyle } from "./features/game-engine/bot";
import { dispatchAction, canDispatch } from "./features/game-engine/api";
import { restructureProperties } from "./features/game-engine/rules";
import { ThemeProvider } from "./context/ThemeContext";
import { AudioProvider, useGamifiedAudio } from "./features/audio/AudioContext";
import { MenuPortal } from "./components/modals/MenuPortal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { GameLayout } from "./components/layout/GameLayout";
import { useBotController } from "./bot/useBotController";

const initialGameState: GameState = {
  gameId: "local-session",
  status: "LOBBY",
  players: [
    {
      id: "human",
      name: "Player 1",
      isBot: false,
      hand: [],
      bank: [],
      properties: restructureProperties([]),
    },
    {
      id: "bot",
      name: "Smart Bot AI",
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

function GameOrchestrator() {
  const [gameState, dispatch] = useReducer(dispatchAction, initialGameState);
  const [botStyle, setBotStyle] = useState<BotStyle>("Aggressive");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { playSound } = useGamifiedAudio();

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

  useBotController({
    state: gameState,
    onDispatch: handleActionDispatch,
    botStyle,
    playSound: (sound) => playSound(sound as SoundEffectType),
  });

  const handleStartGame = (style: BotStyle) => {
    setBotStyle(style);
    playSound("cardSweep");
    dispatch({ type: "START_GAME", payload: { botStyle: style } });
  };

  const handleLeaveGame = () => {
    playSound("click");
    dispatch({ type: "RESET_GAME" });
  };

  return (
    <>
      {gameState.status === "LOBBY" ? (
        <MenuPortal
          onStartGame={handleStartGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <GameLayout
          state={gameState}
          onDispatch={handleActionDispatch}
          onLeaveGame={handleLeaveGame}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLeaveGame={handleLeaveGame}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <GameOrchestrator />
      </AudioProvider>
    </ThemeProvider>
  );
}
