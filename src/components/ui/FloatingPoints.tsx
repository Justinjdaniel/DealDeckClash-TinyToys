import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingPoint } from "../../hooks/useGamification";

interface FloatingPointsProps {
  items: FloatingPoint[];
}

export const FloatingPoints: React.FC<FloatingPointsProps> = ({ items }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.5, x: item.x, y: item.y }}
            animate={{ opacity: 1, scale: 1.2, y: item.y - 120 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute font-mono font-black text-lg md:text-xl text-casino-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-1 select-none"
          >
            <span>✨</span>
            <span>{item.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
