import React, { useState } from "react";
import { Card } from "../../types/game";
import { VisualCard } from "../cards/VisualCard";
import { ShieldAlert, Check } from "lucide-react";

interface PaymentModalProps {
  amountRequired: number;
  availableCards: Card[];
  onConfirmPayment: (selectedCardIds: string[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amountRequired,
  availableCards,
  onConfirmPayment,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectCard = (cardId: string) => {
    setSelectedIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  };

  const selectedTotal = availableCards
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const totalAvailable = availableCards.reduce(
    (sum, c) => sum + (c.value || 0),
    0,
  );
  const isSufficient =
    selectedTotal >= amountRequired || selectedTotal >= totalAvailable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-rose-400 font-bold">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base">Payment Required: ${amountRequired}M</h3>
        </div>

        <p className="text-xs text-slate-300">
          Select bank cards or property cards to pay your debt. Total Selected:{" "}
          <span
            className={`font-bold ${isSufficient ? "text-emerald-400" : "text-amber-400"}`}
          >
            ${selectedTotal}M / ${amountRequired}M
          </span>
        </p>

        <div className="flex-1 overflow-y-auto max-h-60 p-1 grid grid-cols-3 gap-2">
          {availableCards.map((card) => {
            const isSelected = selectedIds.includes(card.id);
            return (
              <VisualCard
                key={card.id}
                card={card}
                selected={isSelected}
                onClick={() => toggleSelectCard(card.id)}
                size="sm"
              />
            );
          })}
        </div>

        <button
          onClick={() => onConfirmPayment(selectedIds)}
          disabled={!isSufficient && availableCards.length > 0}
          className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            isSufficient || availableCards.length === 0
              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          <Check className="w-4 h-4" />
          {availableCards.length === 0
            ? "No Assets Available (Bankrupt)"
            : "Confirm Payment"}
        </button>
      </div>
    </div>
  );
};
