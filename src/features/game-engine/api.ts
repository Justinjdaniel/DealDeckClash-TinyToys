import {
  GameState,
  GameAction,
  PlayerState,
  Card,
  WildcardCard,
  ActionCard,
  ReactionState,
  PropertyCard,
  CustomGameRules,
} from "../../types/game";
import { createDeck, shuffleDeck } from "./deck";
import {
  restructureProperties,
  checkWinCondition,
  calculateRent,
  DEFAULT_CUSTOM_RULES,
} from "./rules";

// Simulate a slow asynchronous network API layer for future WebSockets
export const mockDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper for finding smallest bank card combination covering debt using Dynamic Programming
function findSmallestCombination(cards: Card[], target: number): Card[] {
  const totalSum = cards.reduce((sum, c) => sum + c.value, 0);
  if (totalSum <= target) {
    return [...cards];
  }

  // dp[s] stores the subset of cards achieving sum s
  const dp: (Card[] | null)[] = new Array(totalSum + 1).fill(null);
  dp[0] = [];

  for (const card of cards) {
    const val = card.value;
    for (let s = totalSum; s >= val; s--) {
      const prev = dp[s - val];
      if (prev !== null) {
        const candidate = [...prev, card];
        const current = dp[s];
        if (current === null || candidate.length < current.length) {
          dp[s] = candidate;
        }
      }
    }
  }

  let bestSum = totalSum;
  let bestSubset = [...cards];

  for (let s = target; s <= totalSum; s++) {
    const subset = dp[s];
    if (subset !== null) {
      if (s < bestSum || (s === bestSum && subset.length < bestSubset.length)) {
        bestSum = s;
        bestSubset = subset;
      }
    }
  }

  return bestSubset;
}

// Helper to advance the turn and deal cards
const advanceTurn = (nextState: GameState, logMsg: (msg: string) => void) => {
  nextState.currentPlayerIndex =
    (nextState.currentPlayerIndex + 1) % nextState.players.length;
  const nextPlayer = nextState.players[nextState.currentPlayerIndex];

  const drawCount = nextPlayer.hand.length === 0 ? 5 : 2;
  if (nextState.deck.length < drawCount) {
    nextState.deck = shuffleDeck([...nextState.deck, ...nextState.discardPile]);
    nextState.discardPile = [];
  }
  const drawn = nextState.deck.splice(0, drawCount);
  nextPlayer.hand.push(...drawn);

  const rules = nextState.customRules || DEFAULT_CUSTOM_RULES;
  nextState.actionPointsLeft = rules.actionLimitPerTurn;

  logMsg(`Turn starts for ${nextPlayer.name}. Draws ${drawCount} cards.`);
};

// Pure guard helper to check if an action can be legally dispatched
export const canDispatch = (state: GameState, action: GameAction): boolean => {
  const rules = state.customRules || DEFAULT_CUSTOM_RULES;

  switch (action.type) {
    case "START_GAME":
    case "RESET_GAME":
      return true;

    case "PLAY_CARD": {
      const { playerId, cardId, targetZone, options } = action.payload;
      if (state.status !== "PLAYING" || state.actionPointsLeft <= 0)
        return false;

      const currentPlayer = state.players[state.currentPlayerIndex];
      if (playerId !== currentPlayer.id) return false;

      const player = state.players.find((p) => p.id === playerId);
      if (!player) return false;

      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return false;

      if (targetZone === "bank") {
        return card.type === "Money" || card.type === "Action";
      }

      if (targetZone === "properties") {
        if (card.type === "Property") return true;
        if (card.type === "Wildcard") {
          if (!rules.allowWildcards) return false;
          const wild = card as WildcardCard;
          const selectedColor = options?.color || wild.colors[0];
          return (
            wild.colors.includes(selectedColor) || wild.colors.includes("Any")
          );
        }
        return false;
      }

      if (targetZone === "center") {
        if (card.type !== "Action") return false;
        const actionCard = card as ActionCard;

        if (actionCard.actionType === "Sly Deal") {
          return !!options?.targetCardId;
        }
        if (actionCard.actionType === "Forced Deal") {
          if (!rules.allowForcedDeals) return false;
          return !!options?.targetCardId && !!options?.swapCardId;
        }
        if (actionCard.actionType === "Deal Breaker") {
          if (!rules.allowDealBreakers) return false;
          return !!options?.targetColor;
        }
        if (actionCard.actionType === "Rent") {
          if (!rules.allowRentCollection) return false;
          return !!options?.color;
        }
        if (actionCard.actionType === "Multi-Rent") {
          if (!rules.allowRentCollection) return false;
          return !!options?.color;
        }
        return true;
      }

      return false;
    }

    case "TOGGLE_WILDCARD_COLOR": {
      if (!rules.allowWildcards) return false;
      const { playerId, cardId, color } = action.payload;
      if (state.status !== "PLAYING") return false;

      const activePlayer = state.players[state.currentPlayerIndex];
      if (playerId !== activePlayer.id) return false;

      const player = state.players.find((p) => p.id === playerId);
      if (!player) return false;

      const allProps = player.properties.flatMap((set) => set.cards);
      const card = allProps.find((c) => c.id === cardId);
      if (card && card.type === "Wildcard") {
        const wildcard = card as WildcardCard;
        return (
          wildcard.colors.includes(color) || wildcard.colors.includes("Any")
        );
      }
      return false;
    }

    case "RESPOND_TO_ACTION": {
      const { playerId, useJSN, jsnCardId } = action.payload;
      const rx = state.reactionQueue;
      if (!rx || rx.targetPlayerId !== playerId) return false;

      if (useJSN && jsnCardId) {
        const responder = state.players.find((p) => p.id === playerId);
        if (!responder) return false;
        const jsnCard = responder.hand.find((c) => c.id === jsnCardId);
        return (
          !!jsnCard &&
          jsnCard.type === "Action" &&
          (jsnCard as ActionCard).actionType === "Just Say No"
        );
      }
      return true;
    }

    case "REACTION_TIMED_OUT":
      return !!state.reactionQueue;

    case "DISCARD_OVERFLOW": {
      const { playerId } = action.payload;
      return (
        state.status === "DISCARDING" &&
        state.pendingDiscardPlayerId === playerId
      );
    }

    case "END_TURN": {
      const { playerId } = action.payload;
      if (state.status !== "PLAYING") return false;
      const activePlayer = state.players[state.currentPlayerIndex];
      return playerId === activePlayer.id;
    }

    default:
      return false;
  }
};

// Action dispatcher system that serves as our pure state transition engine
export const dispatchAction = (
  state: GameState,
  action: GameAction,
): GameState & { accepted?: boolean } => {
  const nextState = structuredClone(state) as GameState;
  const logs = nextState.logs;
  let accepted = false;

  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (logs.length > 100) {
      logs.splice(100);
    }
  };

  const activeRules: CustomGameRules =
    nextState.customRules || DEFAULT_CUSTOM_RULES;

  switch (action.type) {
    case "START_GAME": {
      logMsg("Game starting vs Smart AI Opponent.");
      nextState.status = "PLAYING";
      nextState.roomCode = action.payload.roomCode || "LOBBY";
      nextState.customRules =
        action.payload.customRules || DEFAULT_CUSTOM_RULES;

      const rules = nextState.customRules;

      // Build and shuffle deck
      let freshDeck = shuffleDeck(createDeck());

      // Filter out disabled card categories if specified in custom rules
      if (!rules.allowWildcards) {
        freshDeck = freshDeck.filter((c) => c.type !== "Wildcard");
      }
      if (!rules.allowDealBreakers) {
        freshDeck = freshDeck.filter(
          (c) =>
            !(
              c.type === "Action" &&
              (c as ActionCard).actionType === "Deal Breaker"
            ),
        );
      }
      if (!rules.allowForcedDeals) {
        freshDeck = freshDeck.filter(
          (c) =>
            !(
              c.type === "Action" &&
              (c as ActionCard).actionType === "Forced Deal"
            ),
        );
      }
      if (!rules.allowRentCollection) {
        freshDeck = freshDeck.filter(
          (c) =>
            !(
              c.type === "Action" &&
              ((c as ActionCard).actionType === "Rent" ||
                (c as ActionCard).actionType === "Multi-Rent")
            ),
        );
      }

      const initHandSize = rules.initialHandSize || 5;

      // Deal initial hand size to each player
      nextState.players.forEach((p) => {
        p.hand = freshDeck.splice(0, initHandSize);
        p.bank = [];
        p.properties = restructureProperties([]);
        logMsg(`${p.name} dealt ${initHandSize} cards.`);
      });

      // Draw 2 cards for the starting player
      const startPlayer = nextState.players[0];
      startPlayer.hand.push(...freshDeck.splice(0, 2));
      logMsg(`${startPlayer.name} draws 2 cards to begin.`);

      nextState.deck = freshDeck;
      nextState.discardPile = [];
      nextState.currentPlayerIndex = 0;
      nextState.actionPointsLeft = rules.actionLimitPerTurn;
      nextState.winnerId = null;
      nextState.reactionQueue = null;
      nextState.pendingDiscardPlayerId = null;
      accepted = true;
      break;
    }

    case "RESET_GAME": {
      logMsg("Resetting game state to Lobby.");
      nextState.status = "LOBBY";
      nextState.players.forEach((p) => {
        p.hand = [];
        p.bank = [];
        p.properties = restructureProperties([]);
      });
      nextState.deck = [];
      nextState.discardPile = [];
      nextState.currentPlayerIndex = 0;
      nextState.actionPointsLeft = 0;
      nextState.winnerId = null;
      nextState.reactionQueue = null;
      nextState.pendingDiscardPlayerId = null;
      accepted = true;
      break;
    }

    case "PLAY_CARD": {
      const { playerId, cardId, targetZone, options } = action.payload;
      if (nextState.status !== "PLAYING" || nextState.actionPointsLeft <= 0)
        break;

      const currentPlayer = nextState.players[nextState.currentPlayerIndex];
      if (playerId !== currentPlayer.id) break;

      const player = nextState.players.find((p) => p.id === playerId);
      if (!player) break;

      const cardIdx = player.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) break;

      const card = player.hand[cardIdx];

      if (targetZone === "bank") {
        if (card.type !== "Money" && card.type !== "Action") break;
        player.hand.splice(cardIdx, 1);
        player.bank.push(card);
        nextState.actionPointsLeft--;
        logMsg(`${player.name} banked ${card.name} (Value: ${card.value}M).`);
        accepted = true;
      } else if (targetZone === "properties") {
        if (card.type === "Property") {
          player.hand.splice(cardIdx, 1);
          const allProperties = player.properties.flatMap((set) => set.cards);
          allProperties.push(card as PropertyCard);
          player.properties = restructureProperties(allProperties);
          nextState.actionPointsLeft--;
          logMsg(
            `${player.name} added ${card.name} to their ${card.color} properties.`,
          );
          accepted = true;
        } else if (card.type === "Wildcard") {
          if (!activeRules.allowWildcards) break;
          const wild = card as WildcardCard;
          const selectedColor = options?.color || wild.colors[0];
          if (
            !wild.colors.includes(selectedColor) &&
            !wild.colors.includes("Any")
          )
            break;

          player.hand.splice(cardIdx, 1);
          wild.currentColor = selectedColor;

          const allProperties = player.properties.flatMap((set) => set.cards);
          allProperties.push(wild);
          player.properties = restructureProperties(allProperties);
          nextState.actionPointsLeft--;
          logMsg(`${player.name} played ${card.name} as ${selectedColor}.`);
          accepted = true;
        }
      } else if (targetZone === "center") {
        if (card.type !== "Action") break;
        const actionCard = card as ActionCard;

        if (actionCard.actionType === "Sly Deal") {
          if (!options?.targetCardId) break;
        } else if (actionCard.actionType === "Forced Deal") {
          if (
            !activeRules.allowForcedDeals ||
            !options?.targetCardId ||
            !options?.swapCardId
          )
            break;
        } else if (actionCard.actionType === "Deal Breaker") {
          if (!activeRules.allowDealBreakers || !options?.targetColor) break;
        } else if (
          actionCard.actionType === "Rent" ||
          actionCard.actionType === "Multi-Rent"
        ) {
          if (!activeRules.allowRentCollection || !options?.color) break;
        }

        player.hand.splice(cardIdx, 1);
        nextState.discardPile.unshift(actionCard);
        nextState.actionPointsLeft--;

        logMsg(`${player.name} played Action Card: ${actionCard.name}.`);
        accepted = true;

        if (actionCard.actionType === "Pass Go") {
          if (nextState.deck.length < 2) {
            const eligibleDiscards = nextState.discardPile.filter(
              (c) => c !== actionCard,
            );
            nextState.deck = shuffleDeck([
              ...nextState.deck,
              ...eligibleDiscards,
            ]);
            nextState.discardPile = [actionCard];
          }
          const drawn = nextState.deck.splice(0, 2);
          player.hand.push(...drawn);
          logMsg(`${player.name} draws 2 cards from Pass Go.`);
        } else if (actionCard.actionType === "Its My Birthday") {
          const target = nextState.players.find((p) => p.id !== playerId);
          if (target) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { amount: 2 },
              counterChain: [],
              timerSeconds: 5,
            };
            logMsg(
              `Reaction prompt queued: ${target.name} must pay 2M or JSN.`,
            );
          }
        } else if (actionCard.actionType === "Debt Collector") {
          const target = nextState.players.find((p) => p.id !== playerId);
          if (target) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { amount: 5 },
              counterChain: [],
              timerSeconds: 5,
            };
            logMsg(
              `Reaction prompt queued: ${target.name} must pay 5M or JSN.`,
            );
          }
        } else if (actionCard.actionType === "Sly Deal") {
          const target = nextState.players.find((p) => p.id !== playerId);
          const targetCardId = options?.targetCardId;
          if (target && targetCardId) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetCardId },
              counterChain: [],
              timerSeconds: 5,
            };
            logMsg(
              `Reaction prompt queued: ${target.name} must defend ${targetCardId} or allow theft.`,
            );
          }
        } else if (actionCard.actionType === "Forced Deal") {
          const target = nextState.players.find((p) => p.id !== playerId);
          const targetCardId = options?.targetCardId;
          const swapCardId = options?.swapCardId;
          if (target && targetCardId && swapCardId) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetCardId, swapCardId },
              counterChain: [],
              timerSeconds: 5,
            };
            logMsg(
              `Reaction prompt queued: ${target.name} must accept forced property swap or JSN.`,
            );
          }
        } else if (actionCard.actionType === "Deal Breaker") {
          const target = nextState.players.find((p) => p.id !== playerId);
          const targetColor = options?.targetColor;
          if (target && targetColor) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetColor },
              counterChain: [],
              timerSeconds: 5,
            };
            logMsg(
              `Reaction prompt queued: ${target.name} must defend completed ${targetColor} set or lose it.`,
            );
          }
        } else if (
          actionCard.actionType === "Rent" ||
          actionCard.actionType === "Multi-Rent"
        ) {
          const selectedColor = options?.color;
          if (selectedColor) {
            const matchingSet = player.properties.find(
              (s) => s.color === selectedColor,
            );
            const rentVal = matchingSet ? calculateRent(matchingSet) : 0;
            const target = nextState.players.find((p) => p.id !== playerId);

            if (target && rentVal > 0) {
              nextState.reactionQueue = {
                targetPlayerId: target.id,
                originalActionPlayerId: playerId,
                actionCard,
                actionDetails: { amount: rentVal, targetColor: selectedColor },
                counterChain: [],
                timerSeconds: 5,
              };
              logMsg(
                `Reaction prompt queued: ${target.name} must pay ${rentVal}M rent for ${selectedColor} properties.`,
              );
            } else {
              logMsg(
                `No property matching ${selectedColor} for rent charging.`,
              );
            }
          }
        }
      }

      // Check win condition instantly using configured sets count
      const isWinner = checkWinCondition(
        player,
        activeRules.setsRequiredToFinish,
      );
      if (isWinner) {
        nextState.status = "WINNER";
        nextState.winnerId = player.id;
        logMsg(
          `🏆 WINNER! ${player.name} has completed ${activeRules.setsRequiredToFinish} full sets and won the match!`,
        );
      }
      break;
    }

    case "TOGGLE_WILDCARD_COLOR": {
      if (!activeRules.allowWildcards) break;
      const { playerId, cardId, color } = action.payload;

      if (nextState.status !== "PLAYING") break;
      const activePlayer = nextState.players[nextState.currentPlayerIndex];
      if (playerId !== activePlayer.id) break;

      const player = nextState.players.find((p) => p.id === playerId);
      if (!player) break;

      const allProps = player.properties.flatMap((set) => set.cards);
      const card = allProps.find((c) => c.id === cardId);
      if (card && card.type === "Wildcard") {
        const wildcard = card as WildcardCard;
        if (
          wildcard.colors.includes(color) ||
          wildcard.colors.includes("Any")
        ) {
          wildcard.currentColor = color;
          player.properties = restructureProperties(allProps);
          logMsg(
            `${player.name} re-assigned wildcard ${wildcard.name} to ${color}.`,
          );
          accepted = true;

          if (checkWinCondition(player, activeRules.setsRequiredToFinish)) {
            nextState.status = "WINNER";
            nextState.winnerId = player.id;
            logMsg(
              `🏆 WINNER! ${player.name} has completed ${activeRules.setsRequiredToFinish} full sets and won!`,
            );
          }
        }
      }
      break;
    }

    case "RESPOND_TO_ACTION": {
      const { playerId, useJSN, jsnCardId, selectedCardIds } = action.payload;
      const rx = nextState.reactionQueue;
      if (!rx || rx.targetPlayerId !== playerId) break;

      const responder = nextState.players.find((p) => p.id === playerId);
      if (!responder) break;

      if (useJSN && jsnCardId) {
        const jsnIdx = responder.hand.findIndex((c) => c.id === jsnCardId);
        if (jsnIdx !== -1) {
          const jsnCard = responder.hand[jsnIdx];

          if (
            jsnCard.type === "Action" &&
            (jsnCard as ActionCard).actionType === "Just Say No"
          ) {
            responder.hand.splice(jsnIdx, 1);
            nextState.discardPile.unshift(jsnCard);

            rx.counterChain.push({ playerId, cardId: jsnCardId });
            logMsg(`🛡️ ${responder.name} counterplayed with JUST SAY NO!`);
            accepted = true;

            let alternativePlayerId: string | undefined = undefined;
            if (rx.targetPlayerId === rx.originalActionPlayerId) {
              const altPlayer = nextState.players.find(
                (p) => p.id !== rx.originalActionPlayerId,
              );
              if (altPlayer) {
                alternativePlayerId = altPlayer.id;
              }
            } else {
              alternativePlayerId = rx.originalActionPlayerId;
            }

            if (alternativePlayerId !== undefined) {
              rx.targetPlayerId = alternativePlayerId;
            }

            rx.timerSeconds = 5;
          }
        }
      } else {
        logMsg(`${responder.name} accepted the action effects / charges.`);
        resolveReaction(nextState, rx, selectedCardIds);
        nextState.reactionQueue = null;
        accepted = true;
      }
      break;
    }

    case "REACTION_TIMED_OUT": {
      const rx = nextState.reactionQueue;
      if (rx) {
        const targetPlayer = nextState.players.find(
          (p) => p.id === rx.targetPlayerId,
        );
        logMsg(
          `⏰ Timer expired. ${targetPlayer?.name || "Player"} failed to reaction-defend.`,
        );
        resolveReaction(nextState, rx);
        nextState.reactionQueue = null;
        accepted = true;
      }
      break;
    }

    case "DISCARD_OVERFLOW": {
      const { playerId, cardIds } = action.payload;
      if (
        nextState.status !== "DISCARDING" ||
        nextState.pendingDiscardPlayerId !== playerId
      )
        break;

      const player = nextState.players.find((p) => p.id === playerId);
      if (!player) break;

      cardIds.forEach((id) => {
        const idx = player.hand.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const removed = player.hand.splice(idx, 1)[0];
          nextState.discardPile.unshift(removed);
          logMsg(`${player.name} discarded ${removed.name} to discard pile.`);
        }
      });
      accepted = true;

      if (player.hand.length <= 7) {
        logMsg(`${player.name} hand is down to ${player.hand.length} cards.`);
        nextState.status = "PLAYING";
        nextState.pendingDiscardPlayerId = null;

        advanceTurn(nextState, logMsg);
      }
      break;
    }

    case "END_TURN": {
      const { playerId } = action.payload;
      if (nextState.status !== "PLAYING") break;

      const activePlayer = nextState.players[nextState.currentPlayerIndex];
      if (playerId !== activePlayer.id) break;

      const player = nextState.players.find((p) => p.id === playerId);
      if (!player) break;

      logMsg(`${player.name} ended their turn.`);
      accepted = true;

      if (player.hand.length > 7) {
        nextState.status = "DISCARDING";
        nextState.pendingDiscardPlayerId = player.id;
        logMsg(
          `⚠️ ${player.name} has ${player.hand.length} cards in hand and must discard down to 7.`,
        );
      } else {
        advanceTurn(nextState, logMsg);
      }
      break;
    }
  }

  return Object.assign(nextState, { accepted });
};

// Helper to validate payment selection against payer assets and required debt amount
const validatePaymentSelection = (
  from: PlayerState,
  cardIds: string[],
  amount: number,
): boolean => {
  if (!cardIds || cardIds.length === 0) return false;

  const distinctCardIds = Array.from(new Set(cardIds));

  const allOnTableAssets = [
    ...from.bank,
    ...from.properties.flatMap((s) => s.cards),
  ];
  const allOnTableIds = new Set(allOnTableAssets.map((c) => c.id));

  const allBelong = distinctCardIds.every((id) => allOnTableIds.has(id));
  if (!allBelong) return false;

  const selectedAssets = allOnTableAssets.filter((c) =>
    distinctCardIds.includes(c.id),
  );
  const selectedTotalValue = selectedAssets.reduce(
    (sum, c) => sum + c.value,
    0,
  );
  const totalAvailableValue = allOnTableAssets.reduce(
    (sum, c) => sum + c.value,
    0,
  );

  return (
    selectedTotalValue >= amount ||
    (totalAvailableValue < amount &&
      selectedAssets.length === allOnTableAssets.length)
  );
};

// Handle explicit card transfer when player manually selects payment cards
const transferSpecificCards = (
  from: PlayerState,
  to: PlayerState,
  cardIds: string[],
  state: GameState,
) => {
  const logs = state.logs;
  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const remainingCardIds = new Set(cardIds);

  const keptBank: Card[] = [];
  from.bank.forEach((card) => {
    if (remainingCardIds.has(card.id)) {
      remainingCardIds.delete(card.id);
      to.bank.push(card);
      logMsg(
        `Transfer: ${from.name} paid ${card.name} (${card.value}M) from Bank to ${to.name}.`,
      );
    } else {
      keptBank.push(card);
    }
  });
  from.bank = keptBank;

  if (remainingCardIds.size > 0) {
    const allProps = from.properties.flatMap((s) => s.cards);
    const keptProps: (PropertyCard | WildcardCard)[] = [];
    const forfeitedProps: (PropertyCard | WildcardCard)[] = [];

    allProps.forEach((card) => {
      if (remainingCardIds.has(card.id)) {
        remainingCardIds.delete(card.id);
        forfeitedProps.push(card);
        logMsg(
          `Transfer: ${from.name} transferred property ${card.name} (${card.value}M) to ${to.name}.`,
        );
      } else {
        keptProps.push(card);
      }
    });

    from.properties = restructureProperties(keptProps);
    if (forfeitedProps.length > 0) {
      const toProps = to.properties.flatMap((s) => s.cards);
      to.properties = restructureProperties([...toProps, ...forfeitedProps]);
    }
  }

  if (remainingCardIds.size > 0) {
    logMsg(
      `⚠️ Unmatched card IDs in payment transfer: ${Array.from(remainingCardIds).join(", ")}`,
    );
  }
};

const resolveReaction = (
  state: GameState,
  rx: ReactionState,
  selectedCardIds?: string[],
) => {
  const activeTargetId = rx.targetPlayerId;
  const originalId = rx.originalActionPlayerId;

  const target = state.players.find((p) => p.id === activeTargetId);
  const attacker = state.players.find((p) => p.id === originalId);

  if (!target || !attacker) return;

  const rules = state.customRules || DEFAULT_CUSTOM_RULES;
  const logs = state.logs;
  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const isBlocked = rx.counterChain.length % 2 !== 0;

  if (isBlocked) {
    logMsg(
      `🛡️ Action "${rx.actionCard.name}" was successfully BLOCKED by Just Say No!`,
    );
    return;
  }

  const type = rx.actionCard.actionType;

  if (type === "Debt Collector" || type === "Its My Birthday") {
    const amount = rx.actionDetails.amount || 0;
    if (
      selectedCardIds &&
      selectedCardIds.length > 0 &&
      validatePaymentSelection(target, selectedCardIds, amount)
    ) {
      transferSpecificCards(target, attacker, selectedCardIds, state);
    } else {
      transferCash(target, attacker, amount, state);
    }
  } else if (type === "Rent" || type === "Multi-Rent") {
    const amount = rx.actionDetails.amount || 0;
    logMsg(
      `Collecting ${amount}M rent from ${target.name} to ${attacker.name}.`,
    );
    if (
      selectedCardIds &&
      selectedCardIds.length > 0 &&
      validatePaymentSelection(target, selectedCardIds, amount)
    ) {
      transferSpecificCards(target, attacker, selectedCardIds, state);
    } else {
      transferCash(target, attacker, amount, state);
    }
  } else if (type === "Sly Deal") {
    const targetCardId = rx.actionDetails.targetCardId;
    if (targetCardId) {
      const allProps = target.properties.flatMap((set) => set.cards);
      const cardIdx = allProps.findIndex((c) => c.id === targetCardId);
      if (cardIdx !== -1) {
        const card = allProps[cardIdx];

        const currentSet = target.properties.find((set) =>
          set.cards.some((c) => c.id === targetCardId),
        );
        if (rules.fullSetImmunity && currentSet && currentSet.isComplete) {
          logMsg(
            `❌ Sly Deal failed: target card belongs to a completed set protected by Full Set Immunity!`,
          );
          return;
        }

        allProps.splice(cardIdx, 1);
        target.properties = restructureProperties(allProps);

        const attackerProps = attacker.properties.flatMap((set) => set.cards);
        attackerProps.push(card);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(
          `💸 Sly Deal successful! ${attacker.name} stole ${card.name} from ${target.name}.`,
        );
      }
    }
  } else if (type === "Forced Deal") {
    const targetCardId = rx.actionDetails.targetCardId;
    const swapCardId = rx.actionDetails.swapCardId;

    if (targetCardId && swapCardId) {
      const targetProps = target.properties.flatMap((set) => set.cards);
      const attackerProps = attacker.properties.flatMap((set) => set.cards);

      const tIdx = targetProps.findIndex((c) => c.id === targetCardId);
      const aIdx = attackerProps.findIndex((c) => c.id === swapCardId);

      if (tIdx !== -1 && aIdx !== -1) {
        const targetSet = target.properties.find((set) =>
          set.cards.some((c) => c.id === targetCardId),
        );
        const swapSet = attacker.properties.find((set) =>
          set.cards.some((c) => c.id === swapCardId),
        );

        if (
          rules.fullSetImmunity &&
          ((targetSet && targetSet.isComplete) ||
            (swapSet && swapSet.isComplete))
        ) {
          logMsg(
            `❌ Forced Deal failed: target property belongs to a completed set protected by Full Set Immunity!`,
          );
          return;
        }

        const tCard = targetProps.splice(tIdx, 1)[0];
        const aCard = attackerProps.splice(aIdx, 1)[0];

        attackerProps.push(tCard);
        targetProps.push(aCard);

        target.properties = restructureProperties(targetProps);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(
          `🔄 Forced Deal swap complete! ${attacker.name} received ${tCard.name}, ${target.name} received ${aCard.name}.`,
        );
      }
    }
  } else if (type === "Deal Breaker") {
    const targetColor = rx.actionDetails.targetColor;
    if (targetColor) {
      const targetSet = target.properties.find(
        (set) => set.color === targetColor,
      );
      if (targetSet && targetSet.isComplete) {
        if (rules.fullSetImmunity) {
          logMsg(
            `❌ Deal Breaker failed: target completed set is protected by Full Set Immunity!`,
          );
          return;
        }

        const stolenCards = [...targetSet.cards];

        const targetProps = target.properties
          .flatMap((set) => set.cards)
          .filter((c) => !stolenCards.some((sc) => sc.id === c.id));
        target.properties = restructureProperties(targetProps);

        const attackerProps = attacker.properties.flatMap((set) => set.cards);
        attackerProps.push(...stolenCards);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(
          `💥 Deal Breaker successful! ${attacker.name} stole the completed ${targetColor} set from ${target.name}!`,
        );
      }
    }
  }

  const attackerWins = checkWinCondition(attacker, rules.setsRequiredToFinish);
  const targetWins = checkWinCondition(target, rules.setsRequiredToFinish);

  if (attackerWins) {
    state.status = "WINNER";
    state.winnerId = attacker.id;
    logMsg(
      `🏆 WINNER! ${attacker.name} has completed ${rules.setsRequiredToFinish} full sets and won!`,
    );
  } else if (targetWins) {
    state.status = "WINNER";
    state.winnerId = target.id;
    logMsg(
      `🏆 WINNER! ${target.name} has completed ${rules.setsRequiredToFinish} full sets and won!`,
    );
  }
};

// Handle debt collection logic
const transferCash = (
  from: PlayerState,
  to: PlayerState,
  amount: number,
  state: GameState,
) => {
  const logs = state.logs;
  let remainingDebt = amount;

  const sortedBank = [...from.bank].sort((a, b) => a.value - b.value);
  const chosenToPay = findSmallestCombination(sortedBank, remainingDebt);

  const keptBank: Card[] = [];
  const chosenRemaining = [...chosenToPay];

  from.bank.forEach((card) => {
    const idx = chosenRemaining.findIndex((c) => c.id === card.id);
    if (idx !== -1) {
      chosenRemaining.splice(idx, 1);
      to.bank.push(card);
      remainingDebt -= card.value;
      logs.unshift(
        `[${new Date().toLocaleTimeString()}] Transfer: ${from.name} pays ${card.value}M from Bank to ${to.name}.`,
      );
    } else {
      keptBank.push(card);
    }
  });
  from.bank = keptBank;

  if (remainingDebt > 0) {
    const allProps = from.properties.flatMap((set) => set.cards);
    const keptProps: (PropertyCard | WildcardCard)[] = [];
    const forfeitedProps: (PropertyCard | WildcardCard)[] = [];

    allProps.forEach((card) => {
      if (remainingDebt <= 0) {
        keptProps.push(card);
      } else {
        remainingDebt -= card.value;
        forfeitedProps.push(card);
        logs.unshift(
          `[${new Date().toLocaleTimeString()}] Liquidate: ${from.name} forfeits property ${card.name} (Value: ${card.value}M) to resolve remaining debt.`,
        );
      }
    });

    if (forfeitedProps.length > 0) {
      const toProps = to.properties.flatMap((set) => set.cards);
      to.properties = restructureProperties([...toProps, ...forfeitedProps]);
    }
    from.properties = restructureProperties(keptProps);
  }

  if (remainingDebt > 0) {
    logs.unshift(
      `[${new Date().toLocaleTimeString()}] ${from.name} is completely bankrupt and has no cash or properties left to cover the remaining ${remainingDebt}M debt.`,
    );
  }
};
