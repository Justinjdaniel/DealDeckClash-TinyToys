import React from "react";
import { BotStyle } from "../../features/game-engine/bot";
import { Play, Shield, Settings, Sparkles } from "lucide-react";

interface MenuPortalProps {
  onStartGame: (style: BotStyle) => void;
  onOpenSettings: () => void;
}

export const MenuPortal: React.FC<MenuPortalProps> = ({
  onStartGame,
  onOpenSettings,
}) => {
  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-slate-100 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl flex flex-col items-center gap-6 backdrop-blur text-center">
        {/* Title / Emblem */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            MONOPOLY DEAL
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Mobile-First Card Game Engine
          </p>
        </div>

        {/* Play Game Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => onStartGame("Aggressive")}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Quick Play vs AI
          </button>

          <button
            onClick={() => onStartGame("Defensive")}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 text-slate-200 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            VS Defensive AI
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 active:scale-98 text-slate-400 hover:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings & Rules
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          pnpm • React 19 • Framer Motion • Context7
        </div>
      </div>
    </div>
  );
};
