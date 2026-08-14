import {
  GameState,
  WildcardCard,
  PropertyCard,
  ActionCard,
  GameAction,
} from "../../types/game";
import { restructureProperties } from "./rules";

export type BotStyle = "Aggressive" | "Defensive" | "Hoarder";

export interface BotDecision {
  action: GameAction;
  intentReason: string;
}

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

  // Helper function to generate NLP style commentary text for different styles
  const getCommentary = (
    reasonKey: string,
    cardName?: string,
    details?: string,
  ): string => {
    const comments: Record<BotStyle, Record<string, string>> = {
      Aggressive: {
        play_win_set: `Yes! Completed my property set. The game is mine!`,
        play_rent: `Time to pay up! Hand over those millions for my ${details || "properties"}!`,
        play_action_attack: `No holding back! Playing ${cardName} to strip your board.`,
        play_property: `Building up my board aggressively with ${cardName}.`,
        play_bank: `Depositing ${cardName} because cash is ammunition!`,
        discard: `Tossing away ${cardName} to slim down my hand.`,
        end_turn: `Your turn, human. Let's see if you can survive my next move.`,
      },
      Defensive: {
        play_win_set: `Slow and steady wins. Secured a perfect set!`,
        play_rent: `Collecting some modest rent to bolster my defenses.`,
        play_action_attack: `Disrupting your progress with ${cardName} before you run away with it!`,
        play_property: `Securing ${cardName} on my field for safe keeping.`,
        play_bank: `Always keep the vault full. Stashing ${cardName} in the bank.`,
        discard: `Reluctantly discarding ${cardName} to maintain hand limits.`,
        end_turn: `I am fully protected. Passing the turn.`,
      },
      Hoarder: {
        play_win_set: `Mine, all mine! A glorious completed set.`,
        play_rent: `More gold for the treasury! Rent due on my ${details || "domain"}!`,
        play_action_attack: `Stealing ${cardName} to add to my precious hoard.`,
        play_property: `Adding ${cardName} to my collection.`,
        play_bank: `Hoarding cash! Storing ${cardName} in the bank vaults.`,
        discard: `Parting with ${cardName} breaks my heart, but rules are rules.`,
        end_turn: `My hand is packed. Safe and sound, passing the turn.`,
      },
    };

    return (
      comments[style][reasonKey] || `Decided to play ${cardName || "card"}.`
    );
  };

  // 1. DISCARDING OVERFLOW STATE
  if (state.status === "DISCARDING" && state.pendingDiscardPlayerId === botId) {
    if (bot.hand.length > 7) {
      // Discard lowest-value or least useful card
      const sortedHand = [...bot.hand].sort((a, b) => a.value - b.value);
      const toDiscard = sortedHand.slice(0, bot.hand.length - 7);
      const discardIds = toDiscard.map((c) => c.id);
      return {
        action: {
          type: "DISCARD_OVERFLOW",
          payload: { playerId: botId, cardIds: discardIds },
        },
        intentReason: getCommentary("discard", toDiscard[0].name),
      };
    } else {
      // Always return a DISCARD_OVERFLOW action with an empty cardIds payload when no overflow cards exist
      return {
        action: {
          type: "DISCARD_OVERFLOW",
          payload: { playerId: botId, cardIds: [] },
        },
        intentReason: "Clearing pending discard queue to proceed.",
      };
    }
  }

  // 2. CHECK IF ACTIONS LEFT
  if (state.actionPointsLeft <= 0) {
    return {
      action: {
        type: "END_TURN",
        payload: { playerId: botId },
      },
      intentReason: getCommentary("end_turn"),
    };
  }

  // 3. PRIORITY DECISION MATRIX FOR CARD PLAYS
  const hand = bot.hand;

  // Candidate evaluation - check each card in bot hand
  for (const card of hand) {
    // 3A. Can we play a property wildcard to complete a set?
    if (card.type === "Wildcard") {
      const wildcard = card as WildcardCard;
      // Evaluate which color choice is best
      for (const col of wildcard.colors) {
        if (col === "Any") continue;
        const tempProps = bot.properties.flatMap((s) => s.cards);
        const copyWildcard = { ...wildcard, currentColor: col };
        const evaluatedSets = restructureProperties([
          ...tempProps,
          copyWildcard,
        ]);
        const setNowComplete = evaluatedSets.find(
          (s) => s.color === col,
        )?.isComplete;

        if (setNowComplete) {
          return {
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "properties",
                options: { color: col },
              },
            },
            intentReason: getCommentary("play_win_set", card.name),
          };
        }
      }
    }

    // 3B. Standard properties to build toward sets
    if (card.type === "Property") {
      const prop = card as PropertyCard;
      // If we already have cards of this color, prioritize playing it
      const existingCount =
        bot.properties.find((s) => s.color === prop.color)?.cards.length || 0;
      if (existingCount > 0 || style === "Aggressive") {
        return {
          action: {
            type: "PLAY_CARD",
            payload: {
              playerId: botId,
              cardId: card.id,
              targetZone: "properties",
            },
          },
          intentReason: getCommentary("play_property", card.name),
        };
      }
    }

    // 3C. High priority action cards
    if (card.type === "Action") {
      const action = card as ActionCard;

      // Pass Go: instant utility
      if (action.actionType === "Pass Go") {
        return {
          action: {
            type: "PLAY_CARD",
            payload: { playerId: botId, cardId: card.id, targetZone: "center" },
          },
          intentReason: `Playing Pass Go to draw 2 extra cards and expand my strategic options!`,
        };
      }

      // Deal Breaker: Steal complete sets
      if (action.actionType === "Deal Breaker") {
        // Find player's completed sets
        const playerCompleteSet = player.properties.find((s) => s.isComplete);
        if (playerCompleteSet) {
          return {
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { targetColor: playerCompleteSet.color },
              },
            },
            intentReason: getCommentary("play_action_attack", card.name),
          };
        }
      }

      // Sly Deal: Steal single property
      if (action.actionType === "Sly Deal") {
        // Find player's property card not in a completed set
        const eligibleSets = player.properties.filter(
          (s) => !s.isComplete && s.cards.length > 0,
        );
        if (eligibleSets.length > 0) {
          const targetCard = eligibleSets[0].cards[0];
          return {
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { targetCardId: targetCard.id },
              },
            },
            intentReason: getCommentary("play_action_attack", card.name),
          };
        }
      }

      // Forced Deal: Swap properties
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
          return {
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
            intentReason: getCommentary("play_action_attack", card.name),
          };
        }
      }

      // Debt Collector or Birthday (cash extraction)
      if (
        action.actionType === "Debt Collector" ||
        action.actionType === "Its My Birthday"
      ) {
        return {
          action: {
            type: "PLAY_CARD",
            payload: { playerId: botId, cardId: card.id, targetZone: "center" },
          },
          intentReason: getCommentary("play_action_attack", card.name),
        };
      }

      // Rent or Multi-Rent charges merged into a single branch
      if (
        (action.actionType === "Rent" || action.actionType === "Multi-Rent") &&
        action.rentColors
      ) {
        // Choose colors we have properties in
        const validRentColors = action.rentColors.filter((col) => {
          const set = bot.properties.find((s) => s.color === col);
          return set && set.cards.length > 0;
        });
        if (validRentColors.length > 0) {
          return {
            action: {
              type: "PLAY_CARD",
              payload: {
                playerId: botId,
                cardId: card.id,
                targetZone: "center",
                options: { color: validRentColors[0] },
              },
            },
            intentReason: getCommentary(
              "play_rent",
              card.name,
              validRentColors[0],
            ),
          };
        }
      }
    }

    // 3D. Play money or cash cards directly to bank (excluding Just Say No)
    const isJSN =
      card.type === "Action" &&
      (card as ActionCard).actionType === "Just Say No";
    if (
      !isJSN &&
      (card.type === "Money" ||
        (card.type === "Action" &&
          (style === "Hoarder" || bot.bank.length < 3)))
    ) {
      return {
        action: {
          type: "PLAY_CARD",
          payload: { playerId: botId, cardId: card.id, targetZone: "bank" },
        },
        intentReason: getCommentary("play_bank", card.name),
      };
    }
  }

  // 4. FALLBACKS
  // Play remaining properties or wildcards as fallback
  const remainingProps = hand.filter(
    (c) => c.type === "Property" || c.type === "Wildcard",
  );
  if (remainingProps.length > 0) {
    const card = remainingProps[0];
    const color =
      card.type === "Wildcard" ? (card as WildcardCard).colors[0] : undefined;
    return {
      action: {
        type: "PLAY_CARD",
        payload: {
          playerId: botId,
          cardId: card.id,
          targetZone: "properties",
          options: { color },
        },
      },
      intentReason: getCommentary("play_property", card.name),
    };
  }

  // Otherwise, play whatever money/action can be banked, excluding Just Say No
  const bankables = hand.filter(
    (c) =>
      c.type === "Money" ||
      (c.type === "Action" && (c as ActionCard).actionType !== "Just Say No"),
  );
  if (bankables.length > 0) {
    const card = bankables[0];
    return {
      action: {
        type: "PLAY_CARD",
        payload: { playerId: botId, cardId: card.id, targetZone: "bank" },
      },
      intentReason: getCommentary("play_bank", card.name),
    };
  }

  // No plays left or possible, pass turn
  return {
    action: {
      type: "END_TURN",
      payload: { playerId: botId },
    },
    intentReason: getCommentary("end_turn"),
  };
};
