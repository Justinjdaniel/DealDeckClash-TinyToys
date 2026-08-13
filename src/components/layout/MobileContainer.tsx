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
      className={`w-full h-full max-w-md mx-auto bg-radial-gradient-felt shadow-2xl flex flex-col justify-between overflow-hidden relative border-x border-casino-gold/15 transition-transform duration-100 ${
        screenShake ? "animate-shake" : ""
      }`}
      style={{
        height: "100dvh",
        minHeight: "-webkit-fill-available",
      }}
    >
      {/* Safe-area-inset top & bottom indicators */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-casino-goldDark to-casino-gold z-50 pointer-events-none" />

      <div className="flex-1 flex flex-col justify-between overflow-y-auto pb-safe pt-safe">
        {children}
      </div>

      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-casino-gold to-casino-goldDark z-50 pointer-events-none" />
    </div>
  );
};
