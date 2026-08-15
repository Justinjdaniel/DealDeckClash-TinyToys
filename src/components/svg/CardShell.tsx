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
  Railroad: "#424242",
  Utility: "#9e9e9e",
  Any: "#dfb76c",
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
  fill = "#0f0f17",
  stroke = "#dfb76c",
  textFill = "#dfb76c",
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle
      cx="0"
      cy="0"
      r="18"
      fill={fill}
      stroke={stroke}
      strokeWidth="2.5"
    />
    <text
      x="0"
      y="5"
      fontFamily="sans-serif"
      fontSize="15"
      fontWeight="900"
      fill={textFill}
      textAnchor="middle"
    >
      {value}M
    </text>
  </g>
);

export const CardShell: React.FC<CardShellProps> = ({
  card,
  isFlipped = false,
}) => {
  const cardIdSafe = card.id.replace(/[^a-zA-Z0-9]/g, "");
  const accessibleTitle = `${card.name} (${card.value}M)`;

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

  // --- RENT CARD DESIGN (Requirement 10: All-Black) ---
  if (isRentCard) {
    const rentCard = card as ActionCard;
    const rentCols = rentCard.rentColors || [];

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
          x="12"
          y="12"
          width="276"
          height="396"
          rx="15"
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
          y="70"
          fontFamily="sans-serif"
          fontSize="18"
          fontWeight="900"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="1"
        >
          {rentCard.actionType === "Multi-Rent" ? "MULTI-RENT" : "RENT"}
        </text>

        <rect
          x="30"
          y="100"
          width="240"
          height="220"
          rx="12"
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="2"
        />

        <g transform="translate(150, 210)">
          {rentCols.length === 2 ? (
            <g>
              <rect
                x="-80"
                y="-50"
                width="160"
                height="40"
                rx="8"
                fill={COLOR_MAP[rentCols[0]]}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x="0"
                y="-25"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                {rentCols[0].toUpperCase()}
              </text>

              <text
                x="0"
                y="10"
                fontFamily="sans-serif"
                fontSize="16"
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
              >
                OR
              </text>

              <rect
                x="-80"
                y="20"
                width="160"
                height="40"
                rx="8"
                fill={COLOR_MAP[rentCols[1]]}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x="0"
                y="45"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                {rentCols[1].toUpperCase()}
              </text>
            </g>
          ) : (
            <g>
              <circle
                cx="0"
                cy="0"
                r="45"
                fill="#000000"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x="0"
                y="-5"
                fontFamily="sans-serif"
                fontSize="14"
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
              >
                ANY COLOR
              </text>
              <text
                x="0"
                y="15"
                fontFamily="sans-serif"
                fontSize="11"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                PROPERTY
              </text>
            </g>
          )}
        </g>

        <text
          x="150"
          y="350"
          fontFamily="sans-serif"
          fontSize="10"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          Charge Rent on Property Sets
        </text>
      </svg>
    );
  }

  // --- 10-COLOR WILDCARD (JOKER) DESIGN (Requirement 5) ---
  if (isJokerWildcard) {
    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <defs>
          <clipPath id={`clipJokerBar-${cardIdSafe}`}>
            <rect x="5" y="5" width="290" height="410" rx="20" />
          </clipPath>
        </defs>

        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="3"
        />

        <rect
          x="12"
          y="12"
          width="276"
          height="396"
          rx="15"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#ffffff"
          stroke="#000000"
          textFill="#000000"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#ffffff"
          stroke="#000000"
          textFill="#000000"
        />

        <g transform="translate(150, 200)">
          <rect
            x="-100"
            y="-50"
            width="200"
            height="100"
            rx="16"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="3"
          />
          <text
            x="0"
            y="12"
            fontFamily="Arial Black, Impact, sans-serif"
            fontSize="32"
            fontWeight="900"
            fill="#000000"
            textAnchor="middle"
            letterSpacing="2"
          >
            JOKER
          </text>
          <text
            x="0"
            y="35"
            fontFamily="sans-serif"
            fontSize="10"
            fontWeight="bold"
            fill="#333333"
            textAnchor="middle"
            letterSpacing="1"
          >
            WILDCARD
          </text>
        </g>

        {/* Clipped Bottom Accent Bar */}
        <g clipPath={`url(#clipJokerBar-${cardIdSafe})`}>
          <g transform="translate(5, 392)">
            {ALL_10_COLORS.map((col, idx) => (
              <rect
                key={col}
                x={idx * 29}
                y="0"
                width="29"
                height="23"
                fill={COLOR_MAP[col]}
              />
            ))}
          </g>
        </g>
      </svg>
    );
  }

  // --- DUAL-COLOR WILDCARD DESIGN (Requirement 9: 50/50 Split) ---
  if (isDualWildcard) {
    const wild = card as WildcardCard;
    const col1 = COLOR_MAP[wild.colors[0]] || "#333333";
    const col2 = COLOR_MAP[wild.colors[1]] || "#666666";

    return (
      <svg
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        className="w-full h-full select-none pointer-events-none"
      >
        <title>{accessibleTitle}</title>
        <defs>
          <clipPath id={`clipCard-${cardIdSafe}`}>
            <rect x="5" y="5" width="290" height="410" rx="20" />
          </clipPath>
        </defs>

        <g clipPath={`url(#clipCard-${cardIdSafe})`}>
          <rect x="5" y="5" width="145" height="410" fill={col1} />
          <rect x="150" y="5" width="145" height="410" fill={col2} />
        </g>

        <rect
          x="5"
          y="5"
          width="290"
          height="410"
          rx="20"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
        />

        <ValueBadge x={38} y={38} value={card.value} />
        <ValueBadge x={262} y={382} value={card.value} />

        <g transform="translate(150, 210)">
          <circle
            cx="0"
            cy="0"
            r="45"
            fill="#0f0f17"
            stroke="#dfb76c"
            strokeWidth="3"
          />
          <path
            d="M -15,-15 L 15,15 M 15,-15 L -15,15"
            stroke="#dfb76c"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="14" fill="#dfb76c" />
          <text
            x="0"
            y="4"
            fontFamily="sans-serif"
            fontSize="12"
            fontWeight="900"
            fill="#0f0f17"
            textAnchor="middle"
          >
            ⇄
          </text>
        </g>

        <rect
          x="20"
          y="310"
          width="120"
          height="30"
          rx="6"
          fill={col1}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <text
          x="80"
          y="329"
          fontFamily="sans-serif"
          fontSize="9"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          {wild.colors[0].toUpperCase()}
        </text>

        <rect
          x="160"
          y="310"
          width="120"
          height="30"
          rx="6"
          fill={col2}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <text
          x="220"
          y="329"
          fontFamily="sans-serif"
          fontSize="9"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          {wild.colors[1].toUpperCase()}
        </text>
      </svg>
    );
  }

  // --- ACTION CARDS DESIGN (Requirement 7: Muted Off-White with Center Shape & Requirement 8: House/Hotel icons) ---
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
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="3"
        />

        <rect
          x="12"
          y="12"
          width="276"
          height="396"
          rx="15"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
        />

        <ValueBadge
          x={38}
          y={38}
          value={card.value}
          fill="#1e293b"
          stroke="#ef4444"
          textFill="#ffffff"
        />
        <ValueBadge
          x={262}
          y={382}
          value={card.value}
          fill="#1e293b"
          stroke="#ef4444"
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

        <g transform="translate(150, 195)">
          <rect
            x="-105"
            y="-90"
            width="210"
            height="180"
            rx="24"
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
                y="55"
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
                y="55"
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
                r="40"
                fill="#0f172a"
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              <text
                x="0"
                y="0"
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
                y="55"
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

        <foreignObject x="30" y="300" width="240" height="50">
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

  // --- PROPERTY CARDS DESIGN (Requirement 4: Color-only) ---
  if (card.type === "Property") {
    const prop = card as PropertyCard;
    const headerCol = COLOR_MAP[prop.color] || "#212121";

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
          fill="#181825"
          stroke={headerCol}
          strokeWidth="3.5"
        />

        <path
          d="M 8,18 A 12,12 0 0,1 18,8 L 282,8 A 12,12 0 0,1 292,18 L 292,75 L 8,75 Z"
          fill={headerCol}
        />

        <ValueBadge x={38} y={38} value={card.value} />
        <ValueBadge x={262} y={382} value={card.value} />

        <g transform="translate(150, 210)">
          <circle
            cx="0"
            cy="0"
            r="50"
            fill="#000000"
            fillOpacity="0.4"
            stroke={headerCol}
            strokeWidth="3"
          />

          <path
            d="M -24,12 L -24,-8 L 0,-28 L 24,-8 L 24,12 Z"
            fill={headerCol}
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <rect
            x="-8"
            y="-2"
            width="16"
            height="14"
            fill="#000000"
            fillOpacity="0.4"
          />
          <text
            x="0"
            y="28"
            fontFamily="sans-serif"
            fontSize="10"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
          >
            {prop.color.toUpperCase()}
          </text>
        </g>
      </svg>
    );
  }

  // --- MONEY CARDS DESIGN ---
  if (card.type === "Money") {
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
          fill="#143823"
          stroke="#81c784"
          strokeWidth="3.5"
        />

        <ValueBadge x={38} y={38} value={card.value} />
        <ValueBadge x={262} y={382} value={card.value} />

        <g transform="translate(150, 210)">
          <circle
            cx="0"
            cy="0"
            r="55"
            fill="#0f0f17"
            stroke="#dfb76c"
            strokeWidth="3"
          />
          <circle
            cx="0"
            cy="0"
            r="48"
            fill="none"
            stroke="#dfb76c"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <text
            x="0"
            y="12"
            fontFamily="Impact, sans-serif"
            fontSize="36"
            fontWeight="900"
            fill="#dfb76c"
            textAnchor="middle"
          >
            ${card.value}M
          </text>
        </g>

        <text
          x="150"
          y="350"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="bold"
          fill="#81c784"
          textAnchor="middle"
        >
          Bankable Cash Asset
        </text>
      </svg>
    );
  }

  // Fallback rendering for any unhandled card type
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
