import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useGamifiedAudio } from "../../features/audio/AudioContext";
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  X,
  LogOut,
  BookOpen,
  Settings,
  Palette,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onLeaveGame,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { volume, muted, setVolume, setMuted } = useGamifiedAudio();
  const [activeTab, setActiveTab] = useState<"settings" | "rules">("settings");
  const [deckSkin, setDeckSkin] = useState<"classic" | "neon" | "gold">(
    "classic",
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-hidden">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-400 hover:text-slate-100"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "rules"
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-400 hover:text-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Game Rules
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "settings" ? (
          <div className="flex flex-col gap-5 py-2 overflow-y-auto">
            {/* Audio Settings */}
            <div className="flex flex-col gap-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  Sound Effects
                </span>
                <button
                  onClick={() => setMuted(!muted)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    muted
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {muted ? "MUTED" : "ACTIVE"}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (muted) setMuted(false);
                  }}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400 w-8 text-right">
                  {muted ? "0%" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-amber-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-bold text-slate-300">
                  Visual Theme Mode
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                {theme === "dark" ? "Dark Felt" : "Light Felt"}
              </button>
            </div>

            {/* Deck Skin Selector */}
            <div className="flex flex-col gap-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                Deck Skin / Appearance
              </span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(["classic", "neon", "gold"] as const).map((skin) => (
                  <button
                    key={skin}
                    onClick={() => setDeckSkin(skin)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold capitalize transition-all border cursor-pointer ${
                      deckSkin === skin
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {skin}
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Game Action */}
            <button
              onClick={onLeaveGame}
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Exit Current Game
            </button>
          </div>
        ) : (
          /* Rules Tab */
          <div className="flex flex-col gap-3 py-2 overflow-y-auto max-h-[55vh] pr-1 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">
                Goal of the Game
              </h4>
              <p>
                Be the first player to collect 3 complete property color sets!
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">On Your Turn</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Draw 2 cards from the deck (5 if your hand is empty).</li>
                <li>Play up to 3 cards (Properties, Cash, Action cards).</li>
                <li>Re-assigning wildcards on your board is a FREE action.</li>
                <li>End your turn (Discard down to 7 cards if needed).</li>
              </ol>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">Payments & Rent</h4>
              <p>
                When rent or debt is due, pay using cash or properties in your
                bank/board. Change is not given!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
