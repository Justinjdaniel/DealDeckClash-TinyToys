import { useState, useEffect, useRef } from "react";
import { GameState, GameAction } from "../types/game";
import { BotStyle, BotDecision, evaluateBotTurnWithBrain } from "./botBrain";
import { findJSNInHand } from "../features/game-engine/rules";

interface UseBotControllerProps {
  state: GameState;
  onDispatch: (action: GameAction) => boolean;
  botStyle?: BotStyle;
  playSound?: (sound: string) => void;
  delayMs?: number;
}

export interface UseBotControllerReturn {
  botDecision: BotDecision | null;
  botCommentary: string;
  botWeight?: number;
  tacticalExplanation?: string;
  isBotThinking: boolean;
}

export const useBotController = ({
  state,
  onDispatch,
  botStyle = "Aggressive",
  playSound,
  delayMs = 1200,
}: UseBotControllerProps): UseBotControllerReturn => {
  const [botDecision, setBotDecision] = useState<BotDecision | null>(null);
  const [botCommentary, setBotCommentary] = useState<string>("");
  const [botWeight, setBotWeight] = useState<number | undefined>(undefined);
  const [tacticalExplanation, setTacticalExplanation] = useState<
    string | undefined
  >(undefined);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const stateRef = useRef(state);
  const onDispatchRef = useRef(onDispatch);
  const playSoundRef = useRef(playSound);

  useEffect(() => {
    stateRef.current = state;
    onDispatchRef.current = onDispatch;
    playSoundRef.current = playSound;
  }, [state, onDispatch, playSound]);

  const bot = state.players.find((p) => p.isBot);
  const activePlayer = state.players[state.currentPlayerIndex];
  const isBotTurn = activePlayer?.id === bot?.id;
  const hasReactionQueue = !!state.reactionQueue;
  const actionPointsLeft = state.actionPointsLeft;
  const status = state.status;
  const botId = bot?.id;
  const handLength = bot?.hand.length || 0;
  const pendingDiscardPlayerId = state.pendingDiscardPlayerId;

  // Bot Turn Evaluation Loop
  useEffect(() => {
    if (!isBotTurn || !botId) return;
    if (status !== "PLAYING" && status !== "DISCARDING") return;
    if (hasReactionQueue) return;

    let active = true;
    setIsBotThinking(true);

    const effectiveDelay =
      status === "PLAYING" && actionPointsLeft <= 0 ? 500 : delayMs;

    const timer = setTimeout(() => {
      if (!active) return;
      setIsBotThinking(false);

      const currentState = stateRef.current;
      const decision = evaluateBotTurnWithBrain(currentState, botId, botStyle);

      setBotDecision(decision);
      setBotCommentary(decision.intentReason);
      setBotWeight(decision.weight);
      setTacticalExplanation(decision.tacticalExplanation);

      const action = decision.action;

      if (action.type === "PLAY_CARD") {
        playSoundRef.current?.("cardPlay");
        onDispatchRef.current(action);
      } else if (action.type === "DISCARD_OVERFLOW") {
        playSoundRef.current?.("cardSweep");
        onDispatchRef.current(action);
      } else if (action.type === "END_TURN") {
        onDispatchRef.current(action);
      }
    }, effectiveDelay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    isBotTurn,
    botId,
    status,
    actionPointsLeft,
    hasReactionQueue,
    handLength,
    pendingDiscardPlayerId,
    botStyle,
    delayMs,
  ]);

  // Bot Reaction Resolution
  useEffect(() => {
    const rx = state.reactionQueue;
    if (!rx || rx.targetPlayerId !== botId || !bot) return;

    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      const jsn = findJSNInHand(bot);
      if (jsn && Math.random() < 0.6) {
        playSoundRef.current?.("jsnPlay");
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: bot.id, useJSN: true, jsnCardId: jsn.id },
        });
      } else {
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: bot.id, useJSN: false },
        });
      }
    }, 1000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [state.reactionQueue, botId, bot]);

  return {
    botDecision,
    botCommentary,
    botWeight,
    tacticalExplanation,
    isBotThinking,
  };
};
