import React from "react";
import { CardColor, WildcardCard } from "../../types/game";
import { Sparkles, X } from "lucide-react";

interface WildcardColorModalProps {
  card: WildcardCard;
  onSelectColor: (color: CardColor) => void;
  onClose: () => void;
}

const ALL_10_COLORS: CardColor[] = [
  "Brown",
  "Light Blue",
  "Pink",
  "Orange",
  "Red",
  "Yellow",
  "Green",
  "Dark Blue",
  "Railroad",
  "Utility",
];

const COLOR_STYLES: Record<
  CardColor,
  { bg: string; text: string; border: string }
> = {
  Brown: { bg: "bg-[#795548]", text: "text-white", border: "border-[#5D4037]" },
  "Light Blue": {
    bg: "bg-[#03A9F4]",
    text: "text-slate-900",
    border: "border-[#0288D1]",
  },
  Pink: { bg: "bg-[#E91E63]", text: "text-white", border: "border-[#C2185B]" },
  Orange: {
    bg: "bg-[#FF9800]",
    text: "text-slate-900",
    border: "border-[#F57C00]",
  },
  Red: { bg: "bg-[#F44336]", text: "text-white", border: "border-[#D32F2F]" },
  Yellow: {
    bg: "bg-[#FFEB3B]",
    text: "text-slate-900",
    border: "border-[#FBC02D]",
  },
  Green: { bg: "bg-[#4CAF50]", text: "text-white", border: "border-[#388E3C]" },
  "Dark Blue": {
    bg: "bg-[#1A237E]",
    text: "text-white",
    border: "border-[#0D47A1]",
  },
  Railroad: {
    bg: "bg-[#37474F]",
    text: "text-white",
    border: "border-[#263238]",
  },
  Utility: {
    bg: "bg-[#78909C]",
    text: "text-slate-900",
    border: "border-[#455A64]",
  },
  Any: {
    bg: "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500",
    text: "text-white",
    border: "border-amber-400",
  },
};

export const WildcardColorModal: React.FC<WildcardColorModalProps> = ({
  card,
  onSelectColor,
  onClose,
}) => {
  const isJoker = card.colors.includes("Any") || card.colors.length > 2;
  const colorsToDisplay = isJoker
    ? ALL_10_COLORS
    : card.colors.filter((c) => c !== "Any");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-slate-100">
              Select Wildcard Color
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Choose a property set to assign{" "}
          <span className="text-amber-400 font-semibold">{card.name}</span>.
          Re-assigning wildcards during your turn is a free action.
        </p>

        <div
          className={`grid gap-2 ${isJoker ? "grid-cols-2 max-h-60 overflow-y-auto pr-1" : "grid-cols-2"}`}
        >
          {colorsToDisplay.map((color) => {
            const style = COLOR_STYLES[color] || COLOR_STYLES.Brown;
            const isCurrentlyActive = card.currentColor === color;

            return (
              <button
                key={color}
                onClick={() => {
                  onSelectColor(color);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${style.bg} ${style.border} ${style.text} shadow-md hover:scale-102 active:scale-98 ${
                  isCurrentlyActive
                    ? "ring-4 ring-amber-400 font-extrabold"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">
                  {color}
                </span>
                {isCurrentlyActive && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
