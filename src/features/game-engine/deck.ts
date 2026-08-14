import { Card, CardColor } from "../../types/game";

// Property set requirements (Official Monopoly Deal Rules)
export const PROPERTY_SET_REQS: Record<
  CardColor,
  { count: number; rents: number[] }
> = {
  Brown: { count: 2, rents: [1, 2] },
  "Light Blue": { count: 3, rents: [1, 2, 3] },
  Pink: { count: 3, rents: [1, 2, 4] },
  Orange: { count: 3, rents: [1, 3, 5] },
  Red: { count: 3, rents: [2, 3, 6] },
  Yellow: { count: 3, rents: [2, 4, 6] },
  Green: { count: 3, rents: [2, 4, 7] },
  "Dark Blue": { count: 2, rents: [3, 8] },
  Railroad: { count: 4, rents: [1, 2, 3, 4] },
  Utility: { count: 2, rents: [1, 2] },
  Any: { count: 99, rents: [0] },
};

export const COLOR_HEX: Record<CardColor, string> = {
  Brown: "#795548",
  "Light Blue": "#29b6f6",
  Pink: "#ec407a",
  Orange: "#ff9800",
  Red: "#f44336",
  Yellow: "#fbc02d",
  Green: "#4caf50",
  "Dark Blue": "#0d47a1",
  Railroad: "#424242",
  Utility: "#9e9e9e",
  Any: "#dfb76c",
};

export const createDeck = (): Card[] => {
  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}-${idCounter++}`;
  const cards: Card[] = [];

  // 1. Money Cards
  // 1x 10M
  cards.push({
    id: nextId("m10"),
    name: "10M Money",
    type: "Money",
    value: 10,
    description: "10M Face Value Bankable Cash",
  });
  // 2x 5M
  for (let i = 0; i < 2; i++)
    cards.push({
      id: nextId("m5"),
      name: "5M Money",
      type: "Money",
      value: 5,
      description: "5M Face Value Bankable Cash",
    });
  // 3x 4M
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("m4"),
      name: "4M Money",
      type: "Money",
      value: 4,
      description: "4M Face Value Bankable Cash",
    });
  // 3x 3M
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("m3"),
      name: "3M Money",
      type: "Money",
      value: 3,
      description: "3M Face Value Bankable Cash",
    });
  // 5x 2M
  for (let i = 0; i < 5; i++)
    cards.push({
      id: nextId("m2"),
      name: "2M Money",
      type: "Money",
      value: 2,
      description: "2M Face Value Bankable Cash",
    });
  // 6x 1M
  for (let i = 0; i < 6; i++)
    cards.push({
      id: nextId("m1"),
      name: "1M Money",
      type: "Money",
      value: 1,
      description: "1M Face Value Bankable Cash",
    });

  // 2. Properties (Standard)
  // Brown (2 cards)
  cards.push({
    id: nextId("p-br-1"),
    name: "Baltic Avenue",
    type: "Property",
    value: 1,
    color: "Brown",
  });
  cards.push({
    id: nextId("p-br-2"),
    name: "Mediterranean Avenue",
    type: "Property",
    value: 1,
    color: "Brown",
  });
  // Light Blue (3 cards)
  cards.push({
    id: nextId("p-lb-1"),
    name: "Connecticut Avenue",
    type: "Property",
    value: 1,
    color: "Light Blue",
  });
  cards.push({
    id: nextId("p-lb-2"),
    name: "Oriental Avenue",
    type: "Property",
    value: 1,
    color: "Light Blue",
  });
  cards.push({
    id: nextId("p-lb-3"),
    name: "Vermont Avenue",
    type: "Property",
    value: 1,
    color: "Light Blue",
  });
  // Pink (3 cards)
  cards.push({
    id: nextId("p-pi-1"),
    name: "St. Charles Place",
    type: "Property",
    value: 2,
    color: "Pink",
  });
  cards.push({
    id: nextId("p-pi-2"),
    name: "States Avenue",
    type: "Property",
    value: 2,
    color: "Pink",
  });
  cards.push({
    id: nextId("p-pi-3"),
    name: "Virginia Avenue",
    type: "Property",
    value: 2,
    color: "Pink",
  });
  // Orange (3 cards)
  cards.push({
    id: nextId("p-or-1"),
    name: "Bow Street",
    type: "Property",
    value: 2,
    color: "Orange",
  });
  cards.push({
    id: nextId("p-or-2"),
    name: "Marlborough Street",
    type: "Property",
    value: 2,
    color: "Orange",
  });
  cards.push({
    id: nextId("p-or-3"),
    name: "New York Avenue",
    type: "Property",
    value: 2,
    color: "Orange",
  });
  // Red (3 cards)
  cards.push({
    id: nextId("p-re-1"),
    name: "Illinois Avenue",
    type: "Property",
    value: 3,
    color: "Red",
  });
  cards.push({
    id: nextId("p-re-2"),
    name: "Indiana Avenue",
    type: "Property",
    value: 3,
    color: "Red",
  });
  cards.push({
    id: nextId("p-re-3"),
    name: "Kentucky Avenue",
    type: "Property",
    value: 3,
    color: "Red",
  });
  // Yellow (3 cards)
  cards.push({
    id: nextId("p-ye-1"),
    name: "Atlantic Avenue",
    type: "Property",
    value: 3,
    color: "Yellow",
  });
  cards.push({
    id: nextId("p-ye-2"),
    name: "Leicester Square",
    type: "Property",
    value: 3,
    color: "Yellow",
  });
  cards.push({
    id: nextId("p-ye-3"),
    name: "Marvin Gardens",
    type: "Property",
    value: 3,
    color: "Yellow",
  });
  // Green (3 cards)
  cards.push({
    id: nextId("p-gr-1"),
    name: "North Carolina Avenue",
    type: "Property",
    value: 4,
    color: "Green",
  });
  cards.push({
    id: nextId("p-gr-2"),
    name: "Pacific Avenue",
    type: "Property",
    value: 4,
    color: "Green",
  });
  cards.push({
    id: nextId("p-gr-3"),
    name: "Pennsylvania Avenue",
    type: "Property",
    value: 4,
    color: "Green",
  });
  // Dark Blue (2 cards)
  cards.push({
    id: nextId("p-db-1"),
    name: "Boardwalk",
    type: "Property",
    value: 4,
    color: "Dark Blue",
  });
  cards.push({
    id: nextId("p-db-2"),
    name: "Park Place",
    type: "Property",
    value: 4,
    color: "Dark Blue",
  });
  // Railroad (4 cards)
  cards.push({
    id: nextId("p-rr-1"),
    name: "Reading Railroad",
    type: "Property",
    value: 2,
    color: "Railroad",
  });
  cards.push({
    id: nextId("p-rr-2"),
    name: "Pennsylvania Railroad",
    type: "Property",
    value: 2,
    color: "Railroad",
  });
  cards.push({
    id: nextId("p-rr-3"),
    name: "B. & O. Railroad",
    type: "Property",
    value: 2,
    color: "Railroad",
  });
  cards.push({
    id: nextId("p-rr-4"),
    name: "Short Line Railroad",
    type: "Property",
    value: 2,
    color: "Railroad",
  });
  // Utility (2 cards)
  cards.push({
    id: nextId("p-ut-1"),
    name: "Electric Company",
    type: "Property",
    value: 2,
    color: "Utility",
  });
  cards.push({
    id: nextId("p-ut-2"),
    name: "Water Works",
    type: "Property",
    value: 2,
    color: "Utility",
  });

  // 3. Wildcards
  // 1x Light Blue & Brown
  cards.push({
    id: nextId("w-lbr"),
    name: "Wildcard: L-Blue & Brown",
    type: "Wildcard",
    value: 1,
    colors: ["Light Blue", "Brown"],
    currentColor: null,
    description: "Dual color wildcard",
  });
  // 1x Light Blue & Railroad
  cards.push({
    id: nextId("w-lrr"),
    name: "Wildcard: L-Blue & Railroad",
    type: "Wildcard",
    value: 4,
    colors: ["Light Blue", "Railroad"],
    currentColor: null,
    description: "Dual color wildcard",
  });
  // 2x Pink & Orange
  for (let i = 0; i < 2; i++)
    cards.push({
      id: nextId("w-po"),
      name: "Wildcard: Pink & Orange",
      type: "Wildcard",
      value: 2,
      colors: ["Pink", "Orange"],
      currentColor: null,
      description: "Dual color wildcard",
    });
  // 2x Red & Yellow
  for (let i = 0; i < 2; i++)
    cards.push({
      id: nextId("w-ry"),
      name: "Wildcard: Red & Yellow",
      type: "Wildcard",
      value: 3,
      colors: ["Red", "Yellow"],
      currentColor: null,
      description: "Dual color wildcard",
    });
  // 1x Green & Railroad
  cards.push({
    id: nextId("w-grr"),
    name: "Wildcard: Green & Railroad",
    type: "Wildcard",
    value: 4,
    colors: ["Green", "Railroad"],
    currentColor: null,
    description: "Dual color wildcard",
  });
  // 1x Dark Blue & Green
  cards.push({
    id: nextId("w-dbg"),
    name: "Wildcard: D-Blue & Green",
    type: "Wildcard",
    value: 4,
    colors: ["Dark Blue", "Green"],
    currentColor: null,
    description: "Dual color wildcard",
  });
  // 1x Utility & Railroad
  cards.push({
    id: nextId("w-utr"),
    name: "Wildcard: Utility & Railroad",
    type: "Wildcard",
    value: 2,
    colors: ["Utility", "Railroad"],
    currentColor: null,
    description: "Dual color wildcard",
  });
  // 2x Multi-color wildcards (Any color)
  for (let i = 0; i < 2; i++)
    cards.push({
      id: nextId("w-any"),
      name: "Wildcard: Multi-Color",
      type: "Wildcard",
      value: 0,
      colors: [
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
      ],
      currentColor: null,
      description: "Multi-Color Wildcard",
    });

  // 4. Action Cards
  // 10x Pass Go (Draw 2 extra cards)
  for (let i = 0; i < 10; i++)
    cards.push({
      id: nextId("a-pg"),
      name: "Pass Go",
      type: "Action",
      value: 1,
      actionType: "Pass Go",
      description: "Draw 2 extra cards.",
    });
  // 3x It\'s My Birthday (All players pay 2M)
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("a-imb"),
      name: "It's My Birthday",
      type: "Action",
      value: 2,
      actionType: "Its My Birthday",
      description: "All players owe you 2M.",
    });
  // 3x Debt Collector (One player pays 5M)
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("a-dc"),
      name: "Debt Collector",
      type: "Action",
      value: 3,
      actionType: "Debt Collector",
      description: "Force one player to pay you 5M.",
    });
  // 3x Sly Deal (Steal one property from someone)
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("a-sd"),
      name: "Sly Deal",
      type: "Action",
      value: 3,
      actionType: "Sly Deal",
      description: "Steal an individual property (cannot be a completed set).",
    });
  // 3x Forced Deal (Swap a property with someone else)
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("a-fd"),
      name: "Forced Deal",
      type: "Action",
      value: 3,
      actionType: "Forced Deal",
      description: "Swap properties with another player.",
    });
  // 2x Deal Breaker (Steal a completed set)
  for (let i = 0; i < 2; i++)
    cards.push({
      id: nextId("a-db"),
      name: "Deal Breaker",
      type: "Action",
      value: 5,
      actionType: "Deal Breaker",
      description: "Steal a completed property set.",
    });
  // 3x Just Say No (Counter any Action card)
  for (let i = 0; i < 3; i++)
    cards.push({
      id: nextId("a-jsn"),
      name: "Just Say No",
      type: "Action",
      value: 4,
      actionType: "Just Say No",
      description: "Counter any Action card played against you.",
    });

  // 5. Rent & Multi-Rent Cards
  // Rent cards are technically action cards
  const rentConfigs: { colors: CardColor[]; count: number; value: number }[] = [
    { colors: ["Brown", "Light Blue"], count: 2, value: 1 },
    { colors: ["Pink", "Orange"], count: 2, value: 1 },
    { colors: ["Red", "Yellow"], count: 2, value: 1 },
    { colors: ["Green", "Dark Blue"], count: 2, value: 1 },
    { colors: ["Railroad", "Utility"], count: 2, value: 1 },
  ];

  rentConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      cards.push({
        id: nextId(
          `r-${cfg.colors[0].substring(0, 2)}-${cfg.colors[1].substring(0, 2)}`,
        ),
        name: `Rent (${cfg.colors[0]} & ${cfg.colors[1]})`,
        type: "Action",
        value: cfg.value,
        actionType: "Rent",
        rentColors: cfg.colors,
        description: `Charge rent on your ${cfg.colors[0]} or ${cfg.colors[1]} property sets.`,
      });
    }
  });

  // 3x Multi-Rent Cards (Rent on ANY color - charges 1 player)
  for (let i = 0; i < 3; i++) {
    cards.push({
      id: nextId("r-multi"),
      name: "Multi-Color Rent",
      type: "Action",
      value: 3,
      actionType: "Multi-Rent",
      rentColors: [
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
      ],
      description: "Charge rent on ANY color property set to one player.",
    });
  }

  return cards;
};

// Knuth shuffle
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
