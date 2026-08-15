import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { SettingsDialog } from "../SettingsDialog";
import { AudioProvider } from "../../features/audio/AudioContext";

describe("SettingsDialog", () => {
  it("renders correctly when open", () => {
    render(
      <AudioProvider>
        <SettingsDialog isOpen={true} onClose={() => {}} />
      </AudioProvider>,
    );

    expect(
      screen.getByRole("dialog", { name: /settings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("SETTINGS")).toBeInTheDocument();
    expect(screen.getByText("Sound Effects")).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Choose Deck Skin")).toBeInTheDocument();
    expect(screen.getByText("Fast Play")).toBeInTheDocument();
    expect(screen.getByText("Show Tutorial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <AudioProvider>
        <SettingsDialog isOpen={false} onClose={() => {}} />
      </AudioProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when CLOSE button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <AudioProvider>
        <SettingsDialog isOpen={true} onClose={handleClose} />
      </AudioProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("handles setting changes and notifies parent", () => {
    const handleSettingsChange = vi.fn();
    render(
      <AudioProvider>
        <SettingsDialog
          isOpen={true}
          onClose={() => {}}
          onSettingsChange={handleSettingsChange}
        />
      </AudioProvider>,
    );

    const switches = screen.getAllByRole("switch");
    // Toggle first switch (Sound Effects)
    fireEvent.click(switches[0]);
    expect(handleSettingsChange).toHaveBeenCalled();

    // Change deck skin dropdown
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Classic Deal" } });
    expect(handleSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ deckSkin: "Classic Deal" }),
    );
  });

  it("triggers support and credits callbacks", () => {
    const handleSupport = vi.fn();
    const handleCredits = vi.fn();

    render(
      <AudioProvider>
        <SettingsDialog
          isOpen={true}
          onClose={() => {}}
          onContactSupport={handleSupport}
          onViewCredits={handleCredits}
        />
      </AudioProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /contact support/i }));
    expect(handleSupport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /view credits/i }));
    expect(handleCredits).toHaveBeenCalledTimes(1);
  });
});
