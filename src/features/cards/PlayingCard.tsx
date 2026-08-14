import React from "react";
import { motion, PanInfo } from "framer-motion";
import { Card } from "../../types/game";
import { CardShell } from "../../components/svg/CardShell";
import { useCardPhysics } from "../../hooks/useCardPhysics";

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  isFlipped?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onDragEnd?: (event: unknown, info: PanInfo) => void;
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  onClick,
  isFlipped = false,
  isSelected = false,
  isDraggable = false,
  onDragEnd,
  className = "",
}) => {
  const { rotateX, rotateY, handleMouseMove, handleMouseLeave } =
    useCardPhysics();

  return (
    <motion.div
      style={{
        transformPerspective: 1000,
        rotateX: isFlipped ? 0 : rotateX,
        rotateY: isFlipped ? 0 : rotateY,
        z: isSelected ? 30 : 0,
      }}
      drag={isDraggable ? "y" : false}
      dragConstraints={{ top: -300, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      onMouseMove={isFlipped ? undefined : handleMouseMove}
      onMouseLeave={isFlipped ? undefined : handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: isSelected ? 1.05 : 1.08, y: -10 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={`relative cursor-pointer transition-shadow rounded-2xl select-none ${
        isSelected
          ? "ring-4 ring-casino-gold shadow-gold-glow bg-casino-gold/10"
          : "hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
      } ${className}`}
    >
      <div className="w-full h-full backface-hidden transform-style-3d">
        <CardShell card={card} isFlipped={isFlipped} />
      </div>
    </motion.div>
  );
};
