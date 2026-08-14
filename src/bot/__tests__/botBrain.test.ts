import { describe, it, expect } from "vitest";
import { evaluateBotTurnWithBrain, TRAINED_BOT_MODELS } from "../botBrain";
import { GameState, PropertyCard, ActionCard } from "../../types/game";
import { restructureProperties } from "../../features/game-engine/rules";

describe("Bot Brain and Weight Matrix Tests", () => {
  const createMockGameState = (): GameState => ({
    gameId: "test-game",
    status: "PLAYING",
    players: [
      {
        id: "human",
        name: "Human Player",
        isBot: false,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
      {
        id: "bot",
        name: "Bot Opponent",
        isBot: true,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
    ],
    currentPlayerIndex: 1, // bot turn
    deck: [],
    discardPile: [],
    actionPointsLeft: 3,
    currentTurnActionsPerformed: 0,
    winnerId: null,
    reactionQueue: null,
    pendingDiscardPlayerId: null,
    logs: [],
  });

  it("should have weight models defined for Aggressive, Defensive, and Hoarder", () => {
    expect(TRAINED_BOT_MODELS.Aggressive).toBeDefined();
    expect(TRAINED_BOT_MODELS.Defensive).toBeDefined();
    expect(TRAINED_BOT_MODELS.Hoarder).toBeDefined();
    expect(TRAINED_BOT_MODELS.Aggressive.WINNING_SET_COMPLETION).toBe(1000);
  });

  it("should return END_TURN when actionPointsLeft is 0", () => {
    const state = createMockGameState();
    state.actionPointsLeft = 0;

    const decision = evaluateBotTurnWithBrain(state, "bot", "Aggressive");
    expect(decision.action.type).toBe("END_TURN");
    expect(decision.weight).toBe(TRAINED_BOT_MODELS.Aggressive.END_TURN_BASE);
  });

  it("should prioritize set completion with highest weight score", () => {
    const state = createMockGameState();
    const botPlayer = state.players.find((p) => p.id === "bot")!;

    const prop1: PropertyCard = {
      id: "p1",
      name: "Park Place",
      type: "Property",
      value: 4,
      color: "Dark Blue",
    };
    const prop2: PropertyCard = {
      id: "p2",
      name: "Boardwalk",
      type: "Property",
      value: 4,
      color: "Dark Blue",
    };

    botPlayer.properties = restructureProperties([prop1]);
    botPlayer.hand = [
      prop2,
      { id: "m1", name: "1M Cash", type: "Money", value: 1 },
    ];

    const decision = evaluateBotTurnWithBrain(state, "bot", "Aggressive");
    expect(decision.action.type).toBe("PLAY_CARD");
    if (decision.action.type === "PLAY_CARD") {
      expect(decision.action.payload.cardId).toBe("p2");
      expect(decision.action.payload.targetZone).toBe("properties");
    }
    expect(decision.weight).toBe(TRAINED_BOT_MODELS.Aggressive.SET_COMPLETION);
    expect(decision.tacticalExplanation).toContain("Dark Blue");
  });

  it("should prioritize Deal Breaker when opponent has a completed set", () => {
    const state = createMockGameState();
    const humanPlayer = state.players.find((p) => p.id === "human")!;
    const botPlayer = state.players.find((p) => p.id === "bot")!;

    const prop1: PropertyCard = {
      id: "p1",
      name: "Park Place",
      type: "Property",
      value: 4,
      color: "Dark Blue",
    };
    const prop2: PropertyCard = {
      id: "p2",
      name: "Boardwalk",
      type: "Property",
      value: 4,
      color: "Dark Blue",
    };
    humanPlayer.properties = restructureProperties([prop1, prop2]);

    const dealBreaker: ActionCard = {
      id: "db1",
      name: "Deal Breaker",
      type: "Action",
      value: 5,
      actionType: "Deal Breaker",
    };
    botPlayer.hand = [dealBreaker];

    const decision = evaluateBotTurnWithBrain(state, "bot", "Aggressive");
    expect(decision.action.type).toBe("PLAY_CARD");
    if (decision.action.type === "PLAY_CARD") {
      expect(decision.action.payload.cardId).toBe("db1");
      expect(decision.action.payload.options?.targetColor).toBe("Dark Blue");
    }
    expect(decision.weight).toBe(TRAINED_BOT_MODELS.Aggressive.DEAL_BREAKER);
  });

  it("should generate DISCARD_OVERFLOW action with negative penalty weight when in DISCARDING state", () => {
    const state = createMockGameState();
    state.status = "DISCARDING";
    state.pendingDiscardPlayerId = "bot";

    const botPlayer = state.players.find((p) => p.id === "bot")!;
    botPlayer.hand = Array.from({ length: 9 }, (_, i) => ({
      id: `c-${i}`,
      name: `Card ${i}`,
      type: "Money" as const,
      value: i + 1,
    }));

    const decision = evaluateBotTurnWithBrain(state, "bot", "Aggressive");
    expect(decision.action.type).toBe("DISCARD_OVERFLOW");
    if (decision.action.type === "DISCARD_OVERFLOW") {
      expect(decision.action.payload.cardIds.length).toBe(2);
    }
    expect(decision.weight).toBeLessThan(0);
  });
});
