import React, { useState, useEffect, useRef } from "react";
import { Card, PropertyCard, WildcardCard } from "../../types/game";
import { PlayingCard } from "../../features/cards/PlayingCard";
import { Coins, Building2, Check, AlertCircle } from "lucide-react";
import { useGamifiedAudio } from "../../features/audio/AudioContext";

interface PaymentSelectionModalProps {
  amount: number;
  reason: string;
  bankCards?: Card[];
  propertyCards?: (PropertyCard | WildcardCard)[];
  onConfirmPayment: (selectedCardIds: string[]) => void;
}

interface SelectableAssetCardProps {
  card: Card;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const SelectableAssetCard: React.FC<SelectableAssetCardProps> = ({
  card,
  isSelected,
  onToggle,
}) => {
  if (!card) return null;
  return (
    <button
      type="button"
      onClick={() => onToggle(card.id)}
      aria-pressed={isSelected}
      aria-label={`${card.name || "Card"}, value ${card.value || 0}M`}
      className={`relative rounded-xl p-0.5 border transition-all focus:outline-none focus:ring-2 focus:ring-casino-gold ${
        isSelected
          ? "ring-2 ring-casino-gold border-casino-gold bg-casino-gold/20 scale-105"
          : "border-white/10 opacity-70 hover:opacity-100"
      }`}
    >
      <div className="w-full h-16">
        <PlayingCard card={card} />
      </div>
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-casino-gold text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black z-20">
          ✓
        </div>
      )}
    </button>
  );
};

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  amount,
  reason,
  bankCards = [],
  propertyCards = [],
  onConfirmPayment,
}) => {
  const { playSound } = useGamifiedAudio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onConfirmPaymentRef = useRef(onConfirmPayment);
  useEffect(() => {
    onConfirmPaymentRef.current = onConfirmPayment;
  }, [onConfirmPayment]);

  const safeBankCards = (bankCards || []).filter(Boolean);
  const safePropertyCards = (propertyCards || []).filter(Boolean);
  const allAssets: Card[] = [...safeBankCards, ...safePropertyCards];

  const totalBankValue = safeBankCards.reduce(
    (sum, card) => sum + (card?.value || 0),
    0,
  );
  const totalPropValue = safePropertyCards.reduce(
    (sum, card) => sum + (card?.value || 0),
    0,
  );
  const totalAssets = totalBankValue + totalPropValue;

  const selectedCards = allAssets.filter((c) => selectedIds.includes(c.id));
  const selectedTotalValue = selectedCards.reduce(
    (sum, c) => sum + (c?.value || 0),
    0,
  );

  const isValid =
    allAssets.length === 0 ||
    selectedTotalValue >= amount ||
    (totalAssets < amount && selectedIds.length === allAssets.length);

  // Auto-resolve zero assets / bankrupt edge case
  useEffect(() => {
    if (allAssets.length === 0 || totalAssets === 0) {
      setToastMessage("Player has no assets to pay!");
      const timer = setTimeout(() => {
        onConfirmPaymentRef.current([]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [allAssets.length, totalAssets]);

  useEffect(() => {
    if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSelectCard = (id: string) => {
    playSound("click");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    if (!isValid) return;
    playSound("bankCoin");
    onConfirmPayment(selectedIds);
  };

  if (toastMessage) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment Auto Resolution"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      >
        <div className="max-w-sm w-full glass-panel rounded-2xl p-6 border-2 border-casino-gold text-center animate-[scaleIn_0.2s_ease-out]">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
          <h3 className="text-base font-serif font-black text-white mb-1">
            Zero Assets
          </h3>
          <p className="text-xs text-amber-300 font-bold">{toastMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manual Payment Selection Dialog"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        ref={containerRef}
        className="max-w-md w-full glass-panel rounded-2xl p-5 border-2 border-casino-gold shadow-gold-glow animate-[scaleIn_0.2s_ease-out] flex flex-col my-auto"
      >
        <div className="text-center mb-3">
          <Coins className="w-8 h-8 text-casino-gold mx-auto mb-1 animate-bounce" />
          <h2 className="text-base font-serif font-black text-white">
            Payment Required
          </h2>
          <p className="text-[11px] text-gray-300">
            {reason}. Amount Owed:{" "}
            <span className="text-casino-gold font-bold">{amount}M Cash</span>
          </p>
        </div>

        {/* Selected Progress Summary Bar */}
        <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 mb-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 text-[10px] block">
              Selected Total
            </span>
            <span
              className={`font-mono font-bold ${
                selectedTotalValue >= amount
                  ? "text-green-400"
                  : "text-amber-400"
              }`}
            >
              {selectedTotalValue}M / {amount}M Owed
            </span>
          </div>

          <div className="text-right">
            {selectedTotalValue >= amount ? (
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Debt Covered
              </span>
            ) : totalAssets < amount ? (
              <span className="text-[9px] text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Short Funds (Select All)
              </span>
            ) : (
              <span className="text-[9px] text-amber-400 font-bold">
                Need {amount - selectedTotalValue}M more
              </span>
            )}
          </div>
        </div>

        {/* Assets Selection Lists */}
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 mb-4">
          {/* Bank Assets Section */}
          <div>
            <span className="text-[10px] font-mono font-bold text-casino-gold uppercase tracking-wider block mb-1">
              Banked Assets ({safeBankCards.length})
            </span>
            {safeBankCards.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {safeBankCards.map((card) => (
                  <SelectableAssetCard
                    key={card.id}
                    card={card}
                    isSelected={selectedIds.includes(card.id)}
                    onToggle={toggleSelectCard}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 italic">
                No cards in bank
              </p>
            )}
          </div>

          {/* On-Table Played Properties Section */}
          <div>
            <span className="text-[10px] font-mono font-bold text-casino-gold uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Played Properties (
              {safePropertyCards.length})
            </span>
            {safePropertyCards.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {safePropertyCards.map((card) => (
                  <SelectableAssetCard
                    key={card.id}
                    card={card}
                    isSelected={selectedIds.includes(card.id)}
                    onToggle={toggleSelectCard}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 italic">
                No properties played on board
              </p>
            )}
          </div>
        </div>

        <button
          ref={confirmBtnRef}
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-casino-gold ${
            isValid
              ? "bg-gradient-to-r from-amber-500 via-casino-gold to-yellow-400 text-black shadow-gold-glow hover:scale-[1.02] active:scale-95"
              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
          }`}
        >
          Confirm Payment ({selectedTotalValue}M)
        </button>
      </div>
    </div>
  );
};
