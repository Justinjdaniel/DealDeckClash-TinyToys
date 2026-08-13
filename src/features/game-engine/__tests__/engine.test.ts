import { describe, it, expect } from "vitest";
import { createDeck } from "../deck";
import {
  restructureProperties,
  calculateRent,
  checkWinCondition,
} from "../rules";
import { dispatchAction } from "../api";
import { GameState, GameAction, PropertyCard } from "../../../types/game";

describe("Monopoly Deal Game Engine Tests", () => {
  describe("Deck and Properties Restructuring", () => {
    it("should generate a standard Monopoly Deal deck of 99 cards", () => {
      const deck = createDeck();
      expect(deck.length).toBe(99);
    });

    it("should correctly organize played properties into color sets", () => {
      const prop1: PropertyCard = {
        id: "prop-darkblue-1",
        name: "Boardwalk",
        type: "Property",
        value: 4,
        color: "Dark Blue",
      };
      const prop2: PropertyCard = {
        id: "prop-darkblue-2",
        name: "Park Place",
        type: "Property",
        value: 4,
        color: "Dark Blue",
      };

      const restructured = restructureProperties([prop1, prop2]);
      const darkBlueSet = restructured.find((set) => set.color === "Dark Blue");

      expect(darkBlueSet).toBeDefined();
      expect(darkBlueSet?.cards.length).toBe(2);
      expect(darkBlueSet?.isComplete).toBe(true);
    });
  });

  describe("Rent and Win Conditions", () => {
    it("should calculate the correct rent amount for a partial property set", () => {
      const prop1: PropertyCard = {
        id: "prop-red-1",
        name: "Kentucky Avenue",
        type: "Property",
        value: 3,
        color: "Red",
      };

      const restructured = restructureProperties([prop1]);
      const redSet = restructured.find((set) => set.color === "Red");

      expect(redSet).toBeDefined();
      expect(calculateRent(redSet!)).toBe(2); // Rent for 1 red property is 2M
    });

    it("should calculate the correct rent amount for a complete property set", () => {
      const prop1: PropertyCard = {
        id: "prop-red-1",
        name: "Kentucky Avenue",
        type: "Property",
        value: 3,
        color: "Red",
      };
      const prop2: PropertyCard = {
        id: "prop-red-2",
        name: "Indiana Avenue",
        type: "Property",
        value: 3,
        color: "Red",
      };
      const prop3: PropertyCard = {
        id: "prop-red-3",
        name: "Illinois Avenue",
        type: "Property",
        value: 3,
        color: "Red",
      };

      const restructured = restructureProperties([prop1, prop2, prop3]);
      const redSet = restructured.find((set) => set.color === "Red");

      expect(redSet).toBeDefined();
      expect(calculateRent(redSet!)).toBe(6); // Rent for full red set of 3 properties is 6M
    });

    it("should verify win condition when 3 different sets are completed", () => {
      // Set 1: Dark Blue Complete (2 cards)
      const db1: PropertyCard = {
        id: "db1",
        name: "Boardwalk",
        type: "Property",
        value: 4,
        color: "Dark Blue",
      };
      const db2: PropertyCard = {
        id: "db2",
        name: "Park Place",
        type: "Property",
        value: 4,
        color: "Dark Blue",
      };

      // Set 2: Utility Complete (2 cards)
      const ut1: PropertyCard = {
        id: "ut1",
        name: "Electric Company",
        type: "Property",
        value: 2,
        color: "Utility",
      };
      const ut2: PropertyCard = {
        id: "ut2",
        name: "Water Works",
        type: "Property",
        value: 2,
        color: "Utility",
      };

      // Set 3: Brown Complete (2 cards)
      const br1: PropertyCard = {
        id: "br1",
        name: "Baltic Avenue",
        type: "Property",
        value: 1,
        color: "Brown",
      };
      const br2: PropertyCard = {
        id: "br2",
        name: "Mediterranean Avenue",
        type: "Property",
        value: 1,
        color: "Brown",
      };

      const allProperties = restructureProperties([
        db1,
        db2,
        ut1,
        ut2,
        br1,
        br2,
      ]);

      const playerState = {
        id: "human",
        name: "Player 1",
        isBot: false,
        hand: [],
        bank: [],
        properties: allProperties,
      };

      expect(checkWinCondition(playerState)).toBe(true);
    });
  });

  describe("Reducer Dispatcher Actions", () => {
    const createInitialState = (): GameState => ({
      gameId: "test-session",
      status: "PLAYING",
      players: [
        {
          id: "human",
          name: "Player 1",
          isBot: false,
          hand: [
            { id: "cash-5m", name: "5M Cash", type: "Money", value: 5 },
            {
              id: "prop-brown-1",
              name: "Baltic",
              type: "Property",
              value: 1,
              color: "Brown",
            },
          ],
          bank: [],
          properties: restructureProperties([]),
        },
        {
          id: "bot",
          name: "AI Bot",
          isBot: true,
          hand: [],
          bank: [],
          properties: restructureProperties([]),
        },
      ],
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      actionPointsLeft: 3,
      currentTurnActionsPerformed: 0,
      winnerId: null,
      reactionQueue: null,
      pendingDiscardPlayerId: null,
      logs: [],
    });

    it("should allow banking a cash card and spend 1 action point", () => {
      const state = createInitialState();
      const action: GameAction = {
        type: "PLAY_CARD",
        payload: { playerId: "human", cardId: "cash-5m", targetZone: "bank" },
      };

      const nextState = dispatchAction(state, action);
      const player = nextState.players.find((p) => p.id === "human");

      expect(player?.bank.length).toBe(1);
      expect(player?.bank[0].id).toBe("cash-5m");
      expect(player?.hand.length).toBe(1);
      expect(nextState.actionPointsLeft).toBe(2);
    });

    it("should allow playing a property card to properties board", () => {
      const state = createInitialState();
      const action: GameAction = {
        type: "PLAY_CARD",
        payload: {
          playerId: "human",
          cardId: "prop-brown-1",
          targetZone: "properties",
        },
      };

      const nextState = dispatchAction(state, action);
      const player = nextState.players.find((p) => p.id === "human");
      const brownSet = player?.properties.find((set) => set.color === "Brown");

      expect(brownSet?.cards.length).toBe(1);
      expect(brownSet?.cards[0].id).toBe("prop-brown-1");
      expect(nextState.actionPointsLeft).toBe(2);
    });

    it("should transition turns and draw cards when ending turn", () => {
      const state = createInitialState();
      // Setup deck with at least 5 cards to draw
      state.deck = [
        {
          id: "d1",
          name: "Pass Go",
          type: "Action",
          value: 1,
          actionType: "Pass Go",
        },
        { id: "d2", name: "1M", type: "Money", value: 1 },
        { id: "d3", name: "2M", type: "Money", value: 2 },
        { id: "d4", name: "3M", type: "Money", value: 3 },
        { id: "d5", name: "4M", type: "Money", value: 4 },
      ];

      const action: GameAction = {
        type: "END_TURN",
        payload: { playerId: "human" },
      };

      const nextState = dispatchAction(state, action);
      expect(nextState.currentPlayerIndex).toBe(1); // bot's turn now
      expect(nextState.actionPointsLeft).toBe(3); // reset action points

      const bot = nextState.players.find((p) => p.id === "bot");
      expect(bot?.hand.length).toBe(5); // bot drew 5 cards because its hand was empty!
    });
  });
});
