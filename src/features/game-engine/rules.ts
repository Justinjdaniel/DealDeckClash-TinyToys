import {
  CardColor,
  PropertySet,
  PlayerState,
  WildcardCard,
  PropertyCard,
  ActionCard,
  Card,
} from "../../types/game";
import { PROPERTY_SET_REQS } from "./deck";

export const HAND_LIMIT = 7;

export const getPlayerBankCards = (player?: PlayerState | null): Card[] => {
  return player?.bank || [];
};

export const getPlayerPropertyCards = (
  player?: PlayerState | null,
): (PropertyCard | WildcardCard)[] => {
  if (!player?.properties) return [];
  if (Array.isArray(player.properties)) {
    return player.properties.flatMap((s) => s?.cards || []);
  }
  return Object.values(player.properties || {}).flat();
};

export const getPlayerNetWorth = (
  player?: PlayerState | null,
): {
  bankValue: number;
  propValue: number;
  totalAssets: number;
  totalCardsCount: number;
} => {
  const bankCards = getPlayerBankCards(player);
  const totalBankValue = bankCards.reduce(
    (sum, card) => sum + (card?.value || 0),
    0,
  );
  const propCards = getPlayerPropertyCards(player);
  const totalPropValue = propCards.reduce(
    (sum, card) => sum + (card?.value || 0),
    0,
  );
  return {
    bankValue: totalBankValue,
    propValue: totalPropValue,
    totalAssets: totalBankValue + totalPropValue,
    totalCardsCount: bankCards.length + propCards.length,
  };
};

// Checks if a property set of a specific color is complete
export const isSetComplete = (
  cards: (PropertyCard | WildcardCard)[] = [],
  color: CardColor,
): boolean => {
  if (!color || color === "Any" || !Array.isArray(cards)) return false;
  const req = PROPERTY_SET_REQS[color];
  if (!req) return false;

  // Count standard properties and wildcards currently assigned to this color
  const assignedCards = cards.filter((c) => {
    if (!c) return false;
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
export const calculateRent = (set?: PropertySet | null): number => {
  if (!set || !set.color || !Array.isArray(set.cards)) return 0;
  const req = PROPERTY_SET_REQS[set.color];
  if (!req) return 0;

  // Filter cards belonging to this color
  const count = set.cards.filter((c) => {
    if (!c) return false;
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
// Win: 3 completed property sets of different colors
export const checkWinCondition = (player?: PlayerState | null): boolean => {
  if (!player) return false;
  const completedColors = new Set<CardColor>();
  const sets: PropertySet[] = Array.isArray(player.properties)
    ? player.properties
    : Object.values(player.properties || {});

  sets.forEach((set: PropertySet) => {
    if (set && set.color && Array.isArray(set.cards)) {
      if (isSetComplete(set.cards, set.color)) {
        completedColors.add(set.color);
      }
    }
  });

  return completedColors.size >= 3;
};

// Re-evaluate a player's properties and partition them into correct colors, splitting wildcards correctly
export const restructureProperties = (
  cards: (PropertyCard | WildcardCard)[] = [],
): PropertySet[] => {
  const validCards = Array.isArray(cards) ? cards.filter(Boolean) : [];

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

  validCards.forEach((card) => {
    if (card.type === "Property") {
      const propColor = (card as PropertyCard).color;
      if (setsMap[propColor]) {
        setsMap[propColor].push(card);
      }
    } else if (card.type === "Wildcard") {
      const wild = card as WildcardCard;
      if (wild.currentColor && setsMap[wild.currentColor]) {
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
    const setCards = setsMap[color] || [];
    const isComp = isSetComplete(setCards, color);
    return {
      color,
      cards: setCards,
      isComplete: isComp,
    };
  });
};

// Determine if a player has any "Just Say No" card in hand
export const findJSNInHand = (
  player?: PlayerState | null,
): ActionCard | null => {
  if (!player || !Array.isArray(player.hand)) return null;
  const jsn = player.hand.find(
    (c) =>
      c &&
      c.type === "Action" &&
      (c as ActionCard).actionType === "Just Say No",
  );
  return jsn ? (jsn as ActionCard) : null;
};
