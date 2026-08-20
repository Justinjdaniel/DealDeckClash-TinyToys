import React from "react";
import { CardColor, ActionCard } from "../../types/game";
import { RefreshCw, X } from "lucide-react";

interface RentColorModalProps {
  card: ActionCard;
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

export const RentColorModal: React.FC<RentColorModalProps> = ({
  card,
  onSelectColor,
  onClose,
}) => {
  const isMulti = card.actionType === "Multi-Rent";
  const colorsToDisplay = isMulti
    ? ALL_10_COLORS
    : card.rentColors || ALL_10_COLORS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-slate-100">
              Select Rent Color
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Choose a property set to charge rent for{" "}
          <span className="text-cyan-400 font-semibold">{card.name}</span>.
        </p>

        <div
          className={`grid gap-2 ${colorsToDisplay.length > 2 ? "grid-cols-2 max-h-60 overflow-y-auto pr-1" : "grid-cols-2"}`}
        >
          {colorsToDisplay.map((color) => {
            const style = COLOR_STYLES[color] || COLOR_STYLES.Brown;

            return (
              <button
                key={color}
                onClick={() => {
                  onSelectColor(color);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${style.bg} ${style.border} ${style.text} shadow-md hover:scale-102 active:scale-98 cursor-pointer`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">
                  {color}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
