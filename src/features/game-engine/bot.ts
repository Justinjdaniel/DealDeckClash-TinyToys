import { GameState } from "../../types/game";
import {
  BotStyle,
  BotDecision,
  evaluateBotTurnWithBrain,
  TRAINED_BOT_MODELS,
} from "../../bot/botBrain";

export type { BotStyle, BotDecision };
export { TRAINED_BOT_MODELS, evaluateBotTurnWithBrain };

export const evaluateBotTurn = (
  state: GameState,
  botId: string,
  style: BotStyle = "Aggressive",
): BotDecision => {
  return evaluateBotTurnWithBrain(state, botId, style);
};
