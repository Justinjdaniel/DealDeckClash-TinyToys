import {
  GameState,
  WildcardCard,
  PropertyCard,
  ActionCard,
  GameAction,
} from "../../types/game";
import { restructureProperties } from "./rules";

export type BotStyle = "Aggressive" | "Defensive" | "Hoarder";

export interface CandidateMove {
  action: GameAction;
  description: string;
  cardId?: string;
  category: "PROPERTY" | "MONEY" | "ACTION" | "RENT" | "DISCARD" | "END_TURN";
}

export interface BotDecision {
  action: GameAction;
  intentReason: string;
}

/**
 * Generates all valid candidate moves for a player given current game state and hand.
 */
export const generateCandidateMoves = (
  state: GameState,
  playerId: string,
): CandidateMove[] => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  // 1. Handling discard overflow state
  if (
    state.status === "DISCARDING" &&
    state.pendingDiscardPlayerId === playerId
  ) {
    if (player.hand.length > 7) {
      const sortedHand = [...player.hand].sort((a, b) => a.value - b.value);
      const toDiscard = sortedHand.slice(0, player.hand.length - 7);
      return [
        {
          action: {
            type: "DISCARD_OVERFLOW",
            payload: { playerId, cardIds: toDiscard.map((c) => c.id) },
          },
          description: `Discard ${toDiscard.length} card(s) to meet hand limit of 7`,
          category: "DISCARD",
        },
      ];
    } else {
      return [
        {
          action: {
            type: "DISCARD_OVERFLOW",
            payload: { playerId, cardIds: [] },
          },
          description: "Clear pending discard queue",
          category: "DISCARD",
        },
      ];
    }
  }

  // 2. Check action points left
  if (state.actionPointsLeft <= 0) {
    return [
      {
        action: {
          type: "END_TURN",
          payload: { playerId },
        },
        description: "Pass turn - no action points remaining",
        category: "END_TURN",
      },
    ];
  }

  const moves: CandidateMove[] = [];
  const opponents = state.players.filter((p) => p.id !== playerId);

  for (const card of player.hand) {
    if (card.type === "Property") {
      moves.push({
        action: {
          type: "PLAY_CARD",
          payload: {
            playerId,
            cardId: card.id,
            targetZone: "properties",
          },
        },
        description: `Play property ${card.name}`,
        cardId: card.id,
        category: "PROPERTY",
      });
    } else if (card.type === "Wildcard") {
      const wildcard = card as WildcardCard;
      for (const col of wildcard.colors) {
        if (col === "Any") continue;
        moves.push({
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId,
              cardId: card.id,
              targetZone: "properties",
              options: { color: col },
            },
          },
          description: `Play wildcard ${card.name} as ${col}`,
          cardId: card.id,
          category: "PROPERTY",
        });
      }
    } else if (card.type === "Money") {
      moves.push({
        action: {
          type: "PLAY_CARD",
          payload: {
            playerId,
            cardId: card.id,
            targetZone: "bank",
          },
        },
        description: `Bank ${card.name} ($${card.value}M)`,
        cardId: card.id,
        category: "MONEY",
      });
    } else if (card.type === "Action") {
      const actionCard = card as ActionCard;

      // Banking option for action cards (excluding Just Say No)
      if (actionCard.actionType !== "Just Say No") {
        moves.push({
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId,
              cardId: card.id,
              targetZone: "bank",
            },
          },
          description: `Bank action card ${card.name} for $${card.value}M`,
          cardId: card.id,
          category: "MONEY",
        });
      }

      // Action execution options
      if (actionCard.actionType === "Pass Go") {
        moves.push({
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId,
              cardId: card.id,
              targetZone: "center",
            },
          },
          description: "Play Pass Go to draw 2 extra cards",
          cardId: card.id,
          category: "ACTION",
        });
      } else if (actionCard.actionType === "Deal Breaker") {
        for (const opp of opponents) {
          const completeSets = opp.properties.filter((s) => s.isComplete);
          for (const set of completeSets) {
            moves.push({
              action: {
                type: "PLAY_CARD",
                payload: {
                  playerId,
                  cardId: card.id,
                  targetZone: "center",
                  options: { targetColor: set.color },
                },
              },
              description: `Play Deal Breaker to steal ${set.color} set from ${opp.name}`,
              cardId: card.id,
              category: "ACTION",
            });
          }
        }
      } else if (actionCard.actionType === "Sly Deal") {
        for (const opp of opponents) {
          const incompleteSets = opp.properties.filter((s) => !s.isComplete);
          for (const set of incompleteSets) {
            for (const propCard of set.cards) {
              moves.push({
                action: {
                  type: "PLAY_CARD",
                  payload: {
                    playerId,
                    cardId: card.id,
                    targetZone: "center",
                    options: { targetCardId: propCard.id },
                  },
                },
                description: `Play Sly Deal to steal ${propCard.name} from ${opp.name}`,
                cardId: card.id,
                category: "ACTION",
              });
            }
          }
        }
      } else if (actionCard.actionType === "Forced Deal") {
        const myIncompleteSets = player.properties.filter((s) => !s.isComplete);
        const myCards = myIncompleteSets.flatMap((s) => s.cards);

        for (const opp of opponents) {
          const oppIncompleteSets = opp.properties.filter((s) => !s.isComplete);
          const oppCards = oppIncompleteSets.flatMap((s) => s.cards);

          for (const oppCard of oppCards) {
            for (const myCard of myCards) {
              moves.push({
                action: {
                  type: "PLAY_CARD",
                  payload: {
                    playerId,
                    cardId: card.id,
                    targetZone: "center",
                    options: {
                      targetCardId: oppCard.id,
                      swapCardId: myCard.id,
                    },
                  },
                },
                description: `Play Forced Deal to swap ${myCard.name} for ${oppCard.name}`,
                cardId: card.id,
                category: "ACTION",
              });
            }
          }
        }
      } else if (
        actionCard.actionType === "Debt Collector" ||
        actionCard.actionType === "Its My Birthday"
      ) {
        moves.push({
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId,
              cardId: card.id,
              targetZone: "center",
            },
          },
          description: `Play ${actionCard.actionType} to collect cash`,
          cardId: card.id,
          category: "ACTION",
        });
      } else if (
        (actionCard.actionType === "Rent" ||
          actionCard.actionType === "Multi-Rent") &&
        actionCard.rentColors
      ) {
        for (const col of actionCard.rentColors) {
          const ownedSet = player.properties.find(
            (s) => s.color === col && s.cards.length > 0,
          );
          if (ownedSet) {
            moves.push({
              action: {
                type: "PLAY_CARD",
                payload: {
                  playerId,
                  cardId: card.id,
                  targetZone: "center",
                  options: { color: col },
                },
              },
              description: `Demand rent for ${col} set`,
              cardId: card.id,
              category: "RENT",
            });
          }
        }
      }
    }
  }

  // Fallback end turn option
  moves.push({
    action: {
      type: "END_TURN",
      payload: { playerId },
    },
    description: "End turn",
    category: "END_TURN",
  });

  return moves;
};

// Generates bot strategic decisions and NLP commentary based on Bot Personality Styles
export const evaluateBotTurn = (
  state: GameState,
  botId: string,
  style: BotStyle = "Aggressive",
): BotDecision => {
  const bot = state.players.find((p) => p.id === botId);
  const player = state.players.find((p) => p.id !== botId);

  if (!bot || !player) {
    return {
      action: {
        type: "END_TURN",
        payload: { playerId: botId },
      },
      intentReason: "Decided to pass.",
    };
  }

  const getCommentary = (
    reasonKey: string,
    cardName?: string,
    details?: string,
  ): string => {
    const comments: Record<BotStyle, Record<string, string>> = {
      Aggressive: {
        play_win_set: "Yes! Completed my property set. The game is mine!",
        play_rent: `Time to pay up! Hand over those millions for my ${details || "properties"}!`,
        play_action_attack: `No holding back! Playing ${cardName} to strip your board.`,
        play_property: `Building up my board aggressively with ${cardName}.`,
        play_bank: `Depositing ${cardName} because cash is ammunition!`,
        discard: `Tossing away ${cardName} to slim down my hand.`,
        end_turn:
          "Your turn, human. Let us see if you can survive my next move.",
      },
      Defensive: {
        play_win_set:
          "Patience pays off. Secure completed property set achieved.",
        play_rent: `Collecting rent on ${details || "properties"} to maintain my bank buffer.`,
        play_action_attack: `Defensive strike! Neutralizing your board with ${cardName}.`,
        play_property: `Safely playing ${cardName} to fortify my position.`,
        play_bank: `Building bank reserves with ${cardName} against attacks.`,
        discard: `Safely discarding ${cardName} to respect hand limits.`,
        end_turn: "I am fully protected. Passing the turn.",
      },
      Hoarder: {
        play_win_set: "Mine, all mine! A glorious completed set.",
        play_rent: `More gold for the treasury! Rent due on my ${details || "domain"}!`,
        play_action_attack: `Stealing ${cardName} to add to my precious hoard.`,
        play_property: `Adding ${cardName} to my collection.`,
        play_bank: `Hoarding cash! Storing ${cardName} in the bank vaults.`,
        discard: `Parting with ${cardName} breaks my heart, but rules are rules.`,
        end_turn: "My hand is packed. Safe and sound, passing the turn.",
      },
    };

    return (
      comments[style][reasonKey] || `Decided to play ${cardName || "card"}.`
    );
  };

  const candidates = generateCandidateMoves(state, botId);

  // If candidate generation directly returned DISCARD or END_TURN override
  if (
    candidates.length === 1 &&
    (candidates[0].category === "DISCARD" ||
      candidates[0].category === "END_TURN")
  ) {
    const single = candidates[0];
    if (single.category === "DISCARD") {
      const cardIds =
        "cardIds" in single.action.payload ? single.action.payload.cardIds : [];
      const firstDiscardCard = bot.hand.find((c) => cardIds.includes(c.id));
      return {
        action: single.action,
        intentReason:
          cardIds.length > 0
            ? getCommentary("discard", firstDiscardCard?.name || "card")
            : "Clearing pending discard queue to proceed.",
      };
    } else {
      return {
        action: single.action,
        intentReason: getCommentary("end_turn"),
      };
    }
  }

  // Score candidate moves according to style weights
  let bestCandidate: CandidateMove | null = null;
  let bestScore = -Infinity;
  let bestCommentary = getCommentary("end_turn");

  for (const candidate of candidates) {
    if (candidate.category === "END_TURN") {
      const endScore = -10;
      if (endScore > bestScore) {
        bestScore = endScore;
        bestCandidate = candidate;
        bestCommentary = getCommentary("end_turn");
      }
      continue;
    }

    const payload = candidate.action.payload;
    const cardId = "cardId" in payload ? payload.cardId : undefined;
    const card = cardId ? bot.hand.find((c) => c.id === cardId) : undefined;
    let score = 0;
    let commentary = "";

    if (candidate.category === "PROPERTY" && card) {
      if (card.type === "Wildcard") {
        const wildcard = card as WildcardCard;
        const options = "options" in payload ? payload.options : undefined;
        const targetCol = options?.color;
        if (targetCol) {
          const tempProps = bot.properties.flatMap((s) => s.cards);
          const copyWildcard = { ...wildcard, currentColor: targetCol };
          const evaluatedSets = restructureProperties([
            ...tempProps,
            copyWildcard,
          ]);
          const setNowComplete = evaluatedSets.find(
            (s) => s.color === targetCol,
          )?.isComplete;
          if (setNowComplete) {
            score = 100;
            commentary = getCommentary("play_win_set", card.name);
          } else {
            score = 25;
            commentary = getCommentary("play_property", card.name);
          }
        }
      } else if (card.type === "Property") {
        const prop = card as PropertyCard;
        const existingCount =
          bot.properties.find((s) => s.color === prop.color)?.cards.length || 0;
        score = existingCount > 0 ? 40 : style === "Aggressive" ? 30 : 20;
        commentary = getCommentary("play_property", card.name);
      }
    } else if (candidate.category === "ACTION" && card) {
      const actionCard = card as ActionCard;
      if (actionCard.actionType === "Pass Go") {
        score = 80;
        commentary =
          "Playing Pass Go to draw 2 extra cards and expand my strategic options!";
      } else if (actionCard.actionType === "Deal Breaker") {
        score = style === "Aggressive" ? 95 : 85;
        commentary = getCommentary("play_action_attack", card.name);
      } else if (actionCard.actionType === "Sly Deal") {
        score = style === "Aggressive" ? 65 : 50;
        commentary = getCommentary("play_action_attack", card.name);
      } else if (actionCard.actionType === "Forced Deal") {
        score = style === "Aggressive" ? 60 : 45;
        commentary = getCommentary("play_action_attack", card.name);
      } else if (
        actionCard.actionType === "Debt Collector" ||
        actionCard.actionType === "Its My Birthday"
      ) {
        score = style === "Hoarder" ? 55 : 40;
        commentary = getCommentary("play_action_attack", card.name);
      }
    } else if (candidate.category === "RENT" && card) {
      const options = "options" in payload ? payload.options : undefined;
      const rentCol = options?.color;
      score = style === "Aggressive" ? 70 : 50;
      commentary = getCommentary("play_rent", card.name, rentCol);
    } else if (candidate.category === "MONEY" && card) {
      if (style === "Hoarder") {
        score = 55;
      } else if (bot.bank.length < 3) {
        score = 35;
      } else {
        score = 15;
      }
      commentary = getCommentary("play_bank", card.name);
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
      bestCommentary = commentary;
    }
  }

  if (bestCandidate) {
    return {
      action: bestCandidate.action,
      intentReason: bestCommentary,
    };
  }

  return {
    action: {
      type: "END_TURN",
      payload: { playerId: botId },
    },
    intentReason: getCommentary("end_turn"),
  };
};
