import { describe, it, expect } from "vitest";
import { createDeck } from "../deck";
import { ActionCard, WildcardCard } from "../../../types/game";

describe("DealDeckClash Game Redesign Tests", () => {
  it("should create deck containing House and Hotel cards", () => {
    const deck = createDeck();
    const houseCards = deck.filter(
      (c) => c.type === "Action" && (c as ActionCard).actionType === "House",
    );
    const hotelCards = deck.filter(
      (c) => c.type === "Action" && (c as ActionCard).actionType === "Hotel",
    );

    expect(houseCards.length).toBe(3);
    expect(hotelCards.length).toBe(2);
    expect(houseCards[0].value).toBe(3);
    expect(hotelCards[0].value).toBe(4);
  });

  it("should identify 10-color Joker wildcards vs 2-color Dual wildcards", () => {
    const deck = createDeck();
    const jokerCards = deck.filter(
      (c) =>
        c.type === "Wildcard" &&
        ((c as WildcardCard).colors.includes("Any") ||
          (c as WildcardCard).colors.length >= 10),
    );
    const dualWildcards = deck.filter(
      (c) => c.type === "Wildcard" && (c as WildcardCard).colors.length === 2,
    );

    expect(jokerCards.length).toBeGreaterThan(0);
    expect(dualWildcards.length).toBeGreaterThan(0);
    expect((dualWildcards[0] as WildcardCard).colors.length).toBe(2);
  });

  it("should identify Rent cards for all-black design", () => {
    const deck = createDeck();
    const rentCards = deck.filter(
      (c) =>
        c.type === "Action" &&
        ((c as ActionCard).actionType === "Rent" ||
          (c as ActionCard).actionType === "Multi-Rent"),
    );

    expect(rentCards.length).toBeGreaterThan(0);
    expect((rentCards[0] as ActionCard).rentColors).toBeDefined();
  });
});
