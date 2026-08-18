import React from "react";

export const StageWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      {children}
    </div>
  );
};
