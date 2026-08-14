import { useMotionValue, useSpring } from "framer-motion";
import React from "react";

export const useCardPhysics = () => {
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);

  const rotateX = useSpring(rotateXVal, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rotateYVal, { stiffness: 200, damping: 20 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert to relative coordinates (-0.5 to 0.5)
    const relativeX = mouseX / width - 0.5;
    const relativeY = mouseY / height - 0.5;

    // Compute rotation angle (max 20 degrees)
    rotateXVal.set(-relativeY * 20);
    rotateYVal.set(relativeX * 20);
  };

  const handleMouseLeave = () => {
    rotateXVal.set(0);
    rotateYVal.set(0);
  };

  return {
    rotateX,
    rotateY,
    handleMouseMove,
    handleMouseLeave,
  };
};
