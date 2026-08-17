import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PaymentSelectionModal } from "../PaymentSelectionModal";
import React from "react";

// Mock audio hook
vi.mock("../../../features/audio/AudioContext", () => ({
  useGamifiedAudio: () => ({
    playSound: vi.fn(),
  }),
}));

describe("PaymentSelectionModal Zero-Assets Edge Case", () => {
  it("auto-resolves payment when player has 0 cards in bank and 0 properties", async () => {
    const handleConfirm = vi.fn();

    render(
      <PaymentSelectionModal
        amount={5}
        reason="Action Card: Debt Collector"
        bankCards={[]}
        propertyCards={[]}
        onConfirmPayment={handleConfirm}
      />,
    );

    expect(
      screen.getByText("Player has no assets to pay!"),
    ).toBeInTheDocument();

    await waitFor(
      () => {
        expect(handleConfirm).toHaveBeenCalledWith([]);
      },
      { timeout: 1500 },
    );
  });
});
