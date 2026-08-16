import { describe, it, expect } from "vitest";
import { GameState, ActionCard, PropertyCard } from "../../../types/game";
import { dispatchAction } from "../api";
import { evaluateBotTurnWithBrain } from "../../../bot/botBrain";
import { restructureProperties } from "../rules";

describe("Mid-Game Crash & Zero Asset Bugfixes", () => {
  const createBaseState = (): GameState => ({
    gameId: "test-game",
    status: "PLAYING",
    players: [
      {
        id: "human",
        name: "Human",
        isBot: false,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
      {
        id: "bot",
        name: "Bot",
        isBot: true,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
    ],
    currentPlayerIndex: 1, // Bot turn
    deck: [],
    discardPile: [],
    actionPointsLeft: 3,
    currentTurnActionsPerformed: 0,
    winnerId: null,
    reactionQueue: null,
    pendingDiscardPlayerId: null,
    logs: [],
  });

  it("handles Rent card played against a human player with 0 money and 0 properties without crashing", () => {
    const state = createBaseState();
    const botPlayer = state.players[1];
    const humanPlayer = state.players[0];

    // Give bot brown property set so rent can be played on Brown
    const brownProp: PropertyCard = {
      id: "prop-brown-1",
      name: "Mediterranean Ave",
      type: "Property",
      value: 1,
      color: "Brown",
    };
    botPlayer.properties = restructureProperties([brownProp]);

    // Give bot Rent card in hand
    const rentCard: ActionCard = {
      id: "rent-brown",
      name: "Rent",
      type: "Action",
      actionType: "Rent",
      value: 1,
      rentColors: ["Brown"],
    };
    botPlayer.hand = [rentCard];

    // Human player has 0 bank and 0 properties
    humanPlayer.bank = [];
    humanPlayer.properties = restructureProperties([]);

    // Bot plays rent card targeting Brown
    const nextState = dispatchAction(state, {
      type: "PLAY_CARD",
      payload: {
        playerId: botPlayer.id,
        cardId: rentCard.id,
        targetZone: "center",
        options: { color: "Brown" },
      },
    });

    expect(nextState.accepted).toBe(true);
    expect(nextState.reactionQueue).not.toBeNull();
    expect(nextState.reactionQueue?.targetPlayerId).toBe("human");

    // Human responds with accept (no JSN, 0 assets)
    const resolvedState = dispatchAction(nextState, {
      type: "RESPOND_TO_ACTION",
      payload: {
        playerId: "human",
        useJSN: false,
        selectedCardIds: [],
      },
    });

    expect(resolvedState.accepted).toBe(true);
    expect(resolvedState.reactionQueue).toBeNull();
  });

  it("prevents Bot from targeting Sly Deal on a player with 0 properties", () => {
    const state = createBaseState();
    const botPlayer = state.players[1];

    const slyDealCard: ActionCard = {
      id: "sly-deal-1",
      name: "Sly Deal",
      type: "Action",
      actionType: "Sly Deal",
      value: 3,
    };
    botPlayer.hand = [slyDealCard];

    // Human player has 0 properties
    state.players[0].properties = restructureProperties([]);

    const decision = evaluateBotTurnWithBrain(
      state,
      botPlayer.id,
      "Aggressive",
    );

    // Bot should not dispatch Sly Deal as a property theft against a property-less player
    if (decision.action.type === "PLAY_CARD") {
      expect(decision.action.payload.targetZone).not.toBe("center");
    } else {
      expect(["END_TURN", "DISCARD_OVERFLOW"]).includes(decision.action.type);
    }
  });

  it("supports RESOLVE_PAYMENT action in reducer safely", () => {
    const state = createBaseState();
    const humanPlayer = state.players[0];
    const botPlayer = state.players[1];

    state.reactionQueue = {
      targetPlayerId: "human",
      originalActionPlayerId: "bot",
      actionCard: {
        id: "debt-1",
        name: "Debt Collector",
        type: "Action",
        actionType: "Debt Collector",
        value: 3,
      },
      actionDetails: { amount: 5 },
      counterChain: [],
      timerSeconds: 5,
    };

    const nextState = dispatchAction(state, {
      type: "RESOLVE_PAYMENT",
      payload: {
        targetPlayerId: humanPlayer.id,
        callerPlayerId: botPlayer.id,
        selectedCardIds: [],
      },
    });

    expect(nextState.accepted).toBe(true);
    expect(nextState.reactionQueue).toBeNull();
  });
});
