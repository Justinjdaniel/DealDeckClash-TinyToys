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

const COLOR_MAP: Record<
  CardColor,
  { start: string; end: string; text: string }
> = {
  Brown: { start: "#8d6e63", end: "#4e342e", text: "#ffffff" },
  "Light Blue": { start: "#00e5ff", end: "#006064", text: "#000000" },
  Pink: { start: "#ff4081", end: "#880e4f", text: "#ffffff" },
  Orange: { start: "#ff9100", end: "#e65100", text: "#ffffff" },
  Red: { start: "#ff4b4b", end: "#b71c1c", text: "#ffffff" },
  Yellow: { start: "#ffd600", end: "#f57f17", text: "#000000" },
  Green: { start: "#00e676", end: "#007934", text: "#ffffff" },
  "Dark Blue": { start: "#2979ff", end: "#0d47a1", text: "#ffffff" },
  Railroad: { start: "#757575", end: "#212121", text: "#ffffff" },
  Utility: { start: "#b2ff59", end: "#33691e", text: "#000000" },
  Any: { start: "#ffffff", end: "#111111", text: "#ffffff" },
};

export const CardShell: React.FC<CardShellProps> = ({
  card,
  isFlipped = false,
}) => {
  const cardIdSafe = card.id.replace(/[^a-zA-Z0-9]/g, "");

  if (isFlipped) {
    // Elegant Card Back Design (Casino/Corporate theme)
    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none pointer-events-none"
      >
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

          <filter
            id="cardBackShadow"
            x="-10%"
            y="-10%"
            width="130%"
            height="130%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="10"
              floodColor="#000000"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* Card base */}
        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="18"
          fill={`url(#cardBackBg-${cardIdSafe})`}
          stroke={`url(#backGoldGrad-${cardIdSafe})`}
          strokeWidth="3"
          filter="url(#cardBackShadow)"
        />

        {/* Intricate Pattern Overlay */}
        <rect
          x="15"
          y="15"
          width="270"
          height="390"
          rx="10"
          fill={`url(#cardBackPattern-${cardIdSafe})`}
        />

        {/* Elegant Inner Frame */}
        <rect
          x="25"
          y="25"
          width="250"
          height="370"
          rx="8"
          fill="none"
          stroke={`url(#backGoldGrad-${cardIdSafe})`}
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Center Logo Shield */}
        <g transform="translate(150, 210)">
          <circle
            cx="0"
            cy="0"
            r="45"
            fill="#0f0f17"
            stroke={`url(#backGoldGrad-${cardIdSafe})`}
            strokeWidth="2.5"
          />
          <circle
            cx="0"
            cy="0"
            r="38"
            fill="none"
            stroke={`url(#backGoldGrad-${cardIdSafe})`}
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <path
            d="M -15 -18 L 15 -18 L 22 2 C 22 15 0 25 0 25 C 0 25 -22 15 -22 2 Z"
            fill="none"
            stroke={`url(#backGoldGrad-${cardIdSafe})`}
            strokeWidth="2"
          />
          <text
            x="0"
            y="4"
            fontFamily="Georgia, serif"
            fontSize="11"
            fontWeight="bold"
            fill={`url(#backGoldGrad-${cardIdSafe})`}
            textAnchor="middle"
            letterSpacing="1"
          >
            DEAL
          </text>
          <text
            x="0"
            y="15"
            fontFamily="Georgia, serif"
            fontSize="9"
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

  // Determine colors and assets based on type
  let cardColorStart = "#2a2b36";
  let cardColorEnd = "#13141c";
  let badgeText = "CARD";
  let frameColor = "#dfb76c"; // Default Gold Frame
  let headerColor = "#212121";

  // Specific Card Type Styling
  if (card.type === "Property") {
    const col = (card as PropertyCard).color;
    const style = COLOR_MAP[col];
    cardColorStart = style.start;
    cardColorEnd = style.end;
    badgeText = "PROPERTY";
    frameColor = style.start;
    headerColor = style.start;
  } else if (card.type === "Wildcard") {
    const wild = card as WildcardCard;
    const current = wild.currentColor || wild.colors[0];
    const style = COLOR_MAP[current];
    cardColorStart = style.start;
    cardColorEnd = style.end;
    badgeText = "WILDCARD";
    frameColor = "#dfb76c"; // Gold border for wildcards
    headerColor = style.start;
  } else if (card.type === "Action") {
    cardColorStart = "#e53935";
    cardColorEnd = "#5f0909";
    badgeText = "ACTION";
    frameColor = "#ef5350";
    headerColor = "#d32f2f";
  } else if (card.type === "Money") {
    cardColorStart = "#2e7d32";
    cardColorEnd = "#0b3010";
    badgeText = "MONEY";
    frameColor = "#81c784";
    headerColor = "#388e3c";
  }

  return (
    <svg
      viewBox="0 0 300 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none pointer-events-none"
    >
      <defs>
        {/* Background Radial Gradient */}
        <radialGradient
          id={`cardInnerBg-${cardIdSafe}`}
          cx="50%"
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor={cardColorStart} />
          <stop offset="100%" stopColor={cardColorEnd} />
        </radialGradient>

        {/* Outer Card Border Gradient (Metallic Metallic/Neon) */}
        <linearGradient
          id={`cardBorderGrad-${cardIdSafe}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={frameColor} />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor={frameColor} />
          <stop offset="75%" stopColor="#000000" stopOpacity="0.3" />
          <stop offset="100%" stopColor={frameColor} />
        </linearGradient>

        {/* Glossy Sheen Overlay */}
        <linearGradient
          id={`glossSheenGrad-${cardIdSafe}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Dynamic header / title banner gradient */}
        <linearGradient
          id={`headerGrad-${cardIdSafe}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={headerColor} />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>

        {/* Shadow Filters */}
        <filter
          id={`cardDropShadow-${cardIdSafe}`}
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
        >
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="12"
            floodColor="#000000"
            floodOpacity="0.5"
          />
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="#000000"
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      {/* Render Card Base Shell */}
      <rect
        x="5"
        y="5"
        width="290"
        height="410"
        rx="20"
        fill={`url(#cardInnerBg-${cardIdSafe})`}
        stroke={`url(#cardBorderGrad-${cardIdSafe})`}
        strokeWidth="4"
        filter={`url(#cardDropShadow-${cardIdSafe})`}
      />

      {/* Rarity & Glowing Inner Border */}
      <rect
        x="10"
        y="10"
        width="280"
        height="400"
        rx="15"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeOpacity="0.08"
      />

      {/* Header Banner Block */}
      <path
        d="M 12,17 A 5,5 0 0,1 17,12 L 283,12 A 5,5 0 0,1 288,17 L 288,58 L 12,58 Z"
        fill={`url(#headerGrad-${cardIdSafe})`}
      />

      {/* Tiny Badge Category */}
      <rect
        x="20"
        y="20"
        width="70"
        height="14"
        rx="4"
        fill="#000000"
        fillOpacity="0.4"
      />
      <text
        x="55"
        y="30"
        fontFamily="monospace"
        fontSize="8"
        fontWeight="bold"
        fill="#dfb76c"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        {badgeText}
      </text>

      {/* Card Value Badge Circle (e.g. 5M) */}
      <g transform="translate(262, 32)">
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="#0f0f17"
          stroke="#dfb76c"
          strokeWidth="1.5"
        />
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke="#dfb76c"
          strokeWidth="0.5"
          strokeDasharray="2 1.5"
        />
        <text
          x="0"
          y="3"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="11"
          fontWeight="extrabold"
          fill="#dfb76c"
          textAnchor="middle"
        >
          {card.value}M
        </text>
      </g>

      {/* Main Title text inside header banner */}
      <text
        x="20"
        y="50"
        fontFamily="Georgia, serif"
        fontSize="15"
        fontWeight="bold"
        fill="#ffffff"
        letterSpacing="0.2"
      >
        {card.name}
      </text>

      {/* Outer Card Center Box Frame */}
      <rect
        x="18"
        y="70"
        width="264"
        height="240"
        rx="10"
        fill="#000000"
        fillOpacity="0.15"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.05"
      />

      {/* Center Symbol Drawings */}
      <g transform="translate(150, 190)">
        {card.type === "Money" && (
          <g>
            {/* Retro Casino/Bank Vault design */}
            <circle
              cx="0"
              cy="0"
              r="48"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            <circle
              cx="0"
              cy="0"
              r="42"
              fill="none"
              stroke="#dfb76c"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <circle
              cx="0"
              cy="0"
              r="35"
              fill="none"
              stroke="#dfb76c"
              strokeWidth="1"
            />

            {/* Giant Gold Coin Shield */}
            <circle
              cx="0"
              cy="0"
              r="30"
              fill="url(#cardInnerBg)"
              stroke="#dfb76c"
              strokeWidth="2.5"
            />
            <circle
              cx="0"
              cy="0"
              r="26"
              fill="none"
              stroke="#dfb76c"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
            <text
              x="0"
              y="10"
              fontFamily="Impact, Helvetica, sans-serif"
              fontSize="32"
              fontWeight="black"
              fill="#dfb76c"
              textAnchor="middle"
            >
              $
            </text>
          </g>
        )}

        {card.type === "Property" && (
          <g>
            {/* House / Stately architectural design symbol */}
            <circle
              cx="0"
              cy="0"
              r="45"
              fill="#000000"
              fillOpacity="0.3"
              stroke={cardColorStart}
              strokeWidth="2"
            />

            {/* House SVG icon drawing */}
            <path
              d="M -22,10 L -22,-6 L 0,-24 L 22,-6 L 22,10 Z"
              fill={cardColorStart}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <rect
              x="-8"
              y="-2"
              width="16"
              height="12"
              fill="#000000"
              fillOpacity="0.4"
            />
            <circle cx="0" cy="18" r="8" fill="#ffffff" fillOpacity="0.08" />
            <text
              x="0"
              y="21"
              fontFamily="sans-serif"
              fontSize="8"
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              {(card as PropertyCard).color.toUpperCase()}
            </text>
          </g>
        )}

        {card.type === "Wildcard" && (
          <g>
            {/* Wildcard multi-directional exchange circle */}
            <circle
              cx="0"
              cy="0"
              r="46"
              fill="#000000"
              fillOpacity="0.3"
              stroke="#dfb76c"
              strokeWidth="2"
            />

            {/* Multi-gradient segments or rotation arrows */}
            <circle
              cx="0"
              cy="0"
              r="38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="15 6"
              strokeOpacity="0.6"
            />

            {/* Dynamic arrow vectors */}
            <path
              d="M -15,-15 L 15,15 M 15,-15 L -15,15"
              stroke="#dfb76c"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="0"
              cy="0"
              r="16"
              fill="#0f0f17"
              stroke="#dfb76c"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              fontFamily="Impact, sans-serif"
              fontSize="13"
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              ⇄
            </text>
          </g>
        )}

        {card.type === "Action" && (
          <g>
            {/* Glowing Action Circle Shield */}
            <circle
              cx="0"
              cy="0"
              r="48"
              fill="#0f0f17"
              stroke="#ef5350"
              strokeWidth="2.5"
            />
            <circle
              cx="0"
              cy="0"
              r="42"
              fill="none"
              stroke="#ef5350"
              strokeWidth="0.8"
              strokeDasharray="4 2"
            />

            {/* Custom symbol for Action types */}
            {(card as ActionCard).actionType === "Just Say No" && (
              <g>
                <path
                  d="M -15,-18 L 15,-18 L 20,2 C 20,13 0,22 0,22 C 0,22 -20,13 -20,2 Z"
                  fill="#ef5350"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="2"
                  fontFamily="sans-serif"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  SHIELD
                </text>
              </g>
            )}

            {(card as ActionCard).actionType === "Pass Go" && (
              <g>
                <path
                  d="M -18,-15 L 0,-15 L 15,0 L 0,15 L -18,15 L -3,0 Z"
                  fill="#4caf50"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <path
                  d="M -2,-15 L 16,-15 L 31,0 L 16,15 L -2,15 L 13,0 Z"
                  fill="#4caf50"
                  fillOpacity="0.5"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </g>
            )}

            {((card as ActionCard).actionType === "Sly Deal" ||
              (card as ActionCard).actionType === "Forced Deal" ||
              (card as ActionCard).actionType === "Deal Breaker") && (
              <g>
                {/* Exchange / Transfer icon */}
                <path
                  d="M -20,-10 C -20,-10 -5,-25 15,-10"
                  fill="none"
                  stroke="#dfb76c"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 15,10 C 15,10 0,25 -20,10"
                  fill="none"
                  stroke="#dfb76c"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Arrowhead */}
                <path d="M 10,-14 L 18,-8 L 10,-4 Z" fill="#dfb76c" />
                <path d="M -10,14 L -18,8 L -10,4 Z" fill="#dfb76c" />
                <circle cx="0" cy="0" r="10" fill="#dfb76c" />
                <text
                  x="0"
                  y="3.5"
                  fontFamily="sans-serif"
                  fontSize="10"
                  fontWeight="black"
                  fill="#0f0f17"
                  textAnchor="middle"
                >
                  ★
                </text>
              </g>
            )}

            {/* Default fallback action icon if not specific */}
            {![
              "Just Say No",
              "Pass Go",
              "Sly Deal",
              "Forced Deal",
              "Deal Breaker",
            ].includes((card as ActionCard).actionType) && (
              <g>
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="#e53935"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="5.5"
                  fontFamily="sans-serif"
                  fontSize="16"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  !
                </text>
              </g>
            )}
          </g>
        )}
      </g>

      {/* Text Description Box (bottom of center frame) */}
      <rect
        x="25"
        y="254"
        width="250"
        height="48"
        rx="6"
        fill="#000000"
        fillOpacity="0.3"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeOpacity="0.08"
      />

      {/* Multiline description handler */}
      <foreignObject x="30" y="258" width="240" height="40">
        <div
          style={{
            color: "#cfd8dc",
            fontFamily: "sans-serif",
            fontSize: "9px",
            textAlign: "center",
            lineHeight: "1.25",
            fontWeight: "bold",
          }}
        >
          {card.description ||
            "Monopoly Deal standard board gaming assets for boardroom dominance."}
        </div>
      </foreignObject>

      {/* Small Decorative Footer lines */}
      <line
        x1="40"
        y1="334"
        x2="260"
        y2="334"
        stroke="#dfb76c"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />

      <text
        x="150"
        y="354"
        fontFamily="monospace"
        fontSize="9"
        fontWeight="bold"
        fill="#cfd8dc"
        textAnchor="middle"
        letterSpacing="2"
      >
        DEAL DECK CLASH
      </text>

      <text
        x="150"
        y="375"
        fontFamily="sans-serif"
        fontSize="8"
        fontWeight="bold"
        fill="#78909c"
        textAnchor="middle"
      >
        © BOARDROOM ENTERTAINMENT INC.
      </text>

      {/* Metallic Gloss/Light overlay path */}
      <path
        d="M 8,20 A 15,15 0 0,1 23,8 L 277,8 A 15,15 0 0,1 292,23 L 292,160 L 8,240 Z"
        fill={`url(#glossSheenGrad-${cardIdSafe})`}
      />
    </svg>
  );
};
