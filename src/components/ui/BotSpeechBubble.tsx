import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, TrendingUp } from "lucide-react";
import { BotStyle } from "../../bot/botBrain";

interface BotSpeechBubbleProps {
  commentary: string;
  weight?: number;
  tacticalExplanation?: string;
  botStyle?: BotStyle;
  botName?: string;
}

export const BotSpeechBubble: React.FC<BotSpeechBubbleProps> = ({
  commentary,
  weight,
  tacticalExplanation,
  botStyle = "Aggressive",
  botName = "Rich Aunt Bot",
}) => {
  if (!commentary && !tacticalExplanation) return null;

  return (
    <div className="relative w-full my-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${commentary}-${weight}`}
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gradient-to-r from-zinc-900/95 via-black/90 to-zinc-900/95 border border-casino-gold/30 backdrop-blur-md rounded-2xl p-3 shadow-lg shadow-black/50"
        >
          {/* Pointer tail pointing up */}
          <div className="absolute -top-2 left-6 w-3 h-3 bg-zinc-900 border-t border-l border-casino-gold/30 transform rotate-45" />

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400">
              <Bot className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-casino-gold font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-casino-gold animate-pulse" />
                  {botName} ({botStyle})
                </span>

                {typeof weight === "number" && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-casino-gold/20 text-casino-gold border border-casino-gold/30 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Weight: {weight > 0 ? `+${weight}` : weight}
                  </span>
                )}
              </div>

              <p className="text-xs text-white font-medium italic leading-snug">
                "{commentary}"
              </p>

              {tacticalExplanation && (
                <p className="text-[10px] text-gray-400 font-mono mt-1.5 pt-1 border-t border-white/5 truncate">
                  💡 {tacticalExplanation}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
