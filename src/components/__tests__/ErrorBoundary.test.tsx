import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

const BuggyComponent = () => {
  throw new Error("Test Render Error");
};

describe("ErrorBoundary", () => {
  it("catches render errors and renders Recovery UI", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Game Display Error")).toBeInTheDocument();
    expect(screen.getByText(/Test Render Error/)).toBeInTheDocument();
    expect(screen.getByText("Recover Game")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("calls onReset when Recover Game button is clicked", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handleReset = vi.fn();

    render(
      <ErrorBoundary onReset={handleReset}>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText("Recover Game"));
    expect(handleReset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
