import { GameState, GameAction, PlayerState, Card, WildcardCard, ActionCard, ReactionState, PropertyCard } from '../types/game';
import { createDeck, shuffleDeck } from './deck';
import { restructureProperties, checkWinCondition, calculateRent } from './rules';

// Simulate a slow asynchronous network API layer for future WebSockets
export const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Action dispatcher system that serves as our pure state transition engine
export const dispatchAction = (state: GameState, action: GameAction): GameState => {
  const nextState = JSON.parse(JSON.stringify(state)) as GameState;
  const logs = nextState.logs;

  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  switch (action.type) {
    case 'START_GAME': {
      logMsg('Game starting vs Smart AI Opponent.');
      nextState.status = 'PLAYING';
      nextState.roomCode = action.payload.roomCode || 'LOBBY';

      // Build and shuffle 108 card deck
      const freshDeck = shuffleDeck(createDeck());

      // Deal 5 cards to each player
      nextState.players.forEach(p => {
        p.hand = freshDeck.splice(0, 5);
        p.bank = [];
        p.properties = restructureProperties([]);
        logMsg(`${p.name} dealt 5 cards.`);
      });

      // Draw 2 cards for the starting player
      const startPlayer = nextState.players[0];
      startPlayer.hand.push(...freshDeck.splice(0, 2));
      logMsg(`${startPlayer.name} draws 2 cards to begin.`);

      nextState.deck = freshDeck;
      nextState.discardPile = [];
      nextState.currentPlayerIndex = 0;
      nextState.actionPointsLeft = 3;
      nextState.currentTurnActionsPerformed = 0;
      nextState.winnerId = null;
      nextState.reactionQueue = null;
      nextState.pendingDiscardPlayerId = null;
      break;
    }

    case 'RESET_GAME': {
      logMsg('Resetting game state to Lobby.');
      nextState.status = 'LOBBY';
      nextState.players.forEach(p => {
        p.hand = [];
        p.bank = [];
        p.properties = restructureProperties([]);
      });
      nextState.deck = [];
      nextState.discardPile = [];
      nextState.currentPlayerIndex = 0;
      nextState.actionPointsLeft = 0;
      nextState.currentTurnActionsPerformed = 0;
      nextState.winnerId = null;
      nextState.reactionQueue = null;
      nextState.pendingDiscardPlayerId = null;
      break;
    }

    case 'PLAY_CARD': {
      const { playerId, cardId, targetZone, options } = action.payload;
      const player = nextState.players.find(p => p.id === playerId);
      if (!player || nextState.status !== 'PLAYING' || nextState.actionPointsLeft <= 0) break;

      const cardIdx = player.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) break;

      const card = player.hand[cardIdx];

      // Handle targetZone = BANK
      if (targetZone === 'bank') {
        player.hand.splice(cardIdx, 1);
        player.bank.push(card);
        nextState.actionPointsLeft--;
        logMsg(`${player.name} banked ${card.name} (Value: ${card.value}M).`);
      }
      // Handle targetZone = PROPERTIES
      else if (targetZone === 'properties') {
        if (card.type === 'Property') {
          player.hand.splice(cardIdx, 1);
          const allProperties = player.properties.flatMap(set => set.cards);
          allProperties.push(card as PropertyCard);
          player.properties = restructureProperties(allProperties);
          nextState.actionPointsLeft--;
          logMsg(`${player.name} added ${card.name} to their ${card.color} properties.`);
        } else if (card.type === 'Wildcard') {
          const selectedColor = options?.color || (card as WildcardCard).colors[0];
          player.hand.splice(cardIdx, 1);
          const wildcard = card as WildcardCard;
          wildcard.currentColor = selectedColor;

          const allProperties = player.properties.flatMap(set => set.cards);
          allProperties.push(wildcard);
          player.properties = restructureProperties(allProperties);
          nextState.actionPointsLeft--;
          logMsg(`${player.name} played ${card.name} as ${selectedColor}.`);
        }
      }
      // Handle targetZone = CENTER (Action play)
      else if (targetZone === 'center') {
        if (card.type !== 'Action') break;
        const actionCard = card as ActionCard;

        // Discard or place in center action pile
        player.hand.splice(cardIdx, 1);
        nextState.discardPile.unshift(actionCard);
        nextState.actionPointsLeft--;

        logMsg(`${player.name} played Action Card: ${actionCard.name}.`);

        // Execute actual action mechanics
        if (actionCard.actionType === 'Pass Go') {
          // Immediately draw 2 cards
          const drawn = nextState.deck.splice(0, 2);
          player.hand.push(...drawn);
          logMsg(`${player.name} draws 2 cards from Pass Go.`);
        }
        else if (actionCard.actionType === "Its My Birthday") {
          // Birthday: triggers JSN reactions or immediate bank transfer from others
          const target = nextState.players.find(p => p.id !== playerId);
          if (target) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { amount: 2 },
              counterChain: [],
              timerSeconds: 5
            };
            logMsg(`Reaction prompt queued: ${target.name} must pay 2M or JSN.`);
          }
        }
        else if (actionCard.actionType === 'Debt Collector') {
          const target = nextState.players.find(p => p.id !== playerId);
          if (target) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { amount: 5 },
              counterChain: [],
              timerSeconds: 5
            };
            logMsg(`Reaction prompt queued: ${target.name} must pay 5M or JSN.`);
          }
        }
        else if (actionCard.actionType === 'Sly Deal') {
          const target = nextState.players.find(p => p.id !== playerId);
          const targetCardId = options?.targetCardId;
          if (target && targetCardId) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetCardId },
              counterChain: [],
              timerSeconds: 5
            };
            logMsg(`Reaction prompt queued: ${target.name} must defend ${targetCardId} or allow theft.`);
          }
        }
        else if (actionCard.actionType === 'Forced Deal') {
          const target = nextState.players.find(p => p.id !== playerId);
          const targetCardId = options?.targetCardId;
          const swapCardId = options?.swapCardId;
          if (target && targetCardId && swapCardId) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetCardId, swapCardId },
              counterChain: [],
              timerSeconds: 5
            };
            logMsg(`Reaction prompt queued: ${target.name} must accept forced property swap or JSN.`);
          }
        }
        else if (actionCard.actionType === 'Deal Breaker') {
          const target = nextState.players.find(p => p.id !== playerId);
          const targetColor = options?.targetColor;
          if (target && targetColor) {
            nextState.reactionQueue = {
              targetPlayerId: target.id,
              originalActionPlayerId: playerId,
              actionCard,
              actionDetails: { targetColor },
              counterChain: [],
              timerSeconds: 5
            };
            logMsg(`Reaction prompt queued: ${target.name} must defend completed ${targetColor} set or lose it.`);
          }
        }
        else if (actionCard.actionType === 'Rent' || actionCard.actionType === 'Multi-Rent') {
          const selectedColor = options?.color;
          if (selectedColor) {
            // Calculate rent amount
            const matchingSet = player.properties.find(s => s.color === selectedColor);
            const rentVal = matchingSet ? calculateRent(matchingSet) : 0;
            const target = nextState.players.find(p => p.id !== playerId);

            if (target && rentVal > 0) {
              nextState.reactionQueue = {
                targetPlayerId: target.id,
                originalActionPlayerId: playerId,
                actionCard,
                actionDetails: { amount: rentVal, targetColor: selectedColor },
                counterChain: [],
                timerSeconds: 5
              };
              logMsg(`Reaction prompt queued: ${target.name} must pay ${rentVal}M rent for ${selectedColor} properties.`);
            } else {
              logMsg(`No property matching ${selectedColor} for rent charging.`);
            }
          }
        }
      }

      // Check win condition instantly
      const isWinner = checkWinCondition(player);
      if (isWinner) {
        nextState.status = 'WINNER';
        nextState.winnerId = player.id;
        logMsg(`🏆 WINNER! ${player.name} has completed 3 full sets and won the match!`);
      }
      break;
    }

    case 'TOGGLE_WILDCARD_COLOR': {
      const { playerId, cardId, color } = action.payload;
      const player = nextState.players.find(p => p.id === playerId);
      if (!player) break;

      const allProps = player.properties.flatMap(set => set.cards);
      const card = allProps.find(c => c.id === cardId);
      if (card && card.type === 'Wildcard') {
        const wildcard = card as WildcardCard;
        if (wildcard.colors.includes(color) || wildcard.colors.includes('Any')) {
          wildcard.currentColor = color;
          player.properties = restructureProperties(allProps);
          logMsg(`${player.name} re-assigned wildcard ${wildcard.name} to ${color}.`);
        }
      }
      // Re-evaluate win condition
      if (checkWinCondition(player)) {
        nextState.status = 'WINNER';
        nextState.winnerId = player.id;
        logMsg(`🏆 WINNER! ${player.name} has completed 3 full sets and won!`);
      }
      break;
    }

    case 'RESPOND_TO_ACTION': {
      const { playerId, useJSN, jsnCardId } = action.payload;
      const rx = nextState.reactionQueue;
      if (!rx || rx.targetPlayerId !== playerId) break;

      const responder = nextState.players.find(p => p.id === playerId);
      if (!responder) break;

      if (useJSN && jsnCardId) {
        // Find JSN card in hand
        const jsnIdx = responder.hand.findIndex(c => c.id === jsnCardId);
        if (jsnIdx !== -1) {
          const jsnCard = responder.hand[jsnIdx];
          responder.hand.splice(jsnIdx, 1);
          nextState.discardPile.unshift(jsnCard);

          // Add to counterChain
          rx.counterChain.push({ playerId, cardId: jsnCardId });
          logMsg(`🛡️ ${responder.name} counterplayed with JUST SAY NO!`);

          // Reverse targets! The original attacker now becomes the target of the reaction JSN (they must choose to play JSN to counter back or accept defeat)
          rx.targetPlayerId = rx.targetPlayerId === rx.originalActionPlayerId
            ? nextState.players.find(p => p.id !== rx.originalActionPlayerId)!.id
            : rx.originalActionPlayerId;

          rx.timerSeconds = 5; // Reset reaction timer
        }
      } else {
        // Declined to play JSN or doesn't have it -> ACCEPT RESOLUTION
        logMsg(`${responder.name} accepted the action effects / charges.`);
        resolveReaction(nextState, rx);
        nextState.reactionQueue = null;
      }
      break;
    }

    case 'REACTION_TIMED_OUT': {
      const rx = nextState.reactionQueue;
      if (rx) {
        const targetPlayer = nextState.players.find(p => p.id === rx.targetPlayerId);
        logMsg(`⏰ Timer expired. ${targetPlayer?.name || 'Player'} failed to reaction-defend.`);
        resolveReaction(nextState, rx);
        nextState.reactionQueue = null;
      }
      break;
    }

    case 'DISCARD_OVERFLOW': {
      const { playerId, cardIds } = action.payload;
      const player = nextState.players.find(p => p.id === playerId);
      if (!player || nextState.status !== 'DISCARDING') break;

      // Filter and discard
      const keptHand: Card[] = [];
      player.hand.forEach(c => {
        if (cardIds.includes(c.id)) {
          nextState.discardPile.unshift(c);
          logMsg(`${player.name} discarded excess card: ${c.name}.`);
        } else {
          keptHand.push(c);
        }
      });
      player.hand = keptHand;

      if (player.hand.length <= 7) {
        nextState.status = 'PLAYING';
        nextState.pendingDiscardPlayerId = null;

        // Advance turn properly!
        nextState.currentPlayerIndex = (nextState.currentPlayerIndex + 1) % nextState.players.length;
        const nextPlayer = nextState.players[nextState.currentPlayerIndex];

        // Draw 2 cards (or 5 if hand empty)
        const drawCount = nextPlayer.hand.length === 0 ? 5 : 2;
        if (nextState.deck.length < drawCount) {
          // Recycle discard pile
          nextState.deck = shuffleDeck([...nextState.deck, ...nextState.discardPile]);
          nextState.discardPile = [];
        }
        const drawn = nextState.deck.splice(0, drawCount);
        nextPlayer.hand.push(...drawn);
        nextState.actionPointsLeft = 3;

        logMsg(`Turn starts for ${nextPlayer.name}. Draws ${drawCount} cards.`);
      }
      break;
    }

    case 'END_TURN': {
      const { playerId } = action.payload;
      if (nextState.status !== 'PLAYING') break;
      const player = nextState.players.find(p => p.id === playerId);
      if (!player) break;

      logMsg(`${player.name} ended their turn.`);

      if (player.hand.length > 7) {
        nextState.status = 'DISCARDING';
        nextState.pendingDiscardPlayerId = player.id;
        logMsg(`⚠️ ${player.name} has ${player.hand.length} cards in hand and must discard down to 7.`);
      } else {
        // Regular turn transition
        nextState.currentPlayerIndex = (nextState.currentPlayerIndex + 1) % nextState.players.length;
        const nextPlayer = nextState.players[nextState.currentPlayerIndex];

        const drawCount = nextPlayer.hand.length === 0 ? 5 : 2;
        if (nextState.deck.length < drawCount) {
          nextState.deck = shuffleDeck([...nextState.deck, ...nextState.discardPile]);
          nextState.discardPile = [];
        }
        const drawn = nextState.deck.splice(0, drawCount);
        nextPlayer.hand.push(...drawn);
        nextState.actionPointsLeft = 3;

        logMsg(`Turn starts for ${nextPlayer.name}. Draws ${drawCount} cards.`);
      }
      break;
    }
  }

  return nextState;
};

// Internal solver to resolve effects when reaction is declined or timers run out
const resolveReaction = (state: GameState, rx: ReactionState) => {
  const activeTargetId = rx.targetPlayerId;
  const originalId = rx.originalActionPlayerId;

  const target = state.players.find(p => p.id === activeTargetId);
  const attacker = state.players.find(p => p.id === originalId);

  if (!target || !attacker) return;

  const logs = state.logs;
  const logMsg = (msg: string) => {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  // Determine if JSN counter chain resolved in favor of Attacker or Target
  // If chain is odd length (1, 3, etc): JSN blocked the action. Target wins, action fizzles!
  // If chain is even length (0, 2, etc): Action executes successfully!
  const isBlocked = rx.counterChain.length % 2 !== 0;

  if (isBlocked) {
    logMsg(`🛡️ Action "${rx.actionCard.name}" was successfully BLOCKED by Just Say No!`);
    return;
  }

  // Action Executes!
  const type = rx.actionCard.actionType;

  if (type === 'Debt Collector' || type === "Its My Birthday") {
    const amount = rx.actionDetails.amount || 0;
    transferCash(target, attacker, amount, state);
  }
  else if (type === 'Rent' || type === 'Multi-Rent') {
    const amount = rx.actionDetails.amount || 0;
    logMsg(`Collecting ${amount}M rent from ${target.name} to ${attacker.name}.`);
    transferCash(target, attacker, amount, state);
  }
  else if (type === 'Sly Deal') {
    const targetCardId = rx.actionDetails.targetCardId;
    if (targetCardId) {
      // Find and extract property card from target properties
      const allProps = target.properties.flatMap(set => set.cards);
      const cardIdx = allProps.findIndex(c => c.id === targetCardId);
      if (cardIdx !== -1) {
        const card = allProps[cardIdx];

        // Ensure card does NOT belong to a completed set (Sly Deal rules)
        const currentSet = target.properties.find(set => set.cards.some(c => c.id === targetCardId));
        if (currentSet && currentSet.isComplete) {
          logMsg(`❌ Sly Deal failed: target card belongs to a completed set!`);
          return;
        }

        allProps.splice(cardIdx, 1);
        target.properties = restructureProperties(allProps);

        // Add to attacker
        const attackerProps = attacker.properties.flatMap(set => set.cards);
        attackerProps.push(card);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(`💸 Sly Deal successful! ${attacker.name} stole ${card.name} from ${target.name}.`);
      }
    }
  }
  else if (type === 'Forced Deal') {
    const targetCardId = rx.actionDetails.targetCardId;
    const swapCardId = rx.actionDetails.swapCardId;

    if (targetCardId && swapCardId) {
      const targetProps = target.properties.flatMap(set => set.cards);
      const attackerProps = attacker.properties.flatMap(set => set.cards);

      const tIdx = targetProps.findIndex(c => c.id === targetCardId);
      const aIdx = attackerProps.findIndex(c => c.id === swapCardId);

      if (tIdx !== -1 && aIdx !== -1) {
        // Ensure target is not a completed set
        const targetSet = target.properties.find(set => set.cards.some(c => c.id === targetCardId));
        if (targetSet && targetSet.isComplete) {
          logMsg(`❌ Forced Deal failed: target property belongs to a completed set!`);
          return;
        }

        const tCard = targetProps.splice(tIdx, 1)[0];
        const aCard = attackerProps.splice(aIdx, 1)[0];

        attackerProps.push(tCard);
        targetProps.push(aCard);

        target.properties = restructureProperties(targetProps);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(`🔄 Forced Deal swap complete! ${attacker.name} received ${tCard.name}, ${target.name} received ${aCard.name}.`);
      }
    }
  }
  else if (type === 'Deal Breaker') {
    const targetColor = rx.actionDetails.targetColor;
    if (targetColor) {
      const targetSet = target.properties.find(set => set.color === targetColor);
      if (targetSet && targetSet.isComplete) {
        const stolenCards = [...targetSet.cards];

        // Remove from target
        const targetProps = target.properties.flatMap(set => set.cards).filter(c => !stolenCards.some(sc => sc.id === c.id));
        target.properties = restructureProperties(targetProps);

        // Add to attacker
        const attackerProps = attacker.properties.flatMap(set => set.cards);
        attackerProps.push(...stolenCards);
        attacker.properties = restructureProperties(attackerProps);

        logMsg(`💥 Deal Breaker successful! ${attacker.name} stole the completed ${targetColor} set from ${target.name}!`);
      }
    }
  }

  // Re-verify win conditions
  if (checkWinCondition(attacker)) {
    state.status = 'WINNER';
    state.winnerId = attacker.id;
    logMsg(`🏆 WINNER! ${attacker.name} has completed 3 full sets and won!`);
  }
};

// Handle debt collection logic: target player pays with bank cash or properties if cash is insufficient
const transferCash = (from: PlayerState, to: PlayerState, amount: number, state: GameState) => {
  const logs = state.logs;
  let remainingDebt = amount;

  // 1. Pay from bank cash
  from.bank = [...from.bank].sort((a, b) => b.value - a.value); // Use high value money first
  const keptBank: Card[] = [];

  from.bank.forEach(card => {
    if (remainingDebt <= 0) {
      keptBank.push(card);
    } else {
      remainingDebt -= card.value;
      to.bank.push(card);
      logs.unshift(`[${new Date().toLocaleTimeString()}] Transfer: ${from.name} pays ${card.value}M from Bank to ${to.name}.`);
    }
  });
  from.bank = keptBank;

  // 2. Pay using properties if debt still remains (forced liquidation)
  if (remainingDebt > 0) {
    const allProps = from.properties.flatMap(set => set.cards);
    const keptProps: (PropertyCard | WildcardCard)[] = [];

    allProps.forEach(card => {
      if (remainingDebt <= 0) {
        keptProps.push(card);
      } else {
        remainingDebt -= card.value;
        const toProps = to.properties.flatMap(set => set.cards);
        toProps.push(card);
        to.properties = restructureProperties(toProps);
        logs.unshift(`[${new Date().toLocaleTimeString()}] Liquidate: ${from.name} forfeits property ${card.name} (Value: ${card.value}M) to resolve remaining debt.`);
      }
    });

    from.properties = restructureProperties(keptProps);
  }

  if (remainingDebt > 0) {
    logs.unshift(`[${new Date().toLocaleTimeString()}] ${from.name} is completely bankrupt and has no cash or properties left to cover the remaining ${remainingDebt}M debt.`);
  }
};
