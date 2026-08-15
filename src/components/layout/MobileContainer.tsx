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
      className={`w-full h-full flex-1 min-h-0 bg-radial-gradient-felt shadow-2xl flex flex-col justify-between overflow-hidden relative border border-casino-gold/15 rounded-xl sm:rounded-2xl transition-transform duration-100 ${
        screenShake ? "animate-shake" : ""
      }`}
    >
      {/* Safe-area-inset top & bottom indicators */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-casino-goldDark to-casino-gold z-50 pointer-events-none" />

      <div
        className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {children}
      </div>

      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-casino-gold to-casino-goldDark z-50 pointer-events-none" />
    </div>
  );
};
