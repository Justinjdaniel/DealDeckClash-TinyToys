import React from "react";
import { Star, Flame } from "lucide-react";

interface XPBarProps {
  xp: number;
  level: number;
  streak: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level, streak }) => {
  const xpRequired = level * 1000;
  const percentage = Math.min(100, Math.max(0, (xp / xpRequired) * 100));

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-casino-gold/20 shadow-md">
      {/* Boardroom level indicator */}
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt font-bold px-3 py-1 rounded-full text-xs animate-[scaleIn_0.1s_ease-out]">
        <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
        <span>LVL {level}</span>
      </div>

      {/* Progress slider bar container */}
      <div className="w-40 md:w-56 flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-mono font-bold text-gray-300">
          <span>BOARDROOM LEVEL PROGRESS</span>
          <span>
            {xp}/{xpRequired} XP
          </span>
        </div>
        <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-casino-goldDark to-casino-gold transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(223,183,108,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Combo streak counter */}
      {streak > 1 && (
        <div className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono animate-bounce">
          <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
          <span>STREAK x{streak}!</span>
        </div>
      )}
    </div>
  );
};
