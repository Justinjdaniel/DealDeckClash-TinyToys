import React, { useEffect, useState, useRef } from 'react';
import { ReactionState, Card } from '../types/game';
import { Shield, XCircle } from 'lucide-react';
import { SoundEffectType } from '../hooks/useFoly';

interface ReactionModalProps {
  reaction: ReactionState;
  onReact: (useJSN: boolean, jsnCardId?: string) => void;
  onTimeout: () => void;
  jsnCard: Card | null;
  playSound: (type: SoundEffectType) => void;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  reaction,
  onReact,
  onTimeout,
  jsnCard,
  playSound
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Store the latest playSound and onTimeout callbacks in refs updated each render
  const playSoundRef = useRef(playSound);
  const onTimeoutRef = useRef(onTimeout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Stable reaction key (combining actionCard id and counterChain length)
  const reactionKey = `${reaction.actionCard.id}-${reaction.counterChain.length}`;

  // Reset countdown using stable reaction key
  useEffect(() => {
    setSecondsLeft(5);
    playSoundRef.current('alertBuzz');
  }, [reactionKey]);

  // pure interval: only decrements secondsLeft
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reactionKey]);

  // Separate effect to handle side effects of secondsLeft: ticks, clear interval, timeout
  useEffect(() => {
    if (secondsLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onTimeoutRef.current();
    } else if (secondsLeft > 0 && secondsLeft < 5) {
      playSoundRef.current('timerTick');
    }
  }, [secondsLeft]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      {/* Dynamic pulse container */}
      <div className="max-w-md w-full glass-panel rounded-2xl p-6 md:p-8 border border-casino-gold shadow-gold-glow animate-[scaleIn_0.2s_ease-out] relative">

        {/* Animated radial countdown timer */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-casino-felt border border-casino-gold rounded-full p-2 w-20 h-20 shadow-gold-glow flex items-center justify-center">
          <svg className="w-full h-full rotate-[-90deg]">
            <circle
              cx="36"
              cy="36"
              r="30"
              stroke="#12382c"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="36"
              cy="36"
              r="30"
              stroke="#dfb76c"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="188.4"
              strokeDashoffset={188.4 - (secondsLeft / 5) * 188.4}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute text-white font-mono font-bold text-lg">{secondsLeft}s</div>
        </div>

        <div className="text-center mt-8 mb-6">
          <Shield className="w-12 h-12 text-casino-gold mx-auto mb-3 animate-bounce" />
          <h2 className="text-2xl font-serif font-bold text-white mb-2">ACTION COUNTER TRIGGERED</h2>

          <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed mb-4">
            An incoming action card <span className="text-casino-gold font-bold">"{reaction.actionCard.name}"</span> was played against you!
            {reaction.actionDetails.amount && (
              <p className="mt-1 font-semibold text-white">Value Owed: {reaction.actionDetails.amount}M Cash</p>
            )}
            {reaction.actionDetails.targetColor && (
              <p className="mt-1 font-semibold text-white">Target Set: {reaction.actionDetails.targetColor}</p>
            )}
          </div>

          {jsnCard ? (
            <div className="p-4 bg-casino-gold/5 rounded-xl border border-casino-gold/30 mb-6 flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-casino-gold font-bold mb-2">Defense Options Available</span>
              <div className="text-sm text-white font-medium flex items-center gap-2">
                🛡️ You have <span className="text-casino-gold font-bold">Just Say No</span> in your hand!
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 mb-6 flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2">Defense Not Available</span>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                ❌ No "Just Say No" found in hand. You must accept penalty.
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            onClick={() => onReact(false)}
            className="py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Accept Penalty
          </button>

          <button
            onClick={() => {
              if (jsnCard) {
                onReact(true, jsnCard.id);
              }
            }}
            disabled={!jsnCard}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              jsnCard
                ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt shadow-gold-glow hover:scale-[1.02]'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            Play JSN Shield
          </button>
        </div>
      </div>
    </div>
  );
};
