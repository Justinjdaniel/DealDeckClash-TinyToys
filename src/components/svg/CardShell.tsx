import React from "react";
import {
  Card,
  CardColor,
  PropertyCard,
  WildcardCard,
  ActionCard,
} from "../../types/game";

interface CardShellProps {
  card: Card;
  isFlipped?: boolean;
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

const COLOR_MAP: Record<CardColor, string> = {
  Brown: "#795548",
  "Light Blue": "#29b6f6",
  Pink: "#ec407a",
  Orange: "#ff9800",
  Red: "#f44336",
  Yellow: "#fbc02d",
  Green: "#4caf50",
  "Dark Blue": "#0d47a1",
  Railroad: "#374151",
  Utility: "#78909c",
  Any: "#d97706",
};

const PROPERTY_RENT_TABLE: Record<string, { [key: string]: string }> = {
  Brown: { "1 Prop": "$1M", "2 Props (Set)": "$2M" },
  "Light Blue": { "1 Prop": "$1M", "2 Props": "$2M", "3 Props (Set)": "$3M" },
  Pink: { "1 Prop": "$1M", "2 Props": "$2M", "3 Props (Set)": "$4M" },
  Orange: { "1 Prop": "$1M", "2 Props": "$3M", "3 Props (Set)": "$5M" },
  Red: { "1 Prop": "$2M", "2 Props": "$3M", "3 Props (Set)": "$6M" },
  Yellow: { "1 Prop": "$2M", "2 Props": "$4M", "3 Props (Set)": "$6M" },
  Green: { "1 Prop": "$2M", "2 Props": "$4M", "3 Props (Set)": "$7M" },
  "Dark Blue": { "1 Prop": "$3M", "2 Props (Set)": "$8M" },
  Railroad: {
    "1 Prop": "$1M",
    "2 Props": "$2M",
    "3 Props": "$3M",
    "4 Props (Set)": "$4M",
  },
  Utility: { "1 Prop": "$1M", "2 Props (Set)": "$2M" },
};

interface ValueBadgeProps {
  x: number;
  y: number;
  value: number;
  fill?: string;
  stroke?: string;
  textFill?: string;
}

const ValueBadge: React.FC<ValueBadgeProps> = ({
  x,
  y,
  value,
  fill = "#dc2626",
  stroke = "#ffffff",
  textFill = "#ffffff",
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx="0" cy="0" r="18" fill={fill} stroke={stroke} strokeWidth="2" />
    <text
      x="0"
      y="5"
      fontFamily="sans-serif"
      fontSize="13"
      fontWeight="900"
      fill={textFill}
      textAnchor="middle"
    >
      ${value}M
    </text>
  </g>
);

export const CardShell: React.FC<CardShellProps> = ({
  card,
  isFlipped = false,
}) => {
  const cardIdSafe = card.id.replace(/[^a-zA-Z0-9]/g, "");
  const accessibleTitle = `${card.name} (${card.value}M)`;

  // --- CARD BACK DESIGN ---
  if (isFlipped) {
    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>Card Back</title>
        <defs>
          <linearGradient
            id={`cardBackBg-${cardIdSafe}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#1e1e2e" />
            <stop offset="50%" stopColor="#0f0f17" />
            <stop offset="100%" stopColor="#020205" />
          </linearGradient>

          <linearGradient
            id={`backGoldGrad-${cardIdSafe}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#dfb76c" />
            <stop offset="50%" stopColor="#b28c46" />
            <stop offset="100%" stopColor="#dfb76c" />
          </linearGradient>

          <pattern
            id={`cardBackPattern-${cardIdSafe}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 10 L 20 10 M 10 0 L 10 20"
              stroke="#dfb76c"
              strokeWidth="0.5"
              strokeOpacity="0.12"
            />
            <circle cx="10" cy="10" r="1.5" fill="#dfb76c" fillOpacity="0.15" />
          </pattern>
        </defs>

        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="18"
          fill={`url(#cardBackBg-${cardIdSafe})`}
          stroke={`url(#backGoldGrad-${cardIdSafe})`}
          strokeWidth="3"
        />

        <rect
          x="15"
          y="15"
          width="270"
          height="390"
          rx="10"
          fill={`url(#cardBackPattern-${cardIdSafe})`}
        />

        <g transform="translate(150, 210)">
          <circle
            cx="0"
            cy="0"
            r="45"
            fill="#0f0f17"
            stroke={`url(#backGoldGrad-${cardIdSafe})`}
            strokeWidth="2.5"
          />
          <text
            x="0"
            y="-2"
            fontFamily="Georgia, serif"
            fontSize="12"
            fontWeight="bold"
            fill={`url(#backGoldGrad-${cardIdSafe})`}
            textAnchor="middle"
            letterSpacing="1"
          >
            DEAL
          </text>
          <text
            x="0"
            y="14"
            fontFamily="Georgia, serif"
            fontSize="10"
            fontWeight="bold"
            fill={`url(#backGoldGrad-${cardIdSafe})`}
            textAnchor="middle"
            letterSpacing="0.5"
          >
            CLASH
          </text>
        </g>
      </svg>
    );
  }

  const isRentCard =
    card.type === "Action" &&
    ((card as ActionCard).actionType === "Rent" ||
      (card as ActionCard).actionType === "Multi-Rent");

  const isJokerWildcard =
    card.type === "Wildcard" &&
    ((card as WildcardCard).colors.includes("Any") ||
      (card as WildcardCard).colors.length >= 10);

  const isDualWildcard =
    card.type === "Wildcard" &&
    !isJokerWildcard &&
    (card as WildcardCard).colors.length === 2;

  const isPassGo =
    card.type === "Action" &&
    ((card as ActionCard).actionType === "Pass Go" || card.name === "Pass Go");

  // --- PASS GO CARD DESIGN ---
  if (isPassGo) {
    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#faf8f5"
          stroke="#1e293b"
          strokeWidth="3"
        />
        <rect
          x="14"
          y="14"
          width="272"
          height="392"
          rx="14"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#dc2626"
          stroke="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#dc2626"
          stroke="#ffffff"
        />

        <text
          x="150"
          y="44"
          fontFamily="sans-serif"
          fontSize="16"
          fontWeight="800"
          fill="#1e293b"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          PASS GO
        </text>

        <g transform="translate(150, 195)">
          <polygon
            points="0,-85 95,0 0,85 -95,0"
            fill="#111827"
            stroke="#dc2626"
            strokeWidth="3.5"
          />
          <text
            x="0"
            y="-12"
            fontFamily="Impact, Arial Black, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="2"
          >
            PASS
          </text>
          <text
            x="0"
            y="32"
            fontFamily="Impact, Arial Black, sans-serif"
            fontSize="44"
            fontWeight="900"
            fill="#ef4444"
            textAnchor="middle"
            letterSpacing="2"
          >
            GO
          </text>
        </g>

        <rect
          x="30"
          y="310"
          width="240"
          height="42"
          rx="8"
          fill="#f3f4f6"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <text
          x="150"
          y="328"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="bold"
          fill="#1e293b"
          textAnchor="middle"
        >
          COLLECT $2M
        </text>
        <text
          x="150"
          y="342"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="600"
          fill="#475569"
          textAnchor="middle"
        >
          Draw 2 cards from deck
        </text>
      </svg>
    );
  }

  // --- JOKER CARD DESIGN ---
  if (isJokerWildcard) {
    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3"
        />
        <rect
          x="14"
          y="14"
          width="272"
          height="392"
          rx="14"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#1e293b"
          stroke="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#1e293b"
          stroke="#ffffff"
        />

        <text
          x="150"
          y="42"
          fontFamily="sans-serif"
          fontSize="17"
          fontWeight="900"
          fill="#0f172a"
          textAnchor="middle"
        >
          Joker
        </text>
        <text
          x="150"
          y="56"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="600"
          fill="#64748b"
          textAnchor="middle"
        >
          (All-Color Wild)
        </text>

        <g transform="translate(150, 185)">
          <rect
            x="-100"
            y="-70"
            width="200"
            height="140"
            rx="16"
            fill="#f8fafc"
            stroke="#dc2626"
            strokeWidth="3"
          />
          <rect
            x="-92"
            y="-62"
            width="184"
            height="124"
            rx="12"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x="0"
            y="-10"
            fontFamily="Impact, sans-serif"
            fontSize="36"
            fontWeight="900"
            fill="#dc2626"
            textAnchor="middle"
            letterSpacing="2"
          >
            JOKER
          </text>
          <text
            x="0"
            y="25"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="800"
            fill="#d97706"
            textAnchor="middle"
          >
            WILDCARD
          </text>
          <text
            x="0"
            y="42"
            fontFamily="sans-serif"
            fontSize="9"
            fontWeight="600"
            fill="#475569"
            textAnchor="middle"
          >
            Use as any property color
          </text>
        </g>

        <g transform="translate(25, 295)">
          <text
            x="125"
            y="-8"
            fontFamily="sans-serif"
            fontSize="9"
            fontWeight="700"
            fill="#64748b"
            textAnchor="middle"
          >
            10-COLOR COMPATIBLE
          </text>
          {ALL_10_COLORS.map((col, idx) => (
            <rect
              key={col}
              x={idx * 25}
              y="0"
              width="23"
              height="40"
              rx="4"
              fill={COLOR_MAP[col]}
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
        </g>
      </svg>
    );
  }

  // --- DUAL-COLOR WILDCARD DESIGN ---
  if (isDualWildcard) {
    const wild = card as WildcardCard;
    const col1 = COLOR_MAP[wild.colors[0]] || "#3b82f6";
    const col2 = COLOR_MAP[wild.colors[1]] || "#ef4444";

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3"
        />

        <text
          x="150"
          y="42"
          fontFamily="sans-serif"
          fontSize="16"
          fontWeight="900"
          fill="#0f172a"
          textAnchor="middle"
        >
          Dual-Color Wild
        </text>

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#1e293b"
          stroke="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#1e293b"
          stroke="#ffffff"
        />

        <g transform="translate(150, 185)">
          <rect
            x="-105"
            y="-80"
            width="210"
            height="160"
            rx="16"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          <path d="M -103,-78 L 103,-78 L 103,-2 L -103,-2 Z" fill={col1} />
          <text
            x="0"
            y="-32"
            fontFamily="sans-serif"
            fontSize="14"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
          >
            {wild.colors[0].toUpperCase()}
          </text>

          <path d="M -103,2 L 103,2 L 103,78 L -103,78 Z" fill={col2} />
          <text
            x="0"
            y="48"
            fontFamily="sans-serif"
            fontSize="14"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
          >
            {wild.colors[1].toUpperCase()}
          </text>

          <circle
            cx="0"
            cy="0"
            r="22"
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <text
            x="0"
            y="5"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="900"
            fill="#0f172a"
            textAnchor="middle"
          >
            50/50
          </text>
        </g>

        <rect
          x="25"
          y="290"
          width="115"
          height="32"
          rx="8"
          fill={col1}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <text
          x="82.5"
          y="311"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="#ffffff"
          textAnchor="middle"
        >
          {wild.colors[0].toUpperCase()}
        </text>

        <rect
          x="160"
          y="290"
          width="115"
          height="32"
          rx="8"
          fill={col2}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <text
          x="217.5"
          y="311"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="#ffffff"
          textAnchor="middle"
        >
          {wild.colors[1].toUpperCase()}
        </text>
      </svg>
    );
  }

  // --- RENT & MULTI-RENT CARDS DESIGN ---
  if (isRentCard) {
    const rentCard = card as ActionCard;
    const rentCols = rentCard.rentColors || [];
    const isMulti = rentCard.actionType === "Multi-Rent";

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="3"
        />

        <rect
          x="14"
          y="14"
          width="272"
          height="392"
          rx="14"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#000000"
          stroke="#ffffff"
          textFill="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#000000"
          stroke="#ffffff"
          textFill="#ffffff"
        />

        <text
          x="150"
          y="48"
          fontFamily="sans-serif"
          fontSize="18"
          fontWeight="900"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          {isMulti ? "MULTI-RENT" : "RENT"}
        </text>

        <g transform="translate(150, 115)">
          {rentCols.length === 2 && (
            <g>
              <rect
                x="-95"
                y="-25"
                width="90"
                height="45"
                rx="8"
                fill={COLOR_MAP[rentCols[0]] || "#333"}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x="-50"
                y="2"
                fontFamily="sans-serif"
                fontSize="10"
                fontWeight="800"
                fill="#ffffff"
                textAnchor="middle"
              >
                {rentCols[0].toUpperCase()}
              </text>

              <rect
                x="5"
                y="-25"
                width="90"
                height="45"
                rx="8"
                fill={COLOR_MAP[rentCols[1]] || "#333"}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x="50"
                y="2"
                fontFamily="sans-serif"
                fontSize="10"
                fontWeight="800"
                fill="#ffffff"
                textAnchor="middle"
              >
                {rentCols[1].toUpperCase()}
              </text>
            </g>
          )}

          {isMulti && (
            <g>
              <rect
                x="-95"
                y="-22"
                width="190"
                height="44"
                rx="8"
                fill="#111827"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text
                x="0"
                y="5"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="900"
                fill="#f59e0b"
                textAnchor="middle"
                letterSpacing="1"
              >
                ALL PLAYERS / ALL COLORS
              </text>
            </g>
          )}
        </g>

        <rect
          x="30"
          y="155"
          width="240"
          height="165"
          rx="12"
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="2"
        />

        <g transform="translate(150, 175)">
          <text
            x="0"
            y="0"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="1"
          >
            RENT RATE TIER
          </text>
          <line
            x1="-90"
            y1="10"
            x2="90"
            y2="10"
            stroke="#ffffff"
            strokeWidth="1"
          />

          <text
            x="-80"
            y="32"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="start"
          >
            1 Property
          </text>
          <text
            x="80"
            y="32"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="end"
          >
            $1M
          </text>

          <text
            x="-80"
            y="56"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="start"
          >
            2 Properties
          </text>
          <text
            x="80"
            y="56"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="end"
          >
            $2M
          </text>

          <text
            x="-80"
            y="80"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="start"
          >
            3 Properties
          </text>
          <text
            x="80"
            y="80"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="end"
          >
            $3M
          </text>

          <text
            x="-80"
            y="104"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="800"
            fill="#f59e0b"
            textAnchor="start"
          >
            Full Set
          </text>
          <text
            x="80"
            y="104"
            fontFamily="sans-serif"
            fontSize="13"
            fontWeight="900"
            fill="#f59e0b"
            textAnchor="end"
          >
            $5M
          </text>
        </g>

        <text
          x="150"
          y="345"
          fontFamily="sans-serif"
          fontSize="9"
          fontWeight="600"
          fill="#a1a1aa"
          textAnchor="middle"
        >
          {isMulti
            ? "Force one player to pay rent for 1 of your properties"
            : "All players pay rent for properties you own of these colors"}
        </text>
      </svg>
    );
  }

  // --- MONEY CARDS DESIGN ---
  if (card.type === "Money") {
    let bgGradientStart = "#fca5a5";
    let bgGradientEnd = "#ef4444";
    let accentCol = "#b91c1c";

    if (card.value === 2) {
      bgGradientStart = "#67e8f9";
      bgGradientEnd = "#06b6d4";
      accentCol = "#0e7490";
    } else if (card.value === 3) {
      bgGradientStart = "#86efac";
      bgGradientEnd = "#22c55e";
      accentCol = "#15803d";
    } else if (card.value === 4) {
      bgGradientStart = "#c084fc";
      bgGradientEnd = "#9333ea";
      accentCol = "#6b21a8";
    } else if (card.value >= 5 && card.value < 10) {
      bgGradientStart = "#fde047";
      bgGradientEnd = "#eab308";
      accentCol = "#a16207";
    } else if (card.value >= 10) {
      bgGradientStart = "#f97316";
      bgGradientEnd = "#ea580c";
      accentCol = "#c2410c";
    }

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <defs>
          <linearGradient
            id={`moneyBg-${cardIdSafe}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={bgGradientStart} />
            <stop offset="100%" stopColor={bgGradientEnd} />
          </linearGradient>
        </defs>

        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill={`url(#moneyBg-${cardIdSafe})`}
          stroke={accentCol}
          strokeWidth="3.5"
        />

        <rect
          x="14"
          y="14"
          width="272"
          height="392"
          rx="14"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill={accentCol}
          stroke="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill={accentCol}
          stroke="#ffffff"
        />

        <text
          x="150"
          y="42"
          fontFamily="sans-serif"
          fontSize="12"
          fontWeight="900"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          MONOPOLY DEAL CASH
        </text>

        <g transform="translate(150, 195)">
          <ellipse
            cx="0"
            cy="0"
            rx="110"
            ry="75"
            fill="#ffffff"
            stroke={accentCol}
            strokeWidth="4"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="102"
            ry="67"
            fill="none"
            stroke={accentCol}
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />

          <text
            x="0"
            y="14"
            fontFamily="Impact, Arial Black, sans-serif"
            fontSize="52"
            fontWeight="900"
            fill={accentCol}
            textAnchor="middle"
          >
            ${card.value}M
          </text>
        </g>

        <rect
          x="40"
          y="310"
          width="220"
          height="32"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.9"
        />
        <text
          x="150"
          y="330"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="900"
          fill={accentCol}
          textAnchor="middle"
          letterSpacing="1"
        >
          BANKABLE CASH ASSET
        </text>
      </svg>
    );
  }

  // --- PROPERTY CARDS DESIGN ---
  if (card.type === "Property") {
    const prop = card as PropertyCard;
    const headerCol = COLOR_MAP[prop.color] || "#212121";
    const rentRates = PROPERTY_RENT_TABLE[prop.color] || {
      "1 Prop": "$1M",
      "Full Set": "$3M",
    };

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#fafafa"
          stroke="#1e293b"
          strokeWidth="3"
        />

        <path
          d="M 5,23 A 18,18 0 0,1 23,5 L 277,5 A 18,18 0 0,1 295,23 L 295,85 L 5,85 Z"
          fill={headerCol}
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#ffffff"
          stroke={headerCol}
          textFill={headerCol}
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#ffffff"
          stroke={headerCol}
          textFill={headerCol}
        />

        <text
          x="150"
          y="52"
          fontFamily="Georgia, serif"
          fontSize="18"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          {card.name}
        </text>

        <text
          x="150"
          y="72"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="#ffffff"
          fillOpacity="0.9"
          textAnchor="middle"
          letterSpacing="1"
        >
          {prop.color.toUpperCase()} SET
        </text>

        <rect
          x="25"
          y="105"
          width="250"
          height="220"
          rx="12"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        <rect x="25" y="105" width="250" height="32" rx="12" fill="#f1f5f9" />
        <text
          x="150"
          y="126"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="900"
          fill="#334155"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          RENT SCHEDULE
        </text>
        <line
          x1="25"
          y1="137"
          x2="275"
          y2="137"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        <g transform="translate(40, 160)">
          {Object.entries(rentRates).map(([tier, rate], idx) => (
            <g key={tier} transform={`translate(0, ${idx * 28})`}>
              <text
                x="0"
                y="0"
                fontFamily="sans-serif"
                fontSize="11"
                fontWeight="700"
                fill="#1e293b"
              >
                {tier}
              </text>
              <text
                x="220"
                y="0"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="900"
                fill={headerCol}
                textAnchor="end"
              >
                {rate}
              </text>
              {idx < Object.keys(rentRates).length - 1 && (
                <line
                  x1="0"
                  y1="8"
                  x2="220"
                  y2="8"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              )}
            </g>
          ))}
        </g>

        <g transform="translate(150, 290)">
          <text
            x="0"
            y="0"
            fontFamily="sans-serif"
            fontSize="9"
            fontWeight="700"
            fill="#16a34a"
            textAnchor="middle"
          >
            + House adds $3M rent
          </text>
          <text
            x="0"
            y="14"
            fontFamily="sans-serif"
            fontSize="9"
            fontWeight="700"
            fill="#dc2626"
            textAnchor="middle"
          >
            + Hotel adds $4M rent
          </text>
        </g>

        <g transform="translate(150, 355)">
          <circle
            cx="0"
            cy="0"
            r="16"
            fill={headerCol}
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      </svg>
    );
  }

  // --- ACTION CARDS DESIGN ---
  if (card.type === "Action") {
    const actionCard = card as ActionCard;
    const isHouse = actionCard.actionType === "House" || card.name === "House";
    const isHotel = actionCard.actionType === "Hotel" || card.name === "Hotel";

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#faf8f5"
          stroke="#1e293b"
          strokeWidth="3"
        />

        <rect
          x="14"
          y="14"
          width="272"
          height="392"
          rx="14"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#1e293b"
          stroke="#dc2626"
          textFill="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#1e293b"
          stroke="#dc2626"
          textFill="#ffffff"
        />

        <text
          x="150"
          y="45"
          fontFamily="Georgia, serif"
          fontSize="16"
          fontWeight="bold"
          fill="#0f172a"
          textAnchor="middle"
        >
          {card.name}
        </text>

        <g transform="translate(150, 190)">
          <rect
            x="-100"
            y="-80"
            width="200"
            height="160"
            rx="20"
            fill="#ffffff"
            stroke="#dc2626"
            strokeWidth="3"
          />

          {isHouse && (
            <g>
              <path
                d="M -30,20 L -30,-15 L 0,-45 L 30,-15 L 30,20 Z"
                fill="#16a34a"
                stroke="#15803d"
                strokeWidth="3"
              />
              <rect x="-10" y="-5" width="20" height="25" fill="#ffffff" />
              <text
                x="0"
                y="52"
                fontFamily="sans-serif"
                fontSize="16"
                fontWeight="900"
                fill="#15803d"
                textAnchor="middle"
              >
                HOUSE
              </text>
            </g>
          )}

          {isHotel && (
            <g>
              <rect
                x="-35"
                y="-45"
                width="70"
                height="70"
                rx="6"
                fill="#dc2626"
                stroke="#b91c1c"
                strokeWidth="3"
              />
              <rect x="-22" y="-35" width="12" height="12" fill="#ffffff" />
              <rect x="10" y="-35" width="12" height="12" fill="#ffffff" />
              <rect x="-22" y="-15" width="12" height="12" fill="#ffffff" />
              <rect x="10" y="-15" width="12" height="12" fill="#ffffff" />
              <rect x="-10" y="5" width="20" height="20" fill="#ffffff" />
              <text
                x="0"
                y="52"
                fontFamily="sans-serif"
                fontSize="16"
                fontWeight="900"
                fill="#b91c1c"
                textAnchor="middle"
              >
                HOTEL
              </text>
            </g>
          )}

          {!isHouse && !isHotel && (
            <g>
              <circle
                cx="0"
                cy="-10"
                r="38"
                fill="#0f172a"
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              <text
                x="0"
                y="2"
                fontFamily="sans-serif"
                fontSize="24"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                ★
              </text>
              <text
                x="0"
                y="52"
                fontFamily="sans-serif"
                fontSize="13"
                fontWeight="900"
                fill="#0f172a"
                textAnchor="middle"
              >
                {actionCard.actionType.toUpperCase()}
              </text>
            </g>
          )}
        </g>

        <foreignObject x="30" y="295" width="240" height="60">
          <div
            style={{
              color: "#334155",
              fontFamily: "sans-serif",
              fontSize: "10px",
              textAlign: "center",
              lineHeight: "1.3",
              fontWeight: "bold",
            }}
          >
            {card.description || "Action card effect."}
          </div>
        </foreignObject>
      </svg>
    );
  }

  // --- FALLBACK RENDERER ---
  return (
    <svg
      viewBox="0 0 300 420"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      className="w-full h-full select-none pointer-events-none"
    >
      <title>{accessibleTitle}</title>
      <rect
        x="5"
        y="5"
        width="290"
        height="410"
        rx="20"
        fill="#1e293b"
        stroke="#dfb76c"
        strokeWidth="3.5"
      />
      <ValueBadge x={38} y={38} value={card.value} />
      <ValueBadge x={262} y={382} value={card.value} />
      <text
        x="150"
        y="210"
        fontFamily="sans-serif"
        fontSize="16"
        fontWeight="900"
        fill="#ffffff"
        textAnchor="middle"
      >
        {card.name.toUpperCase()}
      </text>
    </svg>
  );
};
