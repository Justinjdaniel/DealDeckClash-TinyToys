import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star } from "lucide-react";
import { Achievement } from "../../hooks/useGamification";

interface AchievementPopupProps {
  achievement: Achievement | null;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
}) => {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-4 md:right-8 z-50 max-w-sm w-full bg-gradient-to-br from-black/90 to-zinc-900/90 backdrop-blur-md p-5 rounded-2xl border-2 border-casino-gold/40 shadow-gold-glow flex items-start gap-4"
        >
          <div className="bg-casino-gold/15 p-3 rounded-xl text-casino-gold">
            <Award className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="text-[10px] font-mono font-bold tracking-widest text-casino-gold">
              MILESTONE ACHIEVEMENT UNLOCKED!
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              {achievement.title}
            </h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {achievement.description}
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-casino-gold font-bold font-mono">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>+{achievement.xpReward} XP Reward</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
