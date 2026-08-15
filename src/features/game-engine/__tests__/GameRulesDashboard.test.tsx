import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GameRulesDashboard } from "../GameRulesDashboard";
import { DEFAULT_CUSTOM_RULES } from "../rules";

describe("GameRulesDashboard", () => {
  it("renders correctly with default rules", () => {
    const handleSave = vi.fn();
    render(<GameRulesDashboard onSaveAndApply={handleSave} />);

    expect(screen.getByText("Game Rules Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Property sets required")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText('Allow "Deal Breakers"')).toBeInTheDocument();
  });

  it("allows incrementing and decrementing required property sets", () => {
    const handleSave = vi.fn();
    render(<GameRulesDashboard onSaveAndApply={handleSave} />);

    const plusBtn = screen.getByText("+");
    const minusBtn = screen.getByText("-");

    fireEvent.click(plusBtn);
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(minusBtn);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onSaveAndApply with modified rules when clicking SAVE & APPLY", () => {
    const handleSave = vi.fn();
    render(<GameRulesDashboard onSaveAndApply={handleSave} />);

    const plusBtn = screen.getByText("+");
    fireEvent.click(plusBtn); // 4 sets

    const saveBtn = screen.getByText("SAVE & APPLY");
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      ...DEFAULT_CUSTOM_RULES,
      setsRequiredToFinish: 4,
    });
  });

  it("resets rules back to standard when RESET TO STANDARD RULES is clicked", () => {
    const handleSave = vi.fn();
    render(<GameRulesDashboard onSaveAndApply={handleSave} />);

    const plusBtn = screen.getByText("+");
    fireEvent.click(plusBtn);
    expect(screen.getByText("4")).toBeInTheDocument();

    const resetBtn = screen.getByText("RESET TO STANDARD RULES");
    fireEvent.click(resetBtn);

    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
