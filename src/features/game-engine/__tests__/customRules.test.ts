import { describe, it, expect } from "vitest";
import { dispatchAction } from "../api";
import { GameState, CustomGameRules, ActionCard } from "../../../types/game";
import { DEFAULT_CUSTOM_RULES, restructureProperties } from "../rules";

describe("Custom Game Rules Mechanics", () => {
  const customRules: CustomGameRules = {
    setsRequiredToFinish: 2,
    allowDealBreakers: false,
    allowForcedDeals: false,
    allowRentCollection: true,
    fullSetImmunity: true,
    initialHandSize: 7,
    actionLimitPerTurn: 4,
    allowWildcards: false,
  };

  const createInitialState = (): GameState => ({
    gameId: "test-game",
    status: "LOBBY",
    players: [
      {
        id: "p1",
        name: "Player 1",
        isBot: false,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
      {
        id: "p2",
        name: "Player 2",
        isBot: false,
        hand: [],
        bank: [],
        properties: restructureProperties([]),
      },
    ],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    actionPointsLeft: 0,
    currentTurnActionsPerformed: 0,
    winnerId: null,
    reactionQueue: null,
    pendingDiscardPlayerId: null,
    logs: [],
    customRules: DEFAULT_CUSTOM_RULES,
  });

  it("applies initial hand size and action limits on START_GAME", () => {
    let state = createInitialState();
    state = dispatchAction(state, {
      type: "START_GAME",
      payload: { customRules },
    });

    expect(state.customRules?.setsRequiredToFinish).toBe(2);
    expect(state.actionPointsLeft).toBe(4); // actionLimitPerTurn
    // p1 was dealt 7 cards, then drew 2 = 9 cards
    expect(state.players[0].hand.length).toBe(9);
    // p2 was dealt 7 cards
    expect(state.players[1].hand.length).toBe(7);
  });

  it("filters out wildcards and deal breakers from deck when disabled", () => {
    let state = createInitialState();
    state = dispatchAction(state, {
      type: "START_GAME",
      payload: { customRules },
    });

    const allCards = [
      ...state.deck,
      ...state.players[0].hand,
      ...state.players[1].hand,
    ];

    const wildcards = allCards.filter((c) => c.type === "Wildcard");
    const dealBreakers = allCards.filter(
      (c) =>
        c.type === "Action" && (c as ActionCard).actionType === "Deal Breaker",
    );

    expect(wildcards.length).toBe(0);
    expect(dealBreakers.length).toBe(0);
  });

  it("wins with 2 sets when setsRequiredToFinish is set to 2", () => {
    let state = createInitialState();
    state.customRules = { ...DEFAULT_CUSTOM_RULES, setsRequiredToFinish: 2 };
    state.status = "PLAYING";
    state.actionPointsLeft = 3;

    const darkBlueProp1 = {
      id: "db1",
      name: "Boardwalk",
      type: "Property" as const,
      color: "Dark Blue" as const,
      value: 4,
    };
    const darkBlueProp2 = {
      id: "db2",
      name: "Park Place",
      type: "Property" as const,
      color: "Dark Blue" as const,
      value: 4,
    };
    const brownProp1 = {
      id: "br1",
      name: "Baltic Ave",
      type: "Property" as const,
      color: "Brown" as const,
      value: 1,
    };
    const brownProp2 = {
      id: "br2",
      name: "Mediterranean Ave",
      type: "Property" as const,
      color: "Brown" as const,
      value: 1,
    };

    state.players[0].hand = [brownProp2];
    state.players[0].properties = restructureProperties([
      darkBlueProp1,
      darkBlueProp2,
      brownProp1,
    ]);

    state = dispatchAction(state, {
      type: "PLAY_CARD",
      payload: {
        playerId: "p1",
        cardId: "br2",
        targetZone: "properties",
      },
    });

    expect(state.status).toBe("WINNER");
    expect(state.winnerId).toBe("p1");
  });
});
