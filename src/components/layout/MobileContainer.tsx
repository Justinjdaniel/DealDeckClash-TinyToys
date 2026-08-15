import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
  screenShake?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  screenShake = false,
}) => {
  return (
    <div
      className={`w-full h-full flex-1 min-h-0 bg-radial-gradient-felt shadow-2xl flex flex-col justify-between overflow-hidden relative border-2 border-casino-gold/40 rounded-xl sm:rounded-2xl transition-transform duration-100 ${
        screenShake ? "animate-shake" : ""
      }`}
    >
      {/* Gold stitched border accent */}
      <div className="absolute inset-1 sm:inset-1.5 border border-dashed border-casino-gold/30 rounded-lg pointer-events-none z-10" />

      {/* Brushed gold edge indicators */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-casino-goldDark via-casino-goldLight to-casino-goldDark z-50 pointer-events-none" />

      <div
        className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative z-20"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {children}
      </div>

      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-casino-goldDark via-casino-goldLight to-casino-goldDark z-50 pointer-events-none" />
    </div>
  );
};
