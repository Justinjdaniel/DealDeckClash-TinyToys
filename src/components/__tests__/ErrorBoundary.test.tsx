import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

const BuggyComponent = () => {
  throw new Error("Test Render Error");
};

const HealthyComponent = () => <div>Healthy Component</div>;

const RecoveryHarness = ({ onReset }: { onReset: () => void }) => {
  const [hasError, setHasError] = useState(true);

  return (
    <ErrorBoundary
      onReset={() => {
        onReset();
        setHasError(false);
      }}
    >
      {hasError ? <BuggyComponent /> : <HealthyComponent />}
    </ErrorBoundary>
  );
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

  it("calls onReset when Recover Game button is clicked and renders healthy component", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handleReset = vi.fn();

    render(<RecoveryHarness onReset={handleReset} />);

    expect(screen.getByText("Game Display Error")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Recover Game"));

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Healthy Component")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
