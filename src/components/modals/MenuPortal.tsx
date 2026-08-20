import React, { useState } from "react";
import { BotStyle } from "../../features/game-engine/bot";
import { Play, Settings, Sparkles, Users, Cpu } from "lucide-react";

interface MenuPortalProps {
  onStartGame: (style: BotStyle) => void;
  onOpenSettings: () => void;
}

export const MenuPortal: React.FC<MenuPortalProps> = ({
  onStartGame,
  onOpenSettings,
}) => {
  const [selectedBotStyle, setSelectedBotStyle] =
    useState<BotStyle>("Aggressive");
  const [showLobbies, setShowLobbies] = useState(false);

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-slate-100 select-none overflow-hidden">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl flex flex-col items-center gap-5 backdrop-blur text-center">
        {/* Title / Emblem */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            DEAL DECK CLASH
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Monopoly Deal • Mobile-First Engine
          </p>
        </div>

        {/* Play Game Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => onStartGame(selectedBotStyle)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Quick Play
          </button>

          {/* AI Difficulty Selector */}
          <div className="w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Cpu className="w-3 h-3 text-amber-400" /> AI Opponent Personality
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(["Aggressive", "Defensive", "Balanced"] as BotStyle[]).map(
                (style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedBotStyle(style)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedBotStyle === style
                        ? "bg-amber-400 text-slate-950 shadow"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {style}
                  </button>
                ),
              )}
            </div>
          </div>

          <button
            onClick={() => setShowLobbies(!showLobbies)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 text-slate-300 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            {showLobbies ? "Hide Lobbies" : "Lobbies (Room Match)"}
          </button>

          {showLobbies && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
              <p className="text-amber-300 font-bold mb-1">Local Room Lobby</p>
              <p>Room #4092 - Ready for Player 2</p>
              <p className="text-[10px] text-slate-500 mt-1">
                WebSocket server ready for match
              </p>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 active:scale-98 text-slate-400 hover:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings & Rules
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          pnpm • React 19 • Context7 • Framer Motion
        </div>
      </div>
    </div>
  );
};
