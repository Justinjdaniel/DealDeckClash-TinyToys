import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Menu } from "../Menu";
import { AudioProvider } from "../../audio/AudioContext";
import { DEFAULT_CUSTOM_RULES } from "../rules";

describe("Menu Component Redesign", () => {
  it("renders main title, user profile, coins, and play CTA", () => {
    const handleStartGame = vi.fn();
    render(
      <AudioProvider>
        <Menu onStartGame={handleStartGame} />
      </AudioProvider>,
    );

    expect(screen.getByText("DEAL DECK CLASH")).toBeInTheDocument();
    expect(screen.getByText("Tiny Toys Edition")).toBeInTheDocument();
    expect(screen.getByText("Tycoon Player")).toBeInTheDocument();
    expect(screen.getByText(/2,450/)).toBeInTheDocument();
    expect(screen.getByText(/QUICK MATCH VS AGGRESSIVE/)).toBeInTheDocument();
  });

  it("allows selecting bot personality and clicking play", () => {
    const handleStartGame = vi.fn();
    render(
      <AudioProvider>
        <Menu onStartGame={handleStartGame} />
      </AudioProvider>,
    );

    const tacticalBotBtn = screen.getByText("Tactical Bot");
    fireEvent.click(tacticalBotBtn);

    const playBtn = screen.getByText(/QUICK MATCH VS TACTICAL/);
    fireEvent.click(playBtn);

    expect(handleStartGame).toHaveBeenCalledWith(
      "Tactical",
      undefined,
      DEFAULT_CUSTOM_RULES,
    );
  });

  it("switches to online arena tab and back", () => {
    const handleStartGame = vi.fn();
    render(
      <AudioProvider>
        <Menu onStartGame={handleStartGame} />
      </AudioProvider>,
    );

    const onlineTab = screen.getByText("Online Arena");
    fireEvent.click(onlineTab);

    expect(screen.getByText("Live Arena Lobbies")).toBeInTheDocument();

    const soloTab = screen.getByText("Solo vs AI Bot");
    fireEvent.click(soloTab);

    expect(screen.getByText("Select Bot Personality")).toBeInTheDocument();
  });
});
