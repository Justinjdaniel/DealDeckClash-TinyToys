import { useState, useCallback } from 'react';
import { GameState, GameAction, Card, ActionCard } from './types/game';
import { BotStyle } from './services/bot';
import { Menu } from './components/Menu';
import { Board } from './components/Board';
import { ReactionModal } from './components/ReactionModal';
import { dispatchAction } from './services/api';
import { useFoly } from './hooks/useFoly';
import { restructureProperties } from './services/rules';

const initialGameState: GameState = {
  gameId: 'local-session',
  status: 'LOBBY',
  players: [
    {
      id: 'human',
      name: 'Boardroom Player',
      isBot: false,
      hand: [],
      bank: [],
      properties: restructureProperties([])
    },
    {
      id: 'bot',
      name: 'Rich Aunt Bot',
      isBot: true,
      hand: [],
      bank: [],
      properties: restructureProperties([])
    }
  ],
  currentPlayerIndex: 0,
  deck: [],
  discardPile: [],
  actionPointsLeft: 0,
  currentTurnActionsPerformed: 0,
  winnerId: null,
  reactionQueue: null,
  pendingDiscardPlayerId: null,
  logs: []
};

function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [botStyle, setBotStyle] = useState<BotStyle>('Aggressive');
  const { playSound } = useFoly();

  const handleStartGame = (style: BotStyle, roomCode?: string) => {
    setBotStyle(style);
    playSound('cardSweep');

    const action: GameAction = {
      type: 'START_GAME',
      payload: { roomCode, botStyle: style }
    };

    setGameState(prev => dispatchAction(prev, action));
  };

  const handleActionDispatch = useCallback((action: GameAction) => {
    setGameState(prev => dispatchAction(prev, action));
  }, []);

  const handleReactionRespond = useCallback((useJSN: boolean, jsnCardId?: string) => {
    if (useJSN) {
      playSound('jsnPlay');
    }
    handleActionDispatch({
      type: 'RESPOND_TO_ACTION',
      payload: { playerId: 'human', useJSN, jsnCardId }
    });
  }, [handleActionDispatch, playSound]);

  const handleReactionTimeout = useCallback(() => {
    handleActionDispatch({ type: 'REACTION_TIMED_OUT' });
  }, [handleActionDispatch]);

  const humanPlayer = gameState.players.find(p => p.id === 'human');
  const humanJSNCard: Card | null = humanPlayer ? humanPlayer.hand.find(c => c.type === 'Action' && (c as ActionCard).actionType === 'Just Say No') || null : null;

  return (
    <div className="relative">
      {gameState.status === 'LOBBY' ? (
        <Menu onStartGame={handleStartGame} />
      ) : (
        <Board
          state={gameState}
          onDispatch={handleActionDispatch}
          botStyle={botStyle}
          playSound={playSound}
        />
      )}

      {/* JSN HIGH-PRIORITY COUNTDOWN REACTION OVERLAY */}
      {gameState.reactionQueue && gameState.reactionQueue.targetPlayerId === 'human' && (
        <ReactionModal
          reaction={gameState.reactionQueue}
          onReact={handleReactionRespond}
          onTimeout={handleReactionTimeout}
          jsnCard={humanJSNCard}
          playSound={playSound}
        />
      )}
    </div>
  );
}

export default App;
