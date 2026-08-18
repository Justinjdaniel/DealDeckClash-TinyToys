import React from "react";
import {
  Card,
  CardColor,
  PropertyCard,
  WildcardCard,
  ActionCard,
} from "../../types/game";
import {
  Shield,
  DollarSign,
  Zap,
  Building2,
  Landmark,
  RefreshCw,
  Hand,
  Users,
  Sparkles,
} from "lucide-react";

interface VisualCardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const COLOR_MAP: Record<
  CardColor,
  { bg: string; text: string; header: string; border: string }
> = {
  Brown: {
    bg: "bg-[#795548]",
    text: "text-white",
    header: "#795548",
    border: "border-[#5D4037]",
  },
  "Light Blue": {
    bg: "bg-[#03A9F4]",
    text: "text-slate-900",
    header: "#03A9F4",
    border: "border-[#0288D1]",
  },
  Pink: {
    bg: "bg-[#E91E63]",
    text: "text-white",
    header: "#E91E63",
    border: "border-[#C2185B]",
  },
  Orange: {
    bg: "bg-[#FF9800]",
    text: "text-slate-900",
    header: "#FF9800",
    border: "border-[#F57C00]",
  },
  Red: {
    bg: "bg-[#F44336]",
    text: "text-white",
    header: "#F44336",
    border: "border-[#D32F2F]",
  },
  Yellow: {
    bg: "bg-[#FFEB3B]",
    text: "text-slate-900",
    header: "#FFEB3B",
    border: "border-[#FBC02D]",
  },
  Green: {
    bg: "bg-[#4CAF50]",
    text: "text-white",
    header: "#4CAF50",
    border: "border-[#388E3C]",
  },
  "Dark Blue": {
    bg: "bg-[#1A237E]",
    text: "text-white",
    header: "#1A237E",
    border: "border-[#0D47A1]",
  },
  Railroad: {
    bg: "bg-[#37474F]",
    text: "text-white",
    header: "#37474F",
    border: "border-[#263238]",
  },
  Utility: {
    bg: "bg-[#78909C]",
    text: "text-slate-900",
    header: "#78909C",
    border: "border-[#455A64]",
  },
  Any: {
    bg: "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500",
    text: "text-white",
    header: "#6366F1",
    border: "border-amber-400",
  },
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "Pass Go":
      return <Zap className="w-5 h-5 text-amber-300" />;
    case "Just Say No":
      return <Shield className="w-5 h-5 text-emerald-300" />;
    case "Sly Deal":
    case "Forced Deal":
    case "Deal Breaker":
      return <Hand className="w-5 h-5 text-rose-300" />;
    case "Debt Collector":
    case "Its My Birthday":
      return <Users className="w-5 h-5 text-amber-300" />;
    case "House":
    case "Hotel":
      return <Building2 className="w-5 h-5 text-emerald-300" />;
    case "Rent":
    case "Multi-Rent":
      return <RefreshCw className="w-5 h-5 text-cyan-300" />;
    default:
      return <Sparkles className="w-5 h-5 text-amber-300" />;
  }
};

export const VisualCard: React.FC<VisualCardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  className = "",
  size = "md",
}) => {
  const dimensions = {
    sm: "w-16 h-24 text-[10px]",
    md: "w-20 h-32 text-xs",
    lg: "w-28 h-44 text-sm",
  }[size];

  const valueBadge = (
    <div className="absolute top-1 left-1 bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] shadow flex items-center gap-0.5 border border-amber-200">
      <span>${card.value}M</span>
    </div>
  );

  if (card.type === "Property") {
    const prop = card as PropertyCard;
    const colorStyle = COLOR_MAP[prop.color] || COLOR_MAP.Brown;

    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`relative ${dimensions} rounded-lg bg-slate-900 border-2 ${colorStyle.border} shadow-lg overflow-hidden flex flex-col justify-between p-1 transition-all cursor-pointer ${
          selected ? "ring-4 ring-amber-400 scale-105 z-20" : "hover:scale-102"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        <div
          className={`h-1/3 w-full rounded-t-md ${colorStyle.bg} flex items-center justify-center font-bold uppercase tracking-wider text-[10px] shadow-inner text-center px-1 ${colorStyle.text}`}
        >
          {prop.color}
        </div>
        {valueBadge}
        <div className="flex-1 flex flex-col items-center justify-center p-1 text-center font-semibold text-slate-100">
          <Landmark className="w-5 h-5 mb-0.5 text-amber-400/80" />
          <span className="line-clamp-2 leading-tight">{prop.name}</span>
        </div>
      </div>
    );
  }

  if (card.type === "Wildcard") {
    const wild = card as WildcardCard;
    const activeColor = wild.currentColor || wild.colors[0];
    const isAny = wild.colors.includes("Any") || wild.colors.length > 2;

    const leftColor = wild.colors[0]
      ? COLOR_MAP[wild.colors[0]]
      : COLOR_MAP.Brown;
    const rightColor = wild.colors[1]
      ? COLOR_MAP[wild.colors[1]]
      : COLOR_MAP["Dark Blue"];

    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`relative ${dimensions} rounded-lg bg-slate-900 border-2 border-amber-500/80 shadow-lg overflow-hidden flex flex-col justify-between p-1 transition-all cursor-pointer ${
          selected ? "ring-4 ring-amber-400 scale-105 z-20" : "hover:scale-102"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        {isAny ? (
          <div className="h-1/3 w-full rounded-t-md bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center font-bold text-[10px] text-white shadow-inner uppercase tracking-wider">
            10-COLOR JOKER
          </div>
        ) : (
          <div className="h-1/3 w-full rounded-t-md flex shadow-inner overflow-hidden">
            <div
              className={`w-1/2 h-full ${leftColor.bg} flex items-center justify-center text-[8px] font-bold text-white uppercase`}
            >
              {wild.colors[0]}
            </div>
            <div
              className={`w-1/2 h-full ${rightColor.bg} flex items-center justify-center text-[8px] font-bold text-white uppercase`}
            >
              {wild.colors[1]}
            </div>
          </div>
        )}
        {valueBadge}
        <div className="flex-1 flex flex-col items-center justify-center p-1 text-center font-semibold text-slate-100">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse mb-0.5" />
          <span className="line-clamp-2 leading-tight">{wild.name}</span>
          <span className="text-[9px] text-amber-400 mt-0.5 font-bold uppercase">
            Active: {activeColor}
          </span>
        </div>
      </div>
    );
  }

  if (card.type === "Money") {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`relative ${dimensions} rounded-lg bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 border-2 border-emerald-500/60 shadow-lg overflow-hidden flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer ${
          selected ? "ring-4 ring-amber-400 scale-105 z-20" : "hover:scale-102"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        <div className="w-full flex justify-between items-center text-emerald-400 font-black text-[10px]">
          <span>CASH</span>
          <span>${card.value}M</span>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400/40 bg-emerald-950/80 flex items-center justify-center shadow-inner my-auto">
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
          ${card.value} MILLION
        </div>
      </div>
    );
  }

  if (card.type === "Action") {
    const act = card as ActionCard;
    const actionIcon = getActionIcon(act.actionType);

    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`relative ${dimensions} rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-400/60 shadow-lg overflow-hidden flex flex-col justify-between p-1.5 transition-all cursor-pointer ${
          selected ? "ring-4 ring-amber-400 scale-105 z-20" : "hover:scale-102"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        {valueBadge}
        <div className="flex-1 flex flex-col items-center justify-center p-1 text-center font-semibold text-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-400/40 flex items-center justify-center mb-1 shadow">
            {actionIcon}
          </div>
          <span className="line-clamp-2 leading-tight text-indigo-200 font-bold">
            {act.name}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
