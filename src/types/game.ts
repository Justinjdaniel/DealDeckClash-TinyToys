export type CardColor =
  | "Brown"
  | "Light Blue"
  | "Pink"
  | "Orange"
  | "Red"
  | "Yellow"
  | "Green"
  | "Dark Blue"
  | "Railroad"
  | "Utility"
  | "Any"; // For multi-colored wildcards

export type CardType = "Property" | "Wildcard" | "Money" | "Action" | "Rent";

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  value: number; // Monetary face value (e.g. 1M to 10M)
  description?: string;
}

export interface PropertyCard extends BaseCard {
  type: "Property";
  color: CardColor;
}

export interface WildcardCard extends BaseCard {
  type: "Wildcard";
  colors: CardColor[]; // e.g. ['Dark Blue', 'Green'] or 'Any' (represented as ['Any'])
  currentColor: CardColor | null; // Selected color
}

export interface MoneyCard extends BaseCard {
  type: "Money";
}

export type ActionCardType =
  | "Pass Go"
  | "Its My Birthday"
  | "Debt Collector"
  | "Sly Deal"
  | "Forced Deal"
  | "Deal Breaker"
  | "Just Say No"
  | "House"
  | "Hotel"
  | "Rent"
  | "Multi-Rent";

export interface ActionCard extends BaseCard {
  type: "Action";
  actionType: ActionCardType;
  rentColors?: CardColor[]; // If Rent or Multi-Rent, these are the colors it applies to
}

export type Card = PropertyCard | WildcardCard | MoneyCard | ActionCard;

export interface PropertySet {
  color: CardColor;
  cards: (PropertyCard | WildcardCard)[];
  isComplete: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
  bank: Card[];
  properties: PropertySet[]; // Organized by color set
}

export interface ReactionState {
  targetPlayerId: string;
  originalActionPlayerId: string;
  actionCard: ActionCard;
  actionDetails: {
    targetCardId?: string;
    targetColor?: CardColor;
    swapCardId?: string; // For Forced Deal
    amount?: number;
  };
  counterChain: {
    playerId: string;
    cardId: string; // The JSN Card used, or 'accept'
  }[];
  timerSeconds: number;
}

export interface CustomGameRules {
  setsRequiredToFinish: number; // default: 3
  allowDealBreakers: boolean; // default: true
  allowForcedDeals: boolean; // default: true
  allowRentCollection: boolean; // default: true
  allowDoubleRent: boolean; // default: true
  fullSetImmunity: boolean; // default: false
  initialHandSize: number; // default: 5
  actionLimitPerTurn: number; // default: 3
  allowWildcards: boolean; // default: true
}

export interface GameState {
  gameId: string;
  roomCode?: string;
  status: "LOBBY" | "PLAYING" | "WINNER" | "DISCARDING";
  players: PlayerState[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  actionPointsLeft: number;
  currentTurnActionsPerformed: number;
  winnerId: string | null;
  reactionQueue: ReactionState | null; // High-priority JSN interaction
  pendingDiscardPlayerId: string | null;
  logs: string[];
  customRules?: CustomGameRules;
}

export type GameAction =
  | {
      type: "START_GAME";
      payload: {
        roomCode?: string;
        botStyle?: string;
        customRules?: CustomGameRules;
      };
    }
  | { type: "RESET_GAME" }
  | {
      type: "PLAY_CARD";
      payload: {
        playerId: string;
        cardId: string;
        targetZone: "bank" | "properties" | "center";
        options?: {
          color?: CardColor;
          targetCardId?: string;
          swapCardId?: string;
          targetColor?: CardColor;
        };
      };
    }
  | { type: "BANK_CARD"; payload: { playerId: string; cardId: string } }
  | {
      type: "TOGGLE_WILDCARD_COLOR";
      payload: { playerId: string; cardId: string; color: CardColor };
    }
  | {
      type: "RESPOND_TO_ACTION";
      payload: {
        playerId: string;
        useJSN: boolean;
        jsnCardId?: string;
        selectedCardIds?: string[];
      };
    }
  | { type: "REACTION_TIMED_OUT" }
  | {
      type: "DISCARD_OVERFLOW";
      payload: { playerId: string; cardIds: string[] };
    }
  | { type: "END_TURN"; payload: { playerId: string } };
