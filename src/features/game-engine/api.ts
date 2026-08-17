import {
  GameState,
  GameAction,
  PlayerState,
  Card,
  WildcardCard,
  ActionCard,
  ReactionState,
  PropertyCard,
  PropertySet,
} from "../../types/game";
import { createDeck, shuffleDeck } from "./deck";
import {
  restructureProperties,
  checkWinCondition,
  calculateRent,
  getPlayerBankCards,
  getPlayerPropertyCards,
} from "./rules";

// Simulate a slow asynchronous network API layer for future WebSockets
export const mockDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper for finding smallest bank card combination covering debt using Dynamic Programming
function findSmallestCombination(cards: Card[], target: number): Card[] {
  const validCards = (cards || []).filter(Boolean);
  const totalSum = validCards.reduce((sum, c) => sum + (c?.value || 0), 0);
  if (totalSum <= target) {
    return [...validCards];
  }

  // dp[s] stores the subset of cards achieving sum s
  const dp: (Card[] | null)[] = new Array(totalSum + 1).fill(null);
  dp[0] = [];

  for (const card of validCards) {
    const val = card.value || 0;
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
  let bestSubset = [...validCards];

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
  if (!Array.isArray(nextState.players) || nextState.players.length === 0)
    return;
  nextState.currentPlayerIndex =
    (nextState.currentPlayerIndex + 1) % nextState.players.length;
  const nextPlayer = nextState.players[nextState.currentPlayerIndex];
  if (!nextPlayer) return;

  const handCards = Array.isArray(nextPlayer.hand) ? nextPlayer.hand : [];
  const drawCount = handCards.length === 0 ? 5 : 2;
  if ((nextState.deck || []).length < drawCount) {
    nextState.deck = shuffleDeck([
      ...(nextState.deck || []),
      ...(nextState.discardPile || []),
    ]);
    nextState.discardPile = [];
  }
  const drawn = nextState.deck.splice(0, drawCount);
  if (!nextPlayer.hand) nextPlayer.hand = [];
  nextPlayer.hand.push(...drawn);
  nextState.actionPointsLeft = 3;

  logMsg(`Turn starts for ${nextPlayer.name}. Draws ${drawCount} cards.`);
};

// Pure guard helper to check if an action can be legally dispatched
export const canDispatch = (state: GameState, action: GameAction): boolean => {
  if (!state || !action) return false;

  switch (action.type) {
    case "START_GAME":
    case "RESET_GAME":
      return true;

    case "PLAY_CARD": {
      const { playerId, cardId, targetZone, options } = action.payload || {};
      if (state.status !== "PLAYING" || state.actionPointsLeft <= 0)
        return false;

      const players = Array.isArray(state.players) ? state.players : [];
      const currentPlayer = players[state.currentPlayerIndex];
      if (!currentPlayer || playerId !== currentPlayer.id) return false;

      const player = players.find((p) => p?.id === playerId);
      if (!player) return false;

      const hand = Array.isArray(player.hand) ? player.hand : [];
      const card = hand.find((c) => c?.id === cardId);
      if (!card) return false;

      if (targetZone === "bank") {
        return card.type === "Money" || card.type === "Action";
      }

      if (targetZone === "properties") {
        if (card.type === "Property") return true;
        if (card.type === "Wildcard") {
          const wild = card as WildcardCard;
          const selectedColor = options?.color || wild.colors?.[0];
          return (
            (wild.colors || []).includes(selectedColor) ||
            (wild.colors || []).includes("Any")
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
          return !!options?.targetCardId && !!options?.swapCardId;
        }
        if (actionCard.actionType === "Deal Breaker") {
          return !!options?.targetColor;
        }
        if (
          actionCard.actionType === "Rent" ||
          actionCard.actionType === "Multi-Rent"
        ) {
          return !!options?.color;
        }
        return true;
      }

      return false;
    }

    case "TOGGLE_WILDCARD_COLOR": {
      const { playerId, cardId, color } = action.payload || {};
      if (state.status !== "PLAYING") return false;

      const players = Array.isArray(state.players) ? state.players : [];
      const activePlayer = players[state.currentPlayerIndex];
      if (!activePlayer || playerId !== activePlayer.id) return false;

      const player = players.find((p) => p?.id === playerId);
      if (!player) return false;

      const allProps = getPlayerPropertyCards(player);
      const card = allProps.find((c) => c?.id === cardId);
      if (card && card.type === "Wildcard") {
        const wildcard = card as WildcardCard;
        return (
          (wildcard.colors || []).includes(color) ||
          (wildcard.colors || []).includes("Any")
        );
      }
      return false;
    }

    case "RESPOND_TO_ACTION": {
      const { playerId, useJSN, jsnCardId } = action.payload || {};
      const rx = state.reactionQueue;
      if (!rx || rx.targetPlayerId !== playerId) return false;

      if (useJSN && jsnCardId) {
        const players = Array.isArray(state.players) ? state.players : [];
        const responder = players.find((p) => p?.id === playerId);
        if (!responder) return false;
        const hand = Array.isArray(responder.hand) ? responder.hand : [];
        const jsnCard = hand.find((c) => c?.id === jsnCardId);
        return (
          !!jsnCard &&
          jsnCard.type === "Action" &&
          (jsnCard as ActionCard).actionType === "Just Say No"
        );
      }
      return true;
    }

    case "RESOLVE_PAYMENT": {
      const { targetPlayerId, callerPlayerId } = action.payload || {};
      if (!targetPlayerId || !callerPlayerId) return false;
      const players = Array.isArray(state.players) ? state.players : [];
      const targetPlayer = players.find((p) => p?.id === targetPlayerId);
      const callerPlayer = players.find((p) => p?.id === callerPlayerId);
      if (!targetPlayer || !callerPlayer) return false;
      return !!state.reactionQueue;
    }

    case "REACTION_TIMED_OUT":
      return !!state.reactionQueue;

    case "DISCARD_OVERFLOW": {
      const { playerId } = action.payload || {};
      return (
        state.status === "DISCARDING" &&
        state.pendingDiscardPlayerId === playerId
      );
    }

    case "END_TURN": {
      const { playerId } = action.payload || {};
      if (state.status !== "PLAYING") return false;
      const players = Array.isArray(state.players) ? state.players : [];
      const activePlayer = players[state.currentPlayerIndex];
      return activePlayer ? playerId === activePlayer.id : false;
    }

    default:
      return false;
  }
};

// Helper to validate payment selection against payer assets and required debt amount
const validatePaymentSelection = (
  from: PlayerState,
  cardIds: string[] = [],
  amount: number,
): boolean => {
  const validSelectedIds = (cardIds || []).filter(Boolean);
  const bankCards = getPlayerBankCards(from);
  const propCards = getPlayerPropertyCards(from);
  const allOnTableAssets = [...bankCards, ...propCards].filter(Boolean);

  if (allOnTableAssets.length === 0) {
    return true; // Zero-asset resolution is valid
  }

  const allOnTableIds = new Set(
    allOnTableAssets.map((c) => c.id).filter(Boolean),
  );

  // Verify all card IDs belong to payer
  const allBelong = validSelectedIds.every((id) => allOnTableIds.has(id));
  if (!allBelong) return false;

  const selectedAssets = allOnTableAssets.filter((c) =>
    validSelectedIds.includes(c.id),
  );
  const selectedTotalValue = selectedAssets.reduce(
    (sum, c) => sum + (c?.value || 0),
    0,
  );
  const totalAvailableValue = allOnTableAssets.reduce(
    (sum, c) => sum + (c?.value || 0),
    0,
  );

  return (
    selectedTotalValue >= amount ||
    (totalAvailableValue < amount &&
      validSelectedIds.length === allOnTableAssets.length)
  );
};

// Handle explicit card transfer when player manually selects payment cards
const transferSpecificCards = (
  from: PlayerState,
  to: PlayerState,
  cardIds: string[] = [],
  state: GameState,
) => {
  if (!from || !to) return;
  if (!from.bank) from.bank = [];
  if (!to.bank) to.bank = [];
  if (!from.properties) from.properties = restructureProperties([]);
  if (!to.properties) to.properties = restructureProperties([]);

  if (!state.logs) state.logs = [];
  const logs = state.logs;
  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const remainingCardIds = new Set((cardIds || []).filter(Boolean));

  // Transfer from Bank
  const keptBank: Card[] = [];
  (from.bank || []).forEach((card) => {
    if (card && remainingCardIds.has(card.id)) {
      remainingCardIds.delete(card.id);
      to.bank.push(card);
      logMsg(
        `Transfer: ${from.name} paid ${card.name} (${card.value || 0}M) from Bank to ${to.name}.`,
      );
    } else if (card) {
      keptBank.push(card);
    }
  });
  from.bank = keptBank;

  // Transfer from Properties if any IDs remain
  if (remainingCardIds.size > 0) {
    const allProps = getPlayerPropertyCards(from);
    const keptProps: (PropertyCard | WildcardCard)[] = [];
    const forfeitedProps: (PropertyCard | WildcardCard)[] = [];

    allProps.forEach((card) => {
      if (card && remainingCardIds.has(card.id)) {
        remainingCardIds.delete(card.id);
        forfeitedProps.push(card);
        logMsg(
          `Transfer: ${from.name} transferred property ${card.name} (${card.value || 0}M) to ${to.name}.`,
        );
      } else if (card) {
        keptProps.push(card);
      }
    });

    from.properties = restructureProperties(keptProps);
    if (forfeitedProps.length > 0) {
      const toProps = getPlayerPropertyCards(to);
      to.properties = restructureProperties([...toProps, ...forfeitedProps]);
    }
  }

  if (remainingCardIds.size > 0) {
    logMsg(
      `⚠️ Unmatched card IDs in payment transfer: ${Array.from(remainingCardIds).join(", ")}`,
    );
  }
};

// Internal solver to resolve effects when reaction is declined or timers run out
const resolveReaction = (
  state: GameState,
  rx: ReactionState,
  selectedCardIds?: string[],
) => {
  if (!rx) return;
  const activeTargetId = rx.targetPlayerId;
  const originalId = rx.originalActionPlayerId;

  const players = Array.isArray(state.players) ? state.players : [];
  const target = players.find((p) => p?.id === activeTargetId);
  const attacker = players.find((p) => p?.id === originalId);

  if (!target || !attacker) return;

  if (!state.logs) state.logs = [];
  const logs = state.logs;
  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const isBlocked = (rx.counterChain || []).length % 2 !== 0;

  if (isBlocked) {
    logMsg(
      `🛡️ Action "${rx.actionCard?.name || "Card"}" was successfully BLOCKED by Just Say No!`,
    );
    return;
  }

  const type = rx.actionCard?.actionType;

  if (type === "Debt Collector" || type === "Its My Birthday") {
    const amount = rx.actionDetails?.amount || 0;
    const validIds = (selectedCardIds || []).filter(Boolean);
    if (
      validIds.length > 0 &&
      validatePaymentSelection(target, validIds, amount)
    ) {
      transferSpecificCards(target, attacker, validIds, state);
    } else {
      transferCash(target, attacker, amount, state);
    }
  } else if (type === "Rent" || type === "Multi-Rent") {
    const amount = rx.actionDetails?.amount || 0;
    logMsg(
      `Collecting ${amount}M rent from ${target.name} to ${attacker.name}.`,
    );
    const validIds = (selectedCardIds || []).filter(Boolean);
    if (
      validIds.length > 0 &&
      validatePaymentSelection(target, validIds, amount)
    ) {
      transferSpecificCards(target, attacker, validIds, state);
    } else {
      transferCash(target, attacker, amount, state);
    }
  } else if (type === "Sly Deal") {
    const targetCardId = rx.actionDetails?.targetCardId;
    if (targetCardId) {
      const allProps = getPlayerPropertyCards(target);
      const cardIdx = allProps.findIndex((c) => c?.id === targetCardId);
      if (cardIdx !== -1) {
        const card = allProps[cardIdx];

        const targetSets: PropertySet[] = Array.isArray(target.properties)
          ? target.properties
          : (Object.values(target.properties || {}) as PropertySet[]);
        const currentSet = targetSets.find(
          (set) =>
            Array.isArray(set?.cards) &&
            set.cards.some((c) => c?.id === targetCardId),
        );
        if (currentSet && currentSet.isComplete) {
          logMsg(`❌ Sly Deal failed: target card belongs to a completed set!`);
          return;
        }

        allProps.splice(cardIdx, 1);
        target.properties = restructureProperties(allProps);

        const attackerProps = getPlayerPropertyCards(attacker);
        attackerProps.push(card);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(
          `💸 Sly Deal successful! ${attacker.name} stole ${card.name} from ${target.name}.`,
        );
      }
    }
  } else if (type === "Forced Deal") {
    const targetCardId = rx.actionDetails?.targetCardId;
    const swapCardId = rx.actionDetails?.swapCardId;

    if (targetCardId && swapCardId) {
      const targetProps = getPlayerPropertyCards(target);
      const attackerProps = getPlayerPropertyCards(attacker);

      const tIdx = targetProps.findIndex((c) => c?.id === targetCardId);
      const aIdx = attackerProps.findIndex((c) => c?.id === swapCardId);

      if (tIdx !== -1 && aIdx !== -1) {
        const targetSets: PropertySet[] = Array.isArray(target.properties)
          ? target.properties
          : (Object.values(target.properties || {}) as PropertySet[]);
        const targetSet = targetSets.find(
          (set) =>
            Array.isArray(set?.cards) &&
            set.cards.some((c) => c?.id === targetCardId),
        );
        if (targetSet && targetSet.isComplete) {
          logMsg(
            `❌ Forced Deal failed: target property belongs to a completed set!`,
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
    const targetColor = rx.actionDetails?.targetColor;
    if (targetColor) {
      const targetSets: PropertySet[] = Array.isArray(target.properties)
        ? target.properties
        : (Object.values(target.properties || {}) as PropertySet[]);
      const targetSet = targetSets.find((set) => set?.color === targetColor);
      if (targetSet && targetSet.isComplete && Array.isArray(targetSet.cards)) {
        const stolenCards = [...targetSet.cards];

        const targetProps = getPlayerPropertyCards(target).filter(
          (c) => !stolenCards.some((sc) => sc?.id === c?.id),
        );
        target.properties = restructureProperties(targetProps);

        const attackerProps = getPlayerPropertyCards(attacker);
        attackerProps.push(...stolenCards);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(
          `💥 Deal Breaker successful! ${attacker.name} stole the completed ${targetColor} set from ${target.name}!`,
        );
      }
    }
  }

  if (checkWinCondition(attacker)) {
    state.status = "WINNER";
    state.winnerId = attacker.id;
    logMsg(`🏆 WINNER! ${attacker.name} has completed 3 full sets and won!`);
  }
};

// Handle debt collection logic
const transferCash = (
  from: PlayerState,
  to: PlayerState,
  amount: number,
  state: GameState,
) => {
  if (!from || !to) return;
  if (!from.bank) from.bank = [];
  if (!to.bank) to.bank = [];
  if (!from.properties) from.properties = restructureProperties([]);
  if (!to.properties) to.properties = restructureProperties([]);

  if (!state.logs) state.logs = [];
  const logs = state.logs;
  let remainingDebt = amount;

  const sortedBank = [...(from.bank || [])]
    .filter(Boolean)
    .sort((a, b) => (a.value || 0) - (b.value || 0));
  const chosenToPay = findSmallestCombination(sortedBank, remainingDebt);

  const keptBank: Card[] = [];
  const chosenRemaining = [...chosenToPay];

  (from.bank || []).forEach((card) => {
    if (!card) return;
    const idx = chosenRemaining.findIndex((c) => c && c.id === card.id);
    if (idx !== -1) {
      chosenRemaining.splice(idx, 1);
      to.bank.push(card);
      remainingDebt -= card.value || 0;
      logs.unshift(
        `[${new Date().toLocaleTimeString()}] Transfer: ${from.name} pays ${card.value || 0}M from Bank to ${to.name}.`,
      );
    } else {
      keptBank.push(card);
    }
  });
  from.bank = keptBank;

  if (remainingDebt > 0) {
    const allProps = getPlayerPropertyCards(from);
    const keptProps: (PropertyCard | WildcardCard)[] = [];
    const forfeitedProps: (PropertyCard | WildcardCard)[] = [];

    allProps.forEach((card) => {
      if (!card) return;
      if (remainingDebt <= 0) {
        keptProps.push(card);
      } else {
        remainingDebt -= card.value || 0;
        forfeitedProps.push(card);
        logs.unshift(
          `[${new Date().toLocaleTimeString()}] Liquidate: ${from.name} forfeits property ${card.name} (Value: ${card.value || 0}M) to resolve remaining debt.`,
        );
      }
    });

    if (forfeitedProps.length > 0) {
      const toProps = getPlayerPropertyCards(to);
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

// Action dispatcher system that serves as our pure state transition engine
export const dispatchAction = (
  state: GameState,
  action: GameAction,
): GameState & { accepted?: boolean } => {
  const nextState = structuredClone(state) as GameState;
  if (!nextState.logs) nextState.logs = [];
  const logs = nextState.logs;
  let accepted = false;

  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (logs.length > 100) {
      logs.splice(100);
    }
  };

  switch (action.type) {
    case "START_GAME": {
      logMsg("Game starting vs Smart AI Opponent.");
      nextState.status = "PLAYING";
      nextState.roomCode = action.payload?.roomCode || "LOBBY";

      const freshDeck = shuffleDeck(createDeck());

      (nextState.players || []).forEach((p) => {
        if (!p) return;
        p.hand = freshDeck.splice(0, 5);
        p.bank = [];
        p.properties = restructureProperties([]);
        logMsg(`${p.name} dealt 5 cards.`);
      });

      const startPlayer = nextState.players?.[0];
      if (startPlayer) {
        if (!startPlayer.hand) startPlayer.hand = [];
        startPlayer.hand.push(...freshDeck.splice(0, 2));
        logMsg(`${startPlayer.name} draws 2 cards to begin.`);
      }

      nextState.deck = freshDeck;
      nextState.discardPile = [];
      nextState.currentPlayerIndex = 0;
      nextState.actionPointsLeft = 3;
      nextState.winnerId = null;
      nextState.reactionQueue = null;
      nextState.pendingDiscardPlayerId = null;
      accepted = true;
      break;
    }

    case "RESET_GAME": {
      logMsg("Resetting game state to Lobby.");
      nextState.status = "LOBBY";
      (nextState.players || []).forEach((p) => {
        if (!p) return;
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
      const { playerId, cardId, targetZone, options } = action.payload || {};
      if (nextState.status !== "PLAYING" || nextState.actionPointsLeft <= 0)
        break;

      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const currentPlayer = players[nextState.currentPlayerIndex];
      if (!currentPlayer || playerId !== currentPlayer.id) break;

      const player = players.find((p) => p?.id === playerId);
      if (!player) break;

      if (!player.hand) player.hand = [];
      const cardIdx = player.hand.findIndex((c) => c?.id === cardId);
      if (cardIdx === -1) break;

      const card = player.hand[cardIdx];

      if (targetZone === "bank") {
        if (card.type !== "Money" && card.type !== "Action") break;
        player.hand.splice(cardIdx, 1);
        if (!player.bank) player.bank = [];
        player.bank.push(card);
        nextState.actionPointsLeft--;
        logMsg(
          `${player.name} banked ${card.name} (Value: ${card.value || 0}M).`,
        );
        accepted = true;
      } else if (targetZone === "properties") {
        if (card.type === "Property") {
          player.hand.splice(cardIdx, 1);
          const allProperties = getPlayerPropertyCards(player);
          allProperties.push(card as PropertyCard);
          player.properties = restructureProperties(allProperties);
          nextState.actionPointsLeft--;
          logMsg(
            `${player.name} added ${card.name} to their ${(card as PropertyCard).color} properties.`,
          );
          accepted = true;
        } else if (card.type === "Wildcard") {
          const wild = card as WildcardCard;
          const selectedColor = options?.color || wild.colors?.[0];
          if (
            !(wild.colors || []).includes(selectedColor) &&
            !(wild.colors || []).includes("Any")
          )
            break;

          player.hand.splice(cardIdx, 1);
          wild.currentColor = selectedColor;

          const allProperties = getPlayerPropertyCards(player);
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
          if (!options?.targetCardId || !options?.swapCardId) break;
        } else if (actionCard.actionType === "Deal Breaker") {
          if (!options?.targetColor) break;
        } else if (
          actionCard.actionType === "Rent" ||
          actionCard.actionType === "Multi-Rent"
        ) {
          if (!options?.color) break;
        }

        player.hand.splice(cardIdx, 1);
        if (!nextState.discardPile) nextState.discardPile = [];
        nextState.discardPile.unshift(actionCard);
        nextState.actionPointsLeft--;

        logMsg(`${player.name} played Action Card: ${actionCard.name}.`);
        accepted = true;

        if (actionCard.actionType === "Pass Go") {
          if ((nextState.deck || []).length < 2) {
            const eligibleDiscards = (nextState.discardPile || []).filter(
              (c) => c !== actionCard,
            );
            nextState.deck = shuffleDeck([
              ...(nextState.deck || []),
              ...eligibleDiscards,
            ]);
            nextState.discardPile = [actionCard];
          }
          const drawn = nextState.deck.splice(0, 2);
          player.hand.push(...drawn);
          logMsg(`${player.name} draws 2 cards from Pass Go.`);
        } else if (actionCard.actionType === "Its My Birthday") {
          const target = players.find((p) => p?.id !== playerId);
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
          const target = players.find((p) => p?.id !== playerId);
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
          const target = players.find((p) => p?.id !== playerId);
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
          const target = players.find((p) => p?.id !== playerId);
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
          const target = players.find((p) => p?.id !== playerId);
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
            const playerSets: PropertySet[] = Array.isArray(player.properties)
              ? player.properties
              : (Object.values(player.properties || {}) as PropertySet[]);
            const matchingSet = playerSets.find(
              (s) => s?.color === selectedColor,
            );
            const rentVal = matchingSet ? calculateRent(matchingSet) : 0;
            const target = players.find((p) => p?.id !== playerId);

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

      if (checkWinCondition(player)) {
        nextState.status = "WINNER";
        nextState.winnerId = player.id;
        logMsg(
          `🏆 WINNER! ${player.name} has completed 3 full sets and won the match!`,
        );
      }
      break;
    }

    case "TOGGLE_WILDCARD_COLOR": {
      const { playerId, cardId, color } = action.payload || {};

      if (nextState.status !== "PLAYING") break;
      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const activePlayer = players[nextState.currentPlayerIndex];
      if (!activePlayer || playerId !== activePlayer.id) break;

      const player = players.find((p) => p?.id === playerId);
      if (!player) break;

      const allProps = getPlayerPropertyCards(player);
      const card = allProps.find((c) => c?.id === cardId);
      if (card && card.type === "Wildcard") {
        const wildcard = card as WildcardCard;
        if (
          (wildcard.colors || []).includes(color) ||
          (wildcard.colors || []).includes("Any")
        ) {
          wildcard.currentColor = color;
          player.properties = restructureProperties(allProps);
          logMsg(
            `${player.name} re-assigned wildcard ${wildcard.name} to ${color}.`,
          );
          accepted = true;

          if (checkWinCondition(player)) {
            nextState.status = "WINNER";
            nextState.winnerId = player.id;
            logMsg(
              `🏆 WINNER! ${player.name} has completed 3 full sets and won!`,
            );
          }
        }
      }
      break;
    }

    case "RESOLVE_PAYMENT": {
      const { targetPlayerId, callerPlayerId, selectedCardIds } =
        action.payload || {};
      if (!targetPlayerId || !callerPlayerId) break;

      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const targetPlayer = players.find((p) => p?.id === targetPlayerId);
      const callerPlayer = players.find((p) => p?.id === callerPlayerId);
      if (!targetPlayer || !callerPlayer) break;

      const validSelectedIds = (selectedCardIds || []).filter(Boolean);

      if (nextState.reactionQueue) {
        resolveReaction(nextState, nextState.reactionQueue, validSelectedIds);
        nextState.reactionQueue = null;
        accepted = true;
      } else {
        accepted = false;
      }
      break;
    }

    case "RESPOND_TO_ACTION": {
      const { playerId, useJSN, jsnCardId, selectedCardIds } =
        action.payload || {};
      const rx = nextState.reactionQueue;
      if (!rx || rx.targetPlayerId !== playerId) break;

      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const responder = players.find((p) => p?.id === playerId);
      if (!responder) break;

      if (useJSN && jsnCardId) {
        if (!responder.hand) responder.hand = [];
        const jsnIdx = responder.hand.findIndex((c) => c?.id === jsnCardId);
        if (jsnIdx !== -1) {
          const jsnCard = responder.hand[jsnIdx];

          if (
            jsnCard &&
            jsnCard.type === "Action" &&
            (jsnCard as ActionCard).actionType === "Just Say No"
          ) {
            responder.hand.splice(jsnIdx, 1);
            if (!nextState.discardPile) nextState.discardPile = [];
            nextState.discardPile.unshift(jsnCard);

            if (!rx.counterChain) rx.counterChain = [];
            rx.counterChain.push({ playerId, cardId: jsnCardId });
            logMsg(`🛡️ ${responder.name} counterplayed with JUST SAY NO!`);
            accepted = true;

            let alternativePlayerId: string | undefined = undefined;
            if (rx.targetPlayerId === rx.originalActionPlayerId) {
              const altPlayer = players.find(
                (p) => p?.id !== rx.originalActionPlayerId,
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
        resolveReaction(nextState, rx, selectedCardIds || []);
        nextState.reactionQueue = null;
        accepted = true;
      }
      break;
    }

    case "REACTION_TIMED_OUT": {
      const rx = nextState.reactionQueue;
      if (rx) {
        const players = Array.isArray(nextState.players)
          ? nextState.players
          : [];
        const targetPlayer = players.find((p) => p?.id === rx.targetPlayerId);
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
      const { playerId, cardIds } = action.payload || {};
      if (
        nextState.status !== "DISCARDING" ||
        nextState.pendingDiscardPlayerId !== playerId
      )
        break;

      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const player = players.find((p) => p?.id === playerId);
      if (!player) break;

      if (!player.hand) player.hand = [];
      const validCardIds = (cardIds || []).filter(Boolean);
      validCardIds.forEach((id) => {
        const idx = player.hand.findIndex((c) => c?.id === id);
        if (idx !== -1) {
          const removed = player.hand.splice(idx, 1)[0];
          if (!nextState.discardPile) nextState.discardPile = [];
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
      const { playerId } = action.payload || {};
      if (nextState.status !== "PLAYING") break;

      const players = Array.isArray(nextState.players) ? nextState.players : [];
      const activePlayer = players[nextState.currentPlayerIndex];
      if (!activePlayer || playerId !== activePlayer.id) break;

      const player = players.find((p) => p?.id === playerId);
      if (!player) break;

      logMsg(`${player.name} ended their turn.`);
      accepted = true;

      if (!player.hand) player.hand = [];
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
