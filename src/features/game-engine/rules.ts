import {
  CardColor,
  PropertySet,
  PlayerState,
  WildcardCard,
  PropertyCard,
  ActionCard,
  CustomGameRules,
} from "../../types/game";
import { PROPERTY_SET_REQS } from "./deck";

export const HAND_LIMIT = 7;

export const DEFAULT_CUSTOM_RULES: CustomGameRules = {
  setsRequiredToFinish: 3,
  allowDealBreakers: true,
  allowForcedDeals: true,
  allowRentCollection: true,
  allowDoubleRent: true,
  fullSetImmunity: false,
  initialHandSize: 5,
  actionLimitPerTurn: 3,
  allowWildcards: true,
};

// Checks if a property set of a specific color is complete
export const isSetComplete = (
  cards: (PropertyCard | WildcardCard)[],
  color: CardColor,
): boolean => {
  if (color === "Any") return false;
  const req = PROPERTY_SET_REQS[color];
  if (!req) return false;

  // Count standard properties and wildcards currently assigned to this color
  const assignedCards = cards.filter((c) => {
    if (c.type === "Property") {
      return (c as PropertyCard).color === color;
    } else if (c.type === "Wildcard") {
      return (c as WildcardCard).currentColor === color;
    }
    return false;
  });

  return assignedCards.length >= req.count;
};

// Calculate the total rent for a specific color set
export const calculateRent = (set: PropertySet): number => {
  const req = PROPERTY_SET_REQS[set.color];
  if (!req) return 0;

  // Filter cards belonging to this color
  const count = set.cards.filter((c) => {
    if (c.type === "Property") return (c as PropertyCard).color === set.color;
    if (c.type === "Wildcard")
      return (c as WildcardCard).currentColor === set.color;
    return false;
  }).length;

  if (count === 0) return 0;
  const index = Math.min(count - 1, req.rents.length - 1);
  return req.rents[index] || 0;
};

// Helper to check if a player has achieved the victory condition
// Win: setsRequiredToFinish completed property sets of different colors
export const checkWinCondition = (
  player: PlayerState,
  setsRequired: number = 3,
): boolean => {
  const completedColors = new Set<CardColor>();
  player.properties.forEach((set) => {
    if (isSetComplete(set.cards, set.color)) {
      completedColors.add(set.color);
    }
  });
  return completedColors.size >= setsRequired;
};

// Re-evaluate a player's properties and partition them into correct colors, splitting wildcards correctly
export const restructureProperties = (
  cards: (PropertyCard | WildcardCard)[],
): PropertySet[] => {
  const setsMap: Record<CardColor, (PropertyCard | WildcardCard)[]> = {
    Brown: [],
    "Light Blue": [],
    Pink: [],
    Orange: [],
    Red: [],
    Yellow: [],
    Green: [],
    "Dark Blue": [],
    Railroad: [],
    Utility: [],
    Any: [],
  };

  cards.forEach((card) => {
    if (card.type === "Property") {
      setsMap[(card as PropertyCard).color].push(card);
    } else if (card.type === "Wildcard") {
      const wild = card as WildcardCard;
      if (wild.currentColor) {
        setsMap[wild.currentColor].push(wild);
      } else {
        setsMap["Any"].push(wild);
      }
    }
  });

  const colors: CardColor[] = [
    "Brown",
    "Light Blue",
    "Pink",
    "Orange",
    "Red",
    "Yellow",
    "Green",
    "Dark Blue",
    "Railroad",
    "Utility",
    "Any",
  ];

  return colors.map((color) => {
    const setCards = setsMap[color];
    const isComp = isSetComplete(setCards, color);
    return {
      color,
      cards: setCards,
      isComplete: isComp,
    };
  });
};

// Determine if a player has any "Just Say No" card in hand
export const findJSNInHand = (player: PlayerState): ActionCard | null => {
  const jsn = player.hand.find(
    (c) =>
      c.type === "Action" && (c as ActionCard).actionType === "Just Say No",
  );
  return jsn ? (jsn as ActionCard) : null;
};
