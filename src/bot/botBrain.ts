import {
  GameState,
  GameAction,
  PropertyCard,
  WildcardCard,
  ActionCard,
} from "../types/game";
import {
  restructureProperties,
  calculateRent,
} from "../features/game-engine/rules";

export type BotStyle = "Aggressive" | "Defensive" | "Hoarder";

export interface BotDecision {
  action: GameAction;
  intentReason: string;
  weight: number;
  tacticalExplanation: string;
}

export interface ModelWeights {
  WINNING_SET_COMPLETION: number;
  SET_COMPLETION: number;
  DEAL_BREAKER: number;
  SLY_DEAL: number;
  FORCED_DEAL: number;
  RENT_MULTIPLIER: number;
  CASH_EXTRACTION: number;
  PASS_GO: number;
  PROPERTY_MATCH: number;
  PROPERTY_NEW: number;
  BANK_SAFETY_NEED: number;
  BANK_SAFETY_NORMAL: number;
  DISCARD_PENALTY: number;
  END_TURN_BASE: number;
}

export const TRAINED_BOT_MODELS: Record<BotStyle, ModelWeights> = {
  Aggressive: {
    WINNING_SET_COMPLETION: 1000,
    SET_COMPLETION: 600,
    DEAL_BREAKER: 500,
    SLY_DEAL: 350,
    FORCED_DEAL: 300,
    RENT_MULTIPLIER: 60,
    CASH_EXTRACTION: 250,
    PASS_GO: 220,
    PROPERTY_MATCH: 200,
    PROPERTY_NEW: 120,
    BANK_SAFETY_NEED: 150,
    BANK_SAFETY_NORMAL: 80,
    DISCARD_PENALTY: -50,
    END_TURN_BASE: 10,
  },
  Defensive: {
    WINNING_SET_COMPLETION: 1000,
    SET_COMPLETION: 550,
    DEAL_BREAKER: 400,
    SLY_DEAL: 250,
    FORCED_DEAL: 200,
    RENT_MULTIPLIER: 40,
    CASH_EXTRACTION: 180,
    PASS_GO: 200,
    PROPERTY_MATCH: 180,
    PROPERTY_NEW: 100,
    BANK_SAFETY_NEED: 350,
    BANK_SAFETY_NORMAL: 200,
    DISCARD_PENALTY: -30,
    END_TURN_BASE: 15,
  },
  Hoarder: {
    WINNING_SET_COMPLETION: 1000,
    SET_COMPLETION: 500,
    DEAL_BREAKER: 350,
    SLY_DEAL: 280,
    FORCED_DEAL: 220,
    RENT_MULTIPLIER: 50,
    CASH_EXTRACTION: 200,
    PASS_GO: 250,
    PROPERTY_MATCH: 160,
    PROPERTY_NEW: 140,
    BANK_SAFETY_NEED: 400,
    BANK_SAFETY_NORMAL: 280,
    DISCARD_PENALTY: -20,
    END_TURN_BASE: 12,
  },
};

export const evaluateBotTurnWithBrain = (
  state: GameState,
  botId: string,
  style: BotStyle = "Aggressive",
): BotDecision => {
  const weights = TRAINED_BOT_MODELS[style] || TRAINED_BOT_MODELS.Aggressive;
  const bot = state.players.find((p) => p.id === botId);
  const player = state.players.find((p) => p.id !== botId);

  if (!bot || !player) {
    return {
      action: {
        type: "END_TURN",
        payload: { playerId: botId },
      },
      intentReason: "Passing turn.",
      weight: weights.END_TURN_BASE,
      tacticalExplanation: "Passing turn (No players found).",
    };
  }

  // 1. DISCARDING OVERFLOW STATE
  if (state.status === "DISCARDING" && state.pendingDiscardPlayerId === botId) {
    if (bot.hand.length > 7) {
      const sortedHand = [...bot.hand].sort((a, b) => a.value - b.value);
      const toDiscard = sortedHand.slice(0, bot.hand.length - 7);
      const discardIds = toDiscard.map((c) => c.id);
      const calculatedWeight = weights.DISCARD_PENALTY * toDiscard.length;
      return {
        action: {
          type: "DISCARD_OVERFLOW",
          payload: { playerId: botId, cardIds: discardIds },
        },
        intentReason: `Discarding ${toDiscard.map((c) => c.name).join(", ")} to comply with hand size limits.`,
        weight: calculatedWeight,
        tacticalExplanation: `Slimming hand by discarding lower-value cards. (Weight: ${calculatedWeight})`,
      };
    } else {
      return {
        action: {
          type: "DISCARD_OVERFLOW",
          payload: { playerId: botId, cardIds: [] },
        },
        intentReason: "Clearing discard status.",
        weight: 0,
        tacticalExplanation: "Hand size compliant. Resuming game loop.",
      };
    }
  }

  // 2. CHECK IF ACTIONS LEFT OR WRONG STATUS
  if (state.actionPointsLeft <= 0 || state.status !== "PLAYING") {
    return {
      action: {
        type: "END_TURN",
        payload: { playerId: botId },
      },
      intentReason: "No action points remaining. Ending turn.",
      weight: weights.END_TURN_BASE,
      tacticalExplanation: `Actions depleted. Passing turn. (Weight: +${weights.END_TURN_BASE})`,
    };
  }

  // Candidate move evaluator
  const candidates: {
    action: GameAction;
    intentReason: string;
    weight: number;
    tacticalExplanation: string;
  }[] = [];

  const completedSetsCount = bot.properties.filter((s) => s.isComplete).length;
  const bankTotal = bot.bank.reduce((sum, c) => sum + c.value, 0);

  // Evaluate cards in hand
  for (const card of bot.hand) {
    // A. Property Wildcards
    if (card.type === "Wildcard") {
      const wildcard = card as WildcardCard;
      for (const col of wildcard.colors) {
        if (col === "Any") continue;
        const tempProps = bot.properties.flatMap((s) => s.cards);
        const copyWildcard = { ...wildcard, currentColor: col };
        const evaluatedSets = restructureProperties([
          ...tempProps,
          copyWildcard,
        ]);
        const matchingSet = evaluatedSets.find((s) => s.color === col);
        const setNowComplete = matchingSet?.isComplete;

        let weight = weights.PROPERTY_NEW;
        let explanation = `Playing wildcard as ${col}.`;

        if (setNowComplete) {
          if (completedSetsCount >= 2) {
            weight = weights.WINNING_SET_COMPLETION;
            explanation = `Completing winning 3rd property set in ${col}!`;
          } else {
            weight = weights.SET_COMPLETION;
            explanation = `Completing ${col} property set!`;
          }
        } else {
          const existingCount =
            bot.properties.find((s) => s.color === col)?.cards.length || 0;
          if (existingCount > 0) {
            weight = weights.PROPERTY_MATCH;
            explanation = `Extending ${col} set build.`;
          }
        }

        candidates.push({
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId: botId,
              cardId: card.id,
              targetZone: "properties",
              options: { color: col },
            },
          },
          intentReason: explanation,
          weight,
          tacticalExplanation: `${explanation} (Weight: +${weight})`,
        });
      }
    }

    // B. Standard Property Cards
    if (card.type === "Property") {
      const prop = card as PropertyCard;
      const tempProps = bot.properties.flatMap((s) => s.cards);
      const evaluatedSets = restructureProperties([...tempProps, prop]);
      const matchingSet = evaluatedSets.find((s) => s.color === prop.color);
      const setNowComplete = matchingSet?.isComplete;

      let weight = weights.PROPERTY_NEW;
      let explanation = `Building ${prop.color} property set.`;

      if (setNowComplete) {
        if (completedSetsCount >= 2) {
          weight = weights.WINNING_SET_COMPLETION;
          explanation = `Completing winning 3rd set with ${prop.name}!`;
        } else {
          weight = weights.SET_COMPLETION;
          explanation = `Completing ${prop.color} set with ${prop.name}!`;
        }
      } else {
        const existingCount =
          bot.properties.find((s) => s.color === prop.color)?.cards.length || 0;
        if (existingCount > 0) {
          weight = weights.PROPERTY_MATCH;
          explanation = `Matching ${prop.color} property to existing set.`;
        }
      }

      candidates.push({
        action: {
          type: "PLAY_CARD",
          payload: {
            playerId: botId,
            cardId: card.id,
            targetZone: "properties",
          },
        },
        intentReason: explanation,
        weight,
        tacticalExplanation: `${explanation} (Weight: +${weight})`,
      });
    }

    // C. Action Cards
    if (card.type === "Action") {
      const action = card as ActionCard;

      if (action.actionType === "Pass Go") {
        candidates.push({
          action: {
            type: "PLAY_CARD",
            payload: { playerId: botId, cardId: card.id, targetZone: "center" },
          },
          intentReason: "Playing Pass Go to draw 2 extra cards.",
          weight: weights.PASS_GO,
          tacticalExplanation: `Expanding hand size with Pass Go. (Weight: +${weights.PASS_GO})`,
        });
      }

      if (action.actionType === "Deal Breaker") {
        const playerCompleteSet = player.properties.find((s) => s.isComplete);
        if (playerCompleteSet) {
          const weight = weights.DEAL_BREAKER;
          candidates.push({
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { targetColor: playerCompleteSet.color },
              },
            },
            intentReason: `Stealing complete ${playerCompleteSet.color} set with Deal Breaker!`,
            weight,
            tacticalExplanation: `Stealing opponent's completed ${playerCompleteSet.color} set! (Weight: +${weight})`,
          });
        }
      }

      if (action.actionType === "Sly Deal") {
        const eligibleSets = player.properties.filter(
          (s) => !s.isComplete && s.cards.length > 0,
        );
        if (eligibleSets.length > 0) {
          const targetCard = eligibleSets[0].cards[0];
          const weight = weights.SLY_DEAL;
          candidates.push({
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { targetCardId: targetCard.id },
              },
            },
            intentReason: `Stealing ${targetCard.name} with Sly Deal.`,
            weight,
            tacticalExplanation: `Targeting ${targetCard.name} to weaken opponent board. (Weight: +${weight})`,
          });
        }
      }

      if (action.actionType === "Forced Deal") {
        const playerEligibleSets = player.properties.filter(
          (s) => !s.isComplete && s.cards.length > 0,
        );
        const botEligibleSets = bot.properties.filter(
          (s) => !s.isComplete && s.cards.length > 0,
        );
        if (playerEligibleSets.length > 0 && botEligibleSets.length > 0) {
          const targetCard = playerEligibleSets[0].cards[0];
          const swapCard = botEligibleSets[0].cards[0];
          const weight = weights.FORCED_DEAL;
          candidates.push({
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: {
                  targetCardId: targetCard.id,
                  swapCardId: swapCard.id,
                },
              },
            },
            intentReason: `Swapping ${swapCard.name} for ${targetCard.name}.`,
            weight,
            tacticalExplanation: `Executing property swap: ${swapCard.name} for ${targetCard.name}. (Weight: +${weight})`,
          });
        }
      }

      if (
        action.actionType === "Debt Collector" ||
        action.actionType === "Its My Birthday"
      ) {
        const weight = weights.CASH_EXTRACTION;
        candidates.push({
          action: {
            type: "PLAY_CARD",
            payload: { playerId: botId, cardId: card.id, targetZone: "center" },
          },
          intentReason: `Playing ${action.name} to extract cash from opponent.`,
          weight,
          tacticalExplanation: `Extracting cash to deplete opponent vault. (Weight: +${weight})`,
        });
      }

      if (
        (action.actionType === "Rent" || action.actionType === "Multi-Rent") &&
        action.rentColors
      ) {
        const validRentColors = action.rentColors.filter((col) => {
          const set = bot.properties.find((s) => s.color === col);
          return set && set.cards.length > 0;
        });
        if (validRentColors.length > 0) {
          const targetColor = validRentColors[0];
          const set = bot.properties.find((s) => s.color === targetColor);
          const rentVal = set ? calculateRent(set) : 1;
          const weight = Math.round(rentVal * weights.RENT_MULTIPLIER);
          candidates.push({
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { color: targetColor },
              },
            },
            intentReason: `Charging ${rentVal}M rent on ${targetColor}.`,
            weight,
            tacticalExplanation: `Charging ${rentVal}M rent for ${targetColor} properties. (Weight: +${weight})`,
          });
        }
      }
    }

    // D. Bank Cash / Money / Actions
    if (card.type === "Money") {
      const weight =
        bankTotal < 5 ? weights.BANK_SAFETY_NEED : weights.BANK_SAFETY_NORMAL;
      candidates.push({
        action: {
          type: "PLAY_CARD",
          payload: { playerId: botId, cardId: card.id, targetZone: "bank" },
        },
        intentReason: `Banking ${card.name} for financial safety.`,
        weight,
        tacticalExplanation: `Securing cash in vault to defend against Debt Collector / Rent. (Weight: +${weight})`,
      });
    } else if (
      card.type === "Action" &&
      (card as ActionCard).actionType !== "Just Say No"
    ) {
      const weight =
        bankTotal < 3
          ? weights.BANK_SAFETY_NEED - 20
          : weights.BANK_SAFETY_NORMAL - 40;
      candidates.push({
        action: {
          type: "PLAY_CARD",
          payload: { playerId: botId, cardId: card.id, targetZone: "bank" },
        },
        intentReason: `Banking ${card.name} as cash value (${card.value}M).`,
        weight,
        tacticalExplanation: `Depositing ${card.name} as ${card.value}M liquid cash. (Weight: +${weight})`,
      });
    }
  }

  // Fallback: END_TURN
  candidates.push({
    action: {
      type: "END_TURN",
      payload: { playerId: botId },
    },
    intentReason: "Passing turn to opponent.",
    weight: weights.END_TURN_BASE,
    tacticalExplanation: `Turn complete. Passing turn. (Weight: +${weights.END_TURN_BASE})`,
  });

  // Sort candidate moves by weight descending
  candidates.sort((a, b) => b.weight - a.weight);

  return candidates[0];
};
