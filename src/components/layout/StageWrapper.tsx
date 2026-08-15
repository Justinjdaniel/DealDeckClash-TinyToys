import React from "react";
import { Volume2, VolumeX, HelpCircle, Gamepad2 } from "lucide-react";
import { useGamifiedAudio } from "../../features/audio/AudioContext";

interface StageWrapperProps {
  children: React.ReactNode;
}

export const StageWrapper: React.FC<StageWrapperProps> = ({ children }) => {
  const { volume, muted, setVolume, setMuted, playSound } = useGamifiedAudio();

  const handleMuteToggle = () => {
    playSound("click");
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div className="w-full h-screen h-[100dvh] bg-slate-950 flex flex-col justify-between overflow-hidden p-2 sm:p-4 relative font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-950/20 blur-[120px] pointer-events-none" />

      {/* Main Grid Wrapper for Wide Screens */}
      <div className="w-full h-full flex-1 min-h-0 flex items-center justify-center gap-4 relative z-10">
        {/* Left Informative Panel: Hidden on Mobile / Tablet */}
        <div className="hidden xl:flex flex-col justify-between w-64 h-full glass-panel rounded-2xl p-5 border border-casino-gold/10 text-left flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="text-casino-gold w-6 h-6 animate-pulse" />
              <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider gold-text-shimmer animate-[scaleIn_0.15s_ease-out]">
                Deal Clash
              </h2>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Welcome to the elite boardroom. Outsmart your opponents, charge
              massive rents, trade properties, and secure triple color sets.
            </p>

            <div className="space-y-4">
              <div className="text-[10px] font-mono font-bold tracking-widest text-casino-gold uppercase border-b border-casino-gold/10 pb-1">
                Boardroom Rules
              </div>
              <ul className="space-y-2 text-xs text-gray-400 font-medium">
                <li className="flex items-start gap-1.5">
                  <span className="text-casino-gold">1.</span>
                  <span>Play up to 3 action cards per turn.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-casino-gold">2.</span>
                  <span>Deposit Cash and properties onto board.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-casino-gold">3.</span>
                  <span>
                    Win instantly by building 3 completed property sets!
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono text-center">
            DEAL DECK CLASH V1.5
          </div>
        </div>

        {/* Center Game Stage Container: Fills remaining space dynamically */}
        <div className="w-full h-full flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </div>

        {/* Right Settings Panel: Hidden on Mobile / Tablet */}
        <div className="hidden xl:flex flex-col justify-between w-64 h-full glass-panel rounded-2xl p-5 border border-casino-gold/10 text-left flex-shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-casino-gold/10 pb-3">
              <HelpCircle className="text-casino-gold w-5 h-5" />
              <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                Control Room
              </h3>
            </div>

            {/* Volume sliders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="boardroom-volume"
                  className="text-xs font-bold text-gray-300 uppercase tracking-wider"
                >
                  Boardroom Audio
                </label>
                <button
                  onClick={handleMuteToggle}
                  className="p-1.5 bg-black/30 hover:bg-black/50 rounded-lg text-casino-gold border border-casino-gold/10 transition-transform hover:scale-105"
                  title={muted ? "Unmute Audio" : "Mute Audio"}
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="boardroom-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={muted}
                  className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-casino-gold disabled:opacity-30"
                />
                <span className="text-xs font-mono font-bold text-casino-gold w-8 text-right">
                  {muted ? "0%" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Quick tips */}
            <div className="space-y-2 text-xs text-gray-400 leading-relaxed pt-4 border-t border-casino-gold/10">
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Tactical Tips
              </div>
              <p>
                💰 Keep some cash in your bank! If an opponent charges rent and
                you can't pay cash, you'll forfeit property cards.
              </p>
              <p className="mt-2">
                🛡️ "Just Say No" can deflect any action directed against you.
                Double counter-plays can occur!
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-casino-gold/5 border border-casino-gold/10 rounded-xl text-[11px] text-casino-gold text-center font-medium leading-relaxed">
            Haptic Touch active! Experience responsive, physically reactive card
            deal snaps.
          </div>
        </div>
      </div>
    </div>
  );
};
