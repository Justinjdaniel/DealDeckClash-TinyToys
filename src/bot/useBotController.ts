import { useState, useEffect, useRef } from "react";
import { GameState, GameAction, ActionCard } from "../types/game";
import {
  BotStyle,
  BotDecision,
  evaluateBotTurnWithBrain,
  TRAINED_BOT_MODELS,
} from "./botBrain";
import {
  findJSNInHand,
  getPlayerPropertyCards,
} from "../features/game-engine/rules";

interface UseBotControllerProps {
  state: GameState;
  onDispatch: (action: GameAction) => boolean;
  botStyle?: BotStyle;
  playSound?: (sound: string) => void;
  delayMs?: number;
  randomSource?: () => number;
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
  randomSource,
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
  const randomRef = useRef(randomSource);

  // Assign refs directly during render body
  stateRef.current = state;
  onDispatchRef.current = onDispatch;
  playSoundRef.current = playSound;
  randomRef.current = randomSource;

  const bot = (state.players || []).find((p) => p?.isBot);
  const activePlayer = state.players?.[state.currentPlayerIndex];
  const isBotTurn = activePlayer ? activePlayer.id === bot?.id : false;
  const hasReactionQueue = !!state.reactionQueue;
  const actionPointsLeft = state.actionPointsLeft;
  const status = state.status;
  const botId = bot?.id;
  const handLength = bot?.hand?.length || 0;
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
      const currentBot = (currentState.players || []).find(
        (p) => p?.id === botId,
      );
      const victim = (currentState.players || []).find((p) => p?.id !== botId);

      if (!currentBot) return;

      let decision = evaluateBotTurnWithBrain(currentState, botId, botStyle);

      // Effect Lock Preventer: Validate targeted property card actions
      const victimProps = getPlayerPropertyCards(victim);
      const victimHasProperties = victimProps.length > 0;

      if (decision.action.type === "PLAY_CARD") {
        const { cardId, targetZone } = decision.action.payload;
        if (targetZone === "center") {
          const playedCard = (currentBot.hand || []).find(
            (c) => c?.id === cardId,
          );
          if (playedCard && playedCard.type === "Action") {
            const actionType = (playedCard as ActionCard).actionType;
            if (
              (actionType === "Sly Deal" || actionType === "Forced Deal") &&
              !victimHasProperties
            ) {
              // Fallback to banking cash or passing turn
              decision = {
                action: {
                  type: "PLAY_CARD",
                  payload: {
                    playerId: botId,
                    cardId: playedCard.id,
                    targetZone: "bank",
                  },
                },
                intentReason: `Banking ${playedCard.name} because victim has no targetable properties.`,
                weight: 50,
                tacticalExplanation: `Redirecting ${playedCard.name} to bank vault.`,
              };
            }
          }
        }
      }

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
      setIsBotThinking(false);
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
    if (!rx || rx.targetPlayerId !== botId || !botId) return;

    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      const currentBot = (stateRef.current.players || []).find(
        (p) => p?.id === botId,
      );
      if (!currentBot) return;

      const jsn = findJSNInHand(currentBot);
      const defenseRate = TRAINED_BOT_MODELS[botStyle]?.JSN_DEFENSE_RATE ?? 0.8;
      const randomVal = randomRef.current ? randomRef.current() : Math.random();

      if (jsn && randomVal < defenseRate) {
        playSoundRef.current?.("jsnPlay");
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: botId, useJSN: true, jsnCardId: jsn.id },
        });
      } else {
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: botId, useJSN: false },
        });
      }
    }, 1000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [state.reactionQueue, botId, botStyle]);

  return {
    botDecision,
    botCommentary,
    botWeight,
    tacticalExplanation,
    isBotThinking,
  };
};
