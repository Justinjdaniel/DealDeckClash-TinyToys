import { describe, it, expect } from "vitest";
import { createDeck } from "../deck";
import {
  restructureProperties,
  calculateRent,
  checkWinCondition,
} from "../rules";
import { dispatchAction } from "../api";
import { evaluateBotTurnWithBrain } from "../bot";
import {
  GameState,
  GameAction,
  PropertyCard,
  ActionCard,
  WildcardCard,
} from "../../../types/game";

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
      expect(nextState.accepted).toBe(true);
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
      expect(nextState.accepted).toBe(true);
    });

    it("should transition turns and draw cards when ending turn", () => {
      const state = createInitialState();
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
      expect(nextState.accepted).toBe(true);
    });

    it("should handle RESPOND_TO_ACTION with a JSN block and reverse target correctly", () => {
      const state = createInitialState();
      const actionCard: ActionCard = {
        id: "ac-db",
        name: "Debt Collector",
        type: "Action",
        value: 3,
        actionType: "Debt Collector",
      };
      state.reactionQueue = {
        targetPlayerId: "bot",
        originalActionPlayerId: "human",
        actionCard,
        actionDetails: { amount: 5 },
        counterChain: [],
        timerSeconds: 5,
      };
      const botPlayer = state.players.find((p) => p.id === "bot")!;
      const jsnCard: ActionCard = {
        id: "jsn-card",
        name: "Just Say No",
        type: "Action",
        value: 4,
        actionType: "Just Say No",
      };
      botPlayer.hand = [jsnCard];

      const action: GameAction = {
        type: "RESPOND_TO_ACTION",
        payload: { playerId: "bot", useJSN: true, jsnCardId: "jsn-card" },
      };

      const nextState = dispatchAction(state, action);
      expect(nextState.reactionQueue).not.toBeNull();
      expect(nextState.reactionQueue?.targetPlayerId).toBe("human");
      expect(nextState.reactionQueue?.counterChain.length).toBe(1);
      expect(nextState.players.find((p) => p.id === "bot")?.hand.length).toBe(
        0,
      );
      expect(nextState.accepted).toBe(true);
    });

    it("should handle REACTION_TIMED_OUT resolution leading to direct cash transfer", () => {
      const state = createInitialState();
      const actionCard: ActionCard = {
        id: "ac-imb",
        name: "It's My Birthday",
        type: "Action",
        value: 2,
        actionType: "Its My Birthday",
      };
      state.reactionQueue = {
        targetPlayerId: "bot",
        originalActionPlayerId: "human",
        actionCard,
        actionDetails: { amount: 2 },
        counterChain: [],
        timerSeconds: 5,
      };

      const botPlayer = state.players.find((p) => p.id === "bot")!;
      botPlayer.bank = [
        { id: "cash-2m", name: "2M Cash", type: "Money", value: 2 },
      ];

      const action: GameAction = { type: "REACTION_TIMED_OUT" };
      const nextState = dispatchAction(state, action);

      expect(nextState.reactionQueue).toBeNull();
      const botRemaining = nextState.players.find((p) => p.id === "bot")!;
      const humanRemaining = nextState.players.find((p) => p.id === "human")!;
      expect(botRemaining.bank.length).toBe(0);
      expect(humanRemaining.bank.length).toBe(1);
      expect(nextState.accepted).toBe(true);
    });

    it("should transfer cash and liquidate properties with forfeited-prop ID on timed out resolution", () => {
      const state = createInitialState();
      const actionCard: ActionCard = {
        id: "ac-imb",
        name: "Debt Collector",
        type: "Action",
        value: 3,
        actionType: "Debt Collector",
      };
      state.reactionQueue = {
        targetPlayerId: "bot",
        originalActionPlayerId: "human",
        actionCard,
        actionDetails: { amount: 5 },
        counterChain: [],
        timerSeconds: 5,
      };

      const botPlayer = state.players.find((p) => p.id === "bot")!;
      botPlayer.bank = [
        { id: "cash-2m", name: "2M Cash", type: "Money", value: 2 },
      ];
      const prop: PropertyCard = {
        id: "forfeited-prop",
        name: "Boardwalk",
        type: "Property",
        value: 4,
        color: "Dark Blue",
      };
      botPlayer.properties = restructureProperties([prop]);

      const action: GameAction = { type: "REACTION_TIMED_OUT" };
      const nextState = dispatchAction(state, action);

      const botFinal = nextState.players.find((p) => p.id === "bot")!;
      const humanFinal = nextState.players.find((p) => p.id === "human")!;

      expect(botFinal.bank.length).toBe(0);
      expect(botFinal.properties.flatMap((s) => s.cards).length).toBe(0);
      expect(humanFinal.bank.length).toBe(1);

      const transferredProps = humanFinal.properties.flatMap((s) => s.cards);
      expect(transferredProps.length).toBe(1);
      expect(transferredProps[0].id).toBe("forfeited-prop");
    });

    it("should reject action cards missing required option parameters and leave state unchanged", () => {
      const state = createInitialState();
      const player = state.players.find((p) => p.id === "human")!;

      // Sly Deal without targetCardId
      const slyCard: ActionCard = {
        id: "a-sly",
        name: "Sly Deal",
        type: "Action",
        value: 3,
        actionType: "Sly Deal",
      };
      player.hand = [slyCard];

      const slyAction: GameAction = {
        type: "PLAY_CARD",
        payload: { playerId: "human", cardId: "a-sly", targetZone: "center" },
      };
      const resSly = dispatchAction(state, slyAction);
      expect(resSly.accepted).toBe(false);
      expect(resSly.players.find((p) => p.id === "human")?.hand.length).toBe(1);
      expect(resSly.discardPile.length).toBe(0);
      expect(resSly.actionPointsLeft).toBe(3);

      // Forced Deal without swapCardId
      const forcedCard: ActionCard = {
        id: "a-forced",
        name: "Forced Deal",
        type: "Action",
        value: 3,
        actionType: "Forced Deal",
      };
      player.hand = [forcedCard];

      const forcedAction: GameAction = {
        type: "PLAY_CARD",
        payload: {
          playerId: "human",
          cardId: "a-forced",
          targetZone: "center",
          options: { targetCardId: "target-1" },
        },
      };
      const resForced = dispatchAction(state, forcedAction);
      expect(resForced.accepted).toBe(false);
      expect(resForced.actionPointsLeft).toBe(3);

      // Deal Breaker without targetColor
      const dbCard: ActionCard = {
        id: "a-db",
        name: "Deal Breaker",
        type: "Action",
        value: 5,
        actionType: "Deal Breaker",
      };
      player.hand = [dbCard];

      const dbAction: GameAction = {
        type: "PLAY_CARD",
        payload: { playerId: "human", cardId: "a-db", targetZone: "center" },
      };
      const resDB = dispatchAction(state, dbAction);
      expect(resDB.accepted).toBe(false);
      expect(resDB.actionPointsLeft).toBe(3);

      // Rent without color
      const rentCard: ActionCard = {
        id: "a-rent",
        name: "Rent",
        type: "Action",
        value: 1,
        actionType: "Rent",
      };
      player.hand = [rentCard];

      const rentAction: GameAction = {
        type: "PLAY_CARD",
        payload: { playerId: "human", cardId: "a-rent", targetZone: "center" },
      };
      const resRent = dispatchAction(state, rentAction);
      expect(resRent.accepted).toBe(false);
      expect(resRent.actionPointsLeft).toBe(3);
    });

    it("should reject TOGGLE_WILDCARD_COLOR outside active turn or non-playing state", () => {
      const state = createInitialState();
      const player = state.players.find((p) => p.id === "human")!;
      const wildcard: WildcardCard = {
        id: "w-1",
        name: "Wildcard",
        type: "Wildcard",
        value: 1,
        colors: ["Brown", "Light Blue"],
        currentColor: "Brown",
      };
      player.properties = restructureProperties([wildcard]);

      // Attempt toggle during opponent bot's turn
      state.currentPlayerIndex = 1;

      const toggleAction: GameAction = {
        type: "TOGGLE_WILDCARD_COLOR",
        payload: { playerId: "human", cardId: "w-1", color: "Light Blue" },
      };

      const res = dispatchAction(state, toggleAction);
      expect(res.accepted).toBe(false);
    });

    it("should simulate 5 complete turns cycling between human and bot seamlessly without hanging", () => {
      let state = dispatchAction(createInitialState(), {
        type: "START_GAME",
        payload: { roomCode: "TEST" },
      });

      expect(state.status).toBe("PLAYING");

      for (let turn = 0; turn < 10; turn++) {
        const activePlayer = state.players[state.currentPlayerIndex];

        // Perform actions while points remain
        while (state.actionPointsLeft > 0 && state.status === "PLAYING") {
          const decision = evaluateBotTurnWithBrain(
            state,
            activePlayer.id,
            "Aggressive",
          );
          if (decision.action.type === "END_TURN") {
            break;
          }
          state = dispatchAction(state, decision.action);
        }

        // Action points left === 0 or decision was END_TURN -> dispatch END_TURN
        if (state.status === "PLAYING") {
          state = dispatchAction(state, {
            type: "END_TURN",
            payload: { playerId: activePlayer.id },
          });
        }

        // Handle discard if needed
        if (
          state.status === "DISCARDING" &&
          state.pendingDiscardPlayerId === activePlayer.id
        ) {
          const decision = evaluateBotTurnWithBrain(
            state,
            activePlayer.id,
            "Aggressive",
          );
          state = dispatchAction(state, decision.action);
        }

        expect(state.status).toBe("PLAYING");
      }

      expect(state.logs.length).toBeGreaterThan(10);
    });
  });
});
