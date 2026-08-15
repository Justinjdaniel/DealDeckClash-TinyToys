import { describe, it, expect } from "vitest";
import { createDeck } from "../deck";
import { ActionCard, WildcardCard } from "../../../types/game";

describe("DealDeckClash Game Redesign Tests", () => {
  it("should generate exact deck counts for House, Hotel, Pass Go, 1M cash, Wildcards, and Rent", () => {
    const deck = createDeck();

    const m1Cards = deck.filter((c) => c.type === "Money" && c.value === 1);
    const passGoCards = deck.filter(
      (c) => c.type === "Action" && (c as ActionCard).actionType === "Pass Go",
    );
    const houseCards = deck.filter(
      (c) => c.type === "Action" && (c as ActionCard).actionType === "House",
    );
    const hotelCards = deck.filter(
      (c) => c.type === "Action" && (c as ActionCard).actionType === "Hotel",
    );

    const jokerCards = deck.filter(
      (c) =>
        c.type === "Wildcard" &&
        ((c as WildcardCard).colors.includes("Any") ||
          (c as WildcardCard).colors.length >= 10),
    );
    const dualWildcards = deck.filter(
      (c) => c.type === "Wildcard" && (c as WildcardCard).colors.length === 2,
    );
    const rentCards = deck.filter(
      (c) =>
        c.type === "Action" &&
        ((c as ActionCard).actionType === "Rent" ||
          (c as ActionCard).actionType === "Multi-Rent"),
    );

    expect(m1Cards.length).toBe(4);
    expect(passGoCards.length).toBe(7);
    expect(houseCards.length).toBe(3);
    expect(hotelCards.length).toBe(2);
    expect(jokerCards.length).toBe(2);
    expect(dualWildcards.length).toBe(9);
    expect(rentCards.length).toBe(13);
    expect(deck.length).toBe(99);
  });
});
