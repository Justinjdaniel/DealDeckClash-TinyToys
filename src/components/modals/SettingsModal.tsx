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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {activeTab === "settings" ? (
          <div className="flex flex-col gap-5 py-2 overflow-y-auto">
            {/* Audio Section */}
            <div className="flex flex-col gap-2 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  Sound Effects Volume
                </span>
                <button
                  onClick={() => setMuted(!muted)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all ${
                    muted
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {muted ? "MUTED" : "ACTIVE"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  if (muted) setMuted(false);
                  setVolume(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Theme Toggle Section */}
            <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                Appearance Mode
              </span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-xs font-bold text-amber-400 transition-all"
              >
                {theme === "dark" ? "Dark Felt Theme" : "Light Mode"}
              </button>
            </div>

            {/* Exit Game Action */}
            <button
              onClick={() => {
                onClose();
                onLeaveGame();
              }}
              className="mt-2 w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Exit / Leave Current Game
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2 text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto pr-1">
            <h4 className="font-bold text-amber-400 text-sm">
              Monopoly Deal Rules Summary
            </h4>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>
                <strong>Win Condition:</strong> Complete 3 full property sets of
                different colors.
              </li>
              <li>
                <strong>Action Limit:</strong> You have 3 action points per
                turn.
              </li>
              <li>
                <strong>Hand Limit:</strong> Maximum 7 cards in hand at turn
                end. Overflow must be discarded.
              </li>
              <li>
                <strong>Wildcards:</strong> Can be played or re-assigned between
                matching sets for FREE on your turn.
              </li>
              <li>
                <strong>Bank Vault:</strong> Cash and Action cards stored in
                bank cannot be stolen by Sly Deal or Forced Deal.
              </li>
              <li>
                <strong>Just Say No:</strong> Can be played instantly to block
                any action card attack.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
