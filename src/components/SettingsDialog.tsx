import React, { useState, useEffect, useRef } from "react";
import { useGamifiedAudio } from "../features/audio/AudioContext";

export type DeckSkin = "Classic Deal" | "Tiny Toys" | "Space Clash";

export interface SettingsState {
  soundEffects: boolean;
  music: boolean;
  deckSkin: DeckSkin;
  fastPlay: boolean;
  showTutorial: boolean;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SettingsState;
  onSettingsChange?: (newSettings: SettingsState) => void;
  onContactSupport?: () => void;
  onViewCredits?: () => void;
}

const DEFAULT_SETTINGS: SettingsState = {
  soundEffects: true,
  music: true,
  deckSkin: "Tiny Toys",
  fastPlay: true,
  showTutorial: true,
};

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSettingsChange,
  onContactSupport,
  onViewCredits,
}) => {
  const { playSound, muted, setMuted } = useGamifiedAudio();

  const [settings, setSettings] = useState<SettingsState>(() => {
    if (initialSettings) return initialSettings;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dcc-settings");
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {
          // fallback
        }
      }
    }
    return {
      ...DEFAULT_SETTINGS,
      soundEffects: !muted,
    };
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (dialogRef.current) {
        dialogRef.current.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    playSound("click");
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    if (key === "soundEffects") {
      setMuted(!value);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("dcc-settings", JSON.stringify(updated));
    }

    if (onSettingsChange) {
      onSettingsChange(updated);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
    >
      {/* Outer Dialogue Card with thick blue border and rounded corners matching reference image */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-[#3b5998] text-slate-800 animate-[scaleIn_0.15s_ease-out] flex flex-col items-center">
        {/* Top Decorative Gears overlapping header */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <svg
            className="w-14 h-14 text-blue-200 drop-shadow-md stroke-[#2b3a67] stroke-[2.5]"
            viewBox="0 0 24 24"
            fill="white"
          >
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-extrabold tracking-wider text-[#1e293b] text-center font-sans uppercase">
          SETTINGS
        </h2>

        <div className="w-full space-y-5 mt-4">
          {/* SECTION: AUDIO */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-[#1e293b] uppercase">
              AUDIO
            </h3>

            {/* Sound Effects Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Speaker Icon */}
                <span className="text-2xl" role="img" aria-label="speaker">
                  🔊
                </span>
                <span className="text-sm font-extrabold text-[#1e293b]">
                  Sound Effects
                </span>
              </div>
              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEffects}
                onClick={() =>
                  updateSetting("soundEffects", !settings.soundEffects)
                }
                className={`w-14 h-7 flex items-center rounded-full p-1 border-2 border-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.soundEffects ? "bg-[#4ade80]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full border-2 border-[#1e293b] shadow-md transform transition-transform ${
                    settings.soundEffects ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Music Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Music Note Icon */}
                <span className="text-2xl" role="img" aria-label="music">
                  🎵
                </span>
                <span className="text-sm font-extrabold text-[#1e293b]">
                  Music
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.music}
                onClick={() => updateSetting("music", !settings.music)}
                className={`w-14 h-7 flex items-center rounded-full p-1 border-2 border-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.music ? "bg-[#4ade80]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full border-2 border-[#1e293b] shadow-md transform transition-transform ${
                    settings.music ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION: DECK APPEARANCE */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-[#1e293b] uppercase">
              DECK APPEARANCE
            </h3>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Tiny Cards Graphic */}
                <div className="flex -space-x-2 items-center">
                  <div className="w-5 h-7 rounded border border-black bg-emerald-500 shadow-sm" />
                  <div className="w-5 h-7 rounded border border-black bg-rose-500 shadow-sm" />
                  <div className="w-5 h-7 rounded border border-black bg-sky-500 shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 rounded bg-amber-300" />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#1e293b]">
                  Choose Deck Skin
                </span>
              </div>

              {/* Deck Skin Select Dropdown */}
              <div className="relative">
                <select
                  value={settings.deckSkin}
                  onChange={(e) =>
                    updateSetting("deckSkin", e.target.value as DeckSkin)
                  }
                  className="bg-slate-100 hover:bg-slate-200 border-2 border-[#1e293b] text-[#1e293b] font-bold text-xs rounded-xl px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="Classic Deal">Classic Deal</option>
                  <option value="Tiny Toys">Tiny Toys (Selected)</option>
                  <option value="Space Clash">Space Clash</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1e293b]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: GAMEPLAY */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-[#1e293b] uppercase">
              GAMEPLAY
            </h3>

            {/* Fast Play Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label="stopwatch">
                  ⏱️
                </span>
                <span className="text-sm font-extrabold text-[#1e293b]">
                  Fast Play
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.fastPlay}
                onClick={() => updateSetting("fastPlay", !settings.fastPlay)}
                className={`w-14 h-7 flex items-center rounded-full p-1 border-2 border-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.fastPlay ? "bg-[#4ade80]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full border-2 border-[#1e293b] shadow-md transform transition-transform ${
                    settings.fastPlay ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Show Tutorial Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label="book">
                  📖
                </span>
                <span className="text-sm font-extrabold text-[#1e293b]">
                  Show Tutorial
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showTutorial}
                onClick={() =>
                  updateSetting("showTutorial", !settings.showTutorial)
                }
                className={`w-14 h-7 flex items-center rounded-full p-1 border-2 border-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.showTutorial ? "bg-[#4ade80]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full border-2 border-[#1e293b] shadow-md transform transition-transform ${
                    settings.showTutorial ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION: INFO & SUPPORT */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-widest text-[#1e293b] uppercase">
              INFO & SUPPORT
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Contact Support Block */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1e293b]">
                  <span className="text-lg">💬</span>
                  <span>Support</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound("click");
                    if (onContactSupport) onContactSupport();
                  }}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-[#1e293b] font-black text-[11px] rounded-xl border-2 border-[#1e293b] shadow-sm active:scale-95 transition-transform"
                >
                  CONTACT SUPPORT
                </button>
              </div>

              {/* View Credits Block */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1e293b]">
                  <span className="text-lg">📜</span>
                  <span>Credits</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound("click");
                    if (onViewCredits) onViewCredits();
                  }}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-[#1e293b] font-black text-[11px] rounded-xl border-2 border-[#1e293b] shadow-sm active:scale-95 transition-transform"
                >
                  VIEW CREDITS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CLOSE BUTTON */}
        <div className="mt-6 flex justify-center w-full">
          <button
            type="button"
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="px-8 py-3 bg-[#38bdf8] hover:bg-[#0284c7] text-white font-extrabold text-base rounded-2xl border-4 border-[#1e293b] shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-lg">⚙️</span>
            <span>CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
