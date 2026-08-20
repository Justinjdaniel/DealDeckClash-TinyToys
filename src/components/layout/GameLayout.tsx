import React, { useState } from "react";
import {
  GameState,
  GameAction,
  Card,
  WildcardCard,
  ActionCard,
  CardColor,
  PropertySet,
} from "../../types/game";
import { VisualCard } from "../cards/VisualCard";
import { WildcardColorModal } from "../modals/WildcardColorModal";
import { RentColorModal } from "../modals/RentColorModal";
import { SettingsModal } from "../modals/SettingsModal";
import { PaymentModal } from "../modals/PaymentModal";
import {
  getPlayerBankCards,
  getPlayerPropertyCards,
} from "../../features/game-engine/rules";
import { Settings, LogOut, CheckCircle, User, Bot, Layers } from "lucide-react";

interface GameLayoutProps {
  state: GameState;
  onDispatch: (action: GameAction) => boolean;
  onLeaveGame: () => void;
}

const PropertySetStack: React.FC<{
  set: PropertySet;
  onCardClick?: (card: WildcardCard) => void;
}> = ({ set, onCardClick }) => {
  if (!set.cards || set.cards.length === 0) return null;

  return (
    <div className="flex flex-col items-center m-0.5">
      {set.isComplete && (
        <span className="text-[8px] font-black text-amber-400 bg-amber-950/90 px-1 py-0.5 rounded border border-amber-400/50 mb-0.5 shadow">
          ★ COMPLETE
        </span>
      )}
      <div className="flex flex-col items-center">
        {set.cards.map((card, idx) => (
          <div
            key={card.id}
            className={idx > 0 ? "-mt-14" : ""}
            style={{ zIndex: idx + 1 }}
          >
            <VisualCard
              card={card}
              size="sm"
              onClick={
                card.type === "Wildcard"
                  ? () => onCardClick?.(card as WildcardCard)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const GameLayout: React.FC<GameLayoutProps> = ({
  state,
  onDispatch,
  onLeaveGame,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [wildcardModalCard, setWildcardModalCard] =
    useState<WildcardCard | null>(null);
  const [rentModalCard, setRentModalCard] = useState<ActionCard | null>(null);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(
    null,
  );

  const players = Array.isArray(state.players) ? state.players : [];
  const human = players.find((p) => p && !p.isBot) || players[0];
  const opponent = players.find((p) => p && p.isBot) || players[1];

  const isHumanTurn = players[state.currentPlayerIndex]?.id === human?.id;
  const humanHand = human?.hand || [];
  const selectedHandCard =
    humanHand.find((c) => c?.id === selectedHandCardId) || null;

  const humanBank = human ? getPlayerBankCards(human) : [];
  const humanBankValue = humanBank.reduce((sum, c) => sum + (c.value || 0), 0);

  const opponentBank = opponent ? getPlayerBankCards(opponent) : [];
  const opponentBankValue = opponentBank.reduce(
    (sum, c) => sum + (c.value || 0),
    0,
  );

  const humanSets: PropertySet[] = Array.isArray(human?.properties)
    ? human.properties
    : (Object.values(human?.properties || {}) as PropertySet[]);

  const opponentSets: PropertySet[] = Array.isArray(opponent?.properties)
    ? opponent.properties
    : (Object.values(opponent?.properties || {}) as PropertySet[]);

  const handleCardClick = (card: Card) => {
    if (!isHumanTurn || state.actionPointsLeft <= 0) return;

    if (card.type === "Wildcard") {
      setWildcardModalCard(card as WildcardCard);
      setSelectedHandCardId(card.id);
    } else {
      setSelectedHandCardId(card.id === selectedHandCardId ? null : card.id);
    }
  };

  const handlePlayCardToZone = (
    targetZone: "bank" | "properties" | "center",
    colorOption?: CardColor,
  ) => {
    if (!selectedHandCardId || !human) return;

    if (
      targetZone === "center" &&
      selectedHandCard?.type === "Action" &&
      ((selectedHandCard as ActionCard).actionType === "Rent" ||
        (selectedHandCard as ActionCard).actionType === "Multi-Rent") &&
      !colorOption
    ) {
      setRentModalCard(selectedHandCard as ActionCard);
      return;
    }

    onDispatch({
      type: "PLAY_CARD",
      payload: {
        playerId: human.id,
        cardId: selectedHandCardId,
        targetZone,
        options: colorOption ? { color: colorOption } : undefined,
      },
    });
    setSelectedHandCardId(null);
  };

  const handleEndTurn = () => {
    if (!human || !isHumanTurn) return;
    onDispatch({ type: "END_TURN", payload: { playerId: human.id } });
  };

  const handleReassignWildcard = (card: WildcardCard) => {
    if (!isHumanTurn || !human) return;
    setWildcardModalCard(card);
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden flex flex-col justify-between p-1.5 select-none bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-slate-100">
      {/* TOP ZONE: Opponent Status Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">
              {opponent?.name || "Opponent Bot"}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>{opponent?.hand?.length || 0} Cards in Hand</span>
            </div>
          </div>
        </div>

        {/* Minimal Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow cursor-pointer"
            title="Settings & Rules"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onLeaveGame}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-all shadow border border-rose-800/40 cursor-pointer"
            title="Leave Game"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER ZONE: Symmetrical Game Board */}
      <div className="flex-1 my-1 grid grid-cols-3 gap-1.5 overflow-hidden items-center justify-center p-1 bg-emerald-900/30 border border-emerald-800/40 rounded-2xl shadow-inner relative">
        {/* Left: Staggered Properties */}
        <div className="h-full flex flex-col justify-between p-1 bg-slate-900/40 rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-800 pb-0.5">
            Opponent Board (${opponentBankValue}M)
          </div>
          <div className="flex-1 flex flex-wrap gap-1 items-start justify-center overflow-y-auto p-1">
            {opponentSets
              .filter((s) => s.cards && s.cards.length > 0)
              .map((set) => (
                <PropertySetStack key={set.color} set={set} />
              ))}
          </div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest text-center border-t border-slate-800 pt-0.5">
            Your Board (${humanBankValue}M)
          </div>
          <div className="flex-1 flex flex-wrap gap-1 items-end justify-center overflow-y-auto p-1">
            {humanSets
              .filter((s) => s.cards && s.cards.length > 0)
              .map((set) => (
                <PropertySetStack
                  key={set.color}
                  set={set}
                  onCardClick={handleReassignWildcard}
                />
              ))}
          </div>
        </div>

        {/* Center: Decks & Discard Pile */}
        <div className="h-full flex flex-col items-center justify-center gap-2 p-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow">
          {/* Action Deck / Center Pile */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-amber-600 via-amber-800 to-slate-900 border-2 border-amber-400/80 shadow-2xl flex flex-col items-center justify-center text-amber-200">
              <Layers className="w-6 h-6 mb-0.5 animate-pulse" />
              <span className="text-[9px] font-extrabold uppercase">DECK</span>
              <span className="text-[10px] font-black">
                {state.deck?.length || 0} Left
              </span>
            </div>
          </div>

          {/* Action Zone drop options if card selected */}
          {selectedHandCard && isHumanTurn && (
            <div className="flex flex-col gap-1 w-full animate-in fade-in zoom-in-95 duration-150">
              {(selectedHandCard.type === "Money" ||
                selectedHandCard.type === "Action") && (
                <button
                  onClick={() => handlePlayCardToZone("bank")}
                  className="w-full py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] shadow transition-all cursor-pointer"
                >
                  Deposit to Bank
                </button>
              )}
              {(selectedHandCard.type === "Property" ||
                selectedHandCard.type === "Wildcard") && (
                <button
                  onClick={() => handlePlayCardToZone("properties")}
                  className="w-full py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] shadow transition-all cursor-pointer"
                >
                  Add Property
                </button>
              )}
              {selectedHandCard.type === "Action" && (
                <button
                  onClick={() => handlePlayCardToZone("center")}
                  className="w-full py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-[11px] shadow transition-all cursor-pointer"
                >
                  Play Action
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Bank Vault Cash Stacks */}
        <div className="h-full flex flex-col justify-between p-1 bg-slate-900/40 rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center border-b border-slate-800 pb-0.5">
            Opponent Vault
          </div>
          <div className="flex-1 flex flex-wrap gap-1 items-start justify-center overflow-y-auto p-1">
            {opponentBank.map((card) => (
              <VisualCard key={card.id} card={card} size="sm" />
            ))}
          </div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center border-t border-slate-800 pt-0.5">
            Your Vault
          </div>
          <div className="flex-1 flex flex-wrap gap-1 items-end justify-center overflow-y-auto p-1">
            {humanBank.map((card) => (
              <VisualCard key={card.id} card={card} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ZONE: Player Hand & End Turn HUD */}
      <div className="w-full flex flex-col gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              Your Hand ({humanHand.length}/7)
            </span>
            {isHumanTurn && (
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                Actions Left: {state.actionPointsLeft}
              </span>
            )}
          </div>

          {/* Prominent Golden End Turn Icon Button */}
          {isHumanTurn && (
            <button
              onClick={handleEndTurn}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              END TURN
            </button>
          )}
        </div>

        {/* Overlapping Fan Player Hand Container */}
        <div className="w-full h-32 flex items-center justify-center overflow-x-auto p-1 gap-1">
          {humanHand.map((card) => (
            <VisualCard
              key={card.id}
              card={card}
              selected={selectedHandCardId === card.id}
              onClick={() => handleCardClick(card)}
              disabled={!isHumanTurn}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLeaveGame={onLeaveGame}
      />

      {wildcardModalCard && (
        <WildcardColorModal
          card={wildcardModalCard}
          onSelectColor={(color) => {
            if (selectedHandCardId) {
              handlePlayCardToZone("properties", color);
            } else if (human) {
              onDispatch({
                type: "TOGGLE_WILDCARD_COLOR",
                payload: {
                  playerId: human.id,
                  cardId: wildcardModalCard.id,
                  color,
                },
              });
            }
            setWildcardModalCard(null);
          }}
          onClose={() => setWildcardModalCard(null)}
        />
      )}

      {rentModalCard && (
        <RentColorModal
          card={rentModalCard}
          onSelectColor={(color) => {
            handlePlayCardToZone("center", color);
            setRentModalCard(null);
          }}
          onClose={() => setRentModalCard(null)}
        />
      )}

      {state.reactionQueue &&
        state.reactionQueue.targetPlayerId === human?.id && (
          <PaymentModal
            amountRequired={state.reactionQueue.actionDetails?.amount || 0}
            availableCards={[
              ...humanBank,
              ...(human ? getPlayerPropertyCards(human) : []),
            ]}
            onConfirmPayment={(cardIds) => {
              onDispatch({
                type: "RESOLVE_PAYMENT",
                payload: {
                  targetPlayerId: human.id,
                  callerPlayerId: state.reactionQueue!.originalActionPlayerId,
                  selectedCardIds: cardIds,
                },
              });
            }}
          />
        )}
    </div>
  );
};
