import React, { useEffect, useState, useRef } from "react";
import { ReactionState, Card, PlayerState } from "../../types/game";
import { Shield, XCircle } from "lucide-react";
import { useGamifiedAudio } from "../audio/AudioContext";
import { PaymentSelectionModal } from "../../components/ui/PaymentSelectionModal";
import { getPlayerBankCards, getPlayerPropertyCards } from "./rules";

interface ReactionModalProps {
  reaction: ReactionState;
  onReact: (
    useJSN: boolean,
    jsnCardId?: string,
    selectedCardIds?: string[],
  ) => void;
  onTimeout: () => void;
  jsnCard: Card | null;
  humanPlayer?: PlayerState;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  reaction,
  onReact,
  onTimeout,
  jsnCard,
  humanPlayer,
}) => {
  const { playSound } = useGamifiedAudio();
  const [secondsLeft, setSecondsLeft] = useState(reaction?.timerSeconds || 5);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const playSoundRef = useRef(playSound);
  const onTimeoutRef = useRef(onTimeout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const reactionKey = `${reaction?.actionCard?.id || "rx"}-${(reaction?.counterChain || []).length}`;

  useEffect(() => {
    setSecondsLeft(reaction?.timerSeconds || 5);
    setShowPaymentModal(false);
    playSoundRef.current("alertBuzz");
  }, [reactionKey, reaction?.timerSeconds]);

  useEffect(() => {
    if (showPaymentModal) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reactionKey, showPaymentModal]);

  const isPaymentAction = [
    "Rent",
    "Multi-Rent",
    "Debt Collector",
    "Its My Birthday",
  ].includes(reaction?.actionCard?.actionType || "");

  useEffect(() => {
    if (showPaymentModal) return;

    if (secondsLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isPaymentAction && humanPlayer) {
        setShowPaymentModal(true);
      } else {
        onTimeoutRef.current();
      }
    } else if (secondsLeft > 0 && secondsLeft < (reaction?.timerSeconds || 5)) {
      playSoundRef.current("timerTick");
    }
  }, [
    secondsLeft,
    reaction?.timerSeconds,
    isPaymentAction,
    humanPlayer,
    showPaymentModal,
  ]);

  const handleAccept = () => {
    if (isPaymentAction && humanPlayer) {
      setShowPaymentModal(true);
    } else {
      onReact(false);
    }
  };

  useEffect(() => {
    if (!showPaymentModal) return;

    // Bounded fallback timer for payment selection modal
    const fallbackTimer = setTimeout(() => {
      onTimeoutRef.current();
    }, 30000);

    return () => clearTimeout(fallbackTimer);
  }, [showPaymentModal]);

  if (showPaymentModal && humanPlayer) {
    const bankCards = getPlayerBankCards(humanPlayer);
    const propertyCards = getPlayerPropertyCards(humanPlayer);
    const amount = reaction?.actionDetails?.amount || 0;

    return (
      <PaymentSelectionModal
        amount={amount}
        reason={`Action Card: ${reaction?.actionCard?.name || "Action"}`}
        bankCards={bankCards}
        propertyCards={propertyCards}
        onConfirmPayment={(selectedCardIds) => {
          onReact(false, undefined, selectedCardIds);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-6 md:p-8 border-2 border-casino-gold shadow-gold-glow animate-[scaleIn_0.2s_ease-out] relative">
        {/* Animated radial countdown timer */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 border border-casino-gold rounded-full p-1.5 w-16 h-16 shadow-gold-glow flex items-center justify-center">
          <svg className="w-full h-full rotate-[-90deg]">
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="#12382c"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="#dfb76c"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray="138.16"
              strokeDashoffset={
                138.16 - (secondsLeft / (reaction?.timerSeconds || 5)) * 138.16
              }
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute text-white font-mono font-bold text-sm">
            {secondsLeft}s
          </div>
        </div>

        <div className="text-center mt-6 mb-5">
          <Shield className="w-10 h-10 text-casino-gold mx-auto mb-2 animate-bounce" />
          <h2 className="text-xl font-serif font-black text-white mb-1">
            Incoming Attack!
          </h2>

          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-300 leading-normal mb-3">
            An incoming action card{" "}
            <span className="text-casino-gold font-bold">
              "{reaction?.actionCard?.name || "Action"}"
            </span>{" "}
            was played against you!
            {reaction?.actionDetails?.amount && (
              <p className="mt-1 font-semibold text-white">
                Value Owed: {reaction.actionDetails.amount}M Cash
              </p>
            )}
            {reaction?.actionDetails?.targetColor && (
              <p className="mt-1 font-semibold text-white">
                Target Color Set: {reaction.actionDetails.targetColor}
              </p>
            )}
          </div>

          {jsnCard ? (
            <div className="p-3 bg-casino-gold/5 rounded-xl border border-casino-gold/30 mb-4 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-casino-gold font-bold mb-1">
                Defense Activated
              </span>
              <div className="text-xs text-white font-semibold flex items-center gap-1">
                🛡️ You have{" "}
                <span className="text-casino-gold font-bold">Just Say No</span>{" "}
                in hand!
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20 mb-4 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold mb-1">
                No Defense
              </span>
              <div className="text-[10px] text-gray-400">
                ❌ No "Just Say No" found. You must accept action effects.
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            onClick={handleAccept}
            className="py-2.5 px-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            Accept Action
          </button>

          <button
            onClick={() => {
              if (jsnCard) {
                onReact(true, jsnCard.id);
              }
            }}
            disabled={!jsnCard}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
              jsnCard
                ? "bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt shadow-gold-glow hover:scale-[1.02]"
                : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Play JSN Shield
          </button>
        </div>
      </div>
    </div>
  );
};
