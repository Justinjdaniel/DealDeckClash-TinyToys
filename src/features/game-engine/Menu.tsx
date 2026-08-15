import React, { useState } from "react";
import { BotStyle } from "./bot";
import {
  Disc,
  Play,
  Cpu,
  Shield,
  Globe,
  Terminal,
  LucideIcon,
  Volume2,
  VolumeX,
  Sliders,
} from "lucide-react";
import { useGamifiedAudio } from "../audio/AudioContext";
import { CustomGameRules } from "../../types/game";
import { DEFAULT_CUSTOM_RULES } from "./rules";
import { GameRulesDashboard } from "./GameRulesDashboard";

interface MenuProps {
  onStartGame: (
    botStyle: BotStyle,
    roomCode?: string,
    customRules?: CustomGameRules,
  ) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  const { playSound, muted, setMuted } = useGamifiedAudio();
  const [selectedStyle, setSelectedStyle] = useState<BotStyle>("Aggressive");
  const [roomCode, setRoomCode] = useState("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerMode, setMultiplayerMode] = useState<"lobby" | "room">(
    "lobby",
  );
  const [customRules, setCustomRules] =
    useState<CustomGameRules>(DEFAULT_CUSTOM_RULES);
  const [showRulesDashboard, setShowRulesDashboard] = useState(false);

  const botStyles: { name: BotStyle; desc: string; icon: LucideIcon }[] = [
    {
      name: "Aggressive",
      desc: "Focuses on disrupting sets & charging rent.",
      icon: Terminal,
    },
    {
      name: "Defensive",
      desc: "Prioritizes safety, banks cash, & holds counters.",
      icon: Shield,
    },
    {
      name: "Hoarder",
      desc: "Hoards property cards and builds private cash vaults.",
      icon: Disc,
    },
  ];

  const handleStartLocal = () => {
    playSound("click");
    onStartGame(selectedStyle, undefined, customRules);
  };

  const handleJoinRoom = () => {
    playSound("click");
    if (roomCode.trim()) {
      setMultiplayerMode("room");
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-5 text-left relative">
      {/* Lobby Top Panel */}
      <div className="flex items-center justify-between border-b border-casino-gold/15 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-wide gold-text-shimmer">
            DEAL CLASH
          </h1>
          <p className="text-[9px] text-casino-gold/70 uppercase tracking-widest font-mono">
            Boardroom Battle Arena
          </p>
        </div>

        {/* Small mobile audio toggler */}
        <button
          onClick={() => {
            playSound("click");
            setMuted(!muted);
          }}
          className="p-2 bg-black/40 border border-casino-gold/20 rounded-xl text-casino-gold flex items-center justify-center hover:scale-105 animate-[scaleIn_0.1s_ease-out]"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Lobby Content */}
      <div className="flex-1 my-5 overflow-y-auto space-y-4 pr-1">
        {!isMultiplayer ? (
          <div className="space-y-4">
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white">
                <Cpu className="text-casino-gold w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold uppercase font-serif tracking-wider">
                  Singleplayer Battle
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Match against a tactical local heuristic AI bot configured with
                strategic card play and reaction rules.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-casino-gold">
                Select AI Personality Style
              </span>
              {botStyles.map((style) => {
                const Icon = style.icon;
                const isSelected = selectedStyle === style.name;
                return (
                  <button
                    key={style.name}
                    onClick={() => {
                      playSound("click");
                      setSelectedStyle(style.name);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "border-casino-gold bg-casino-gold/10 shadow-gold-glow"
                        : "border-white/10 bg-black/10 hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${isSelected ? "bg-casino-gold text-casino-felt" : "bg-white/5 text-casino-gold"}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">
                        {style.name} Bot
                      </div>
                      <div className="text-[10px] text-gray-300 leading-normal">
                        {style.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                playSound("click");
                setShowRulesDashboard(true);
              }}
              className="w-full py-2.5 bg-[#20222c] hover:bg-[#282a36] border border-yellow-500/30 text-yellow-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Sliders className="w-4 h-4 text-yellow-400" />
              Configure Game Rules ({customRules.setsRequiredToFinish} Sets to
              Win)
            </button>

            <button
              onClick={handleStartLocal}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt font-bold text-sm rounded-xl shadow-gold-glow hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              Begin Match vs {selectedStyle} AI
            </button>

            <button
              onClick={() => {
                playSound("click");
                setIsMultiplayer(true);
              }}
              className="w-full py-2.5 border border-casino-gold/30 hover:border-casino-gold/60 hover:bg-casino-gold/5 text-casino-gold text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              Online Multiplayer Portal
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-[scaleIn_0.15s_ease-out]">
            {multiplayerMode === "lobby" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white">
                    Online Lobby Rooms
                  </span>
                  <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                    <div>
                      <div className="text-[11px] font-bold text-white">
                        ROOM_9022 (Vip Casino)
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Host: PlayerOne • 1/2 players
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playSound("click");
                        setRoomCode("ROOM_9022");
                        setMultiplayerMode("room");
                      }}
                      className="px-2.5 py-1 bg-casino-gold text-casino-felt text-[10px] font-bold rounded"
                    >
                      Join
                    </button>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                    <div>
                      <div className="text-[11px] font-bold text-white">
                        ROOM_4429 (Monopoly Elite)
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Host: RichUncle • 1/2 players
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playSound("click");
                        setRoomCode("ROOM_4429");
                        setMultiplayerMode("room");
                      }}
                      className="px-2.5 py-1 bg-casino-gold text-casino-felt text-[10px] font-bold rounded"
                    >
                      Join
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Enter Room Code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-casino-gold"
                />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim()}
                    className="py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    Join Room
                  </button>
                  <button
                    onClick={() => {
                      playSound("click");
                      const newCode = `ROOM_${Math.floor(1000 + Math.random() * 9000)}`;
                      setRoomCode(newCode);
                      setMultiplayerMode("room");
                    }}
                    className="py-2.5 bg-white/5 text-white font-bold text-xs border border-white/10 rounded-xl"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            )}

            {multiplayerMode === "room" && (
              <div className="space-y-4">
                <div className="text-center p-3 border border-white/5 bg-black/25 rounded-xl">
                  <span className="text-[9px] uppercase text-casino-gold tracking-widest font-bold font-mono">
                    Room Active
                  </span>
                  <div className="text-lg font-mono text-white font-bold mt-0.5">
                    {roomCode}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound("click");
                    setShowRulesDashboard(true);
                  }}
                  className="w-full py-2.5 bg-[#20222c] hover:bg-[#282a36] border border-yellow-500/30 text-yellow-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Sliders className="w-4 h-4 text-yellow-400" />
                  Configure Game Rules ({customRules.setsRequiredToFinish} Sets)
                </button>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-white font-bold">You (Ready)</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Waiting for opponent player...
                    </span>
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound("click");
                    onStartGame(selectedStyle, roomCode, customRules);
                  }}
                  className="w-full py-3 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl hover:scale-[1.02] transition-transform"
                >
                  Start Game (with AI Mock opponent)
                </button>
                <button
                  onClick={() => {
                    playSound("click");
                    setMultiplayerMode("lobby");
                    setRoomCode("");
                  }}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 rounded-xl"
                >
                  Exit Lobby
                </button>
              </div>
            )}

            {multiplayerMode === "lobby" && (
              <button
                onClick={() => {
                  playSound("click");
                  setIsMultiplayer(false);
                }}
                className="w-full py-2.5 mt-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 font-bold text-xs transition-all"
              >
                Back to Offline Menu
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rules Dashboard Modal Overlay */}
      {showRulesDashboard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <GameRulesDashboard
            initialRules={customRules}
            onSaveAndApply={(updatedRules) => {
              setCustomRules(updatedRules);
              setShowRulesDashboard(false);
            }}
            onClose={() => setShowRulesDashboard(false)}
          />
        </div>
      )}

      {/* Lobby Footer info */}
      <div className="border-t border-white/5 pt-3.5 text-center text-[10px] text-gray-500 font-semibold leading-relaxed">
        Full mobile gameplay layout. Decoupled dispatcher layer supports
        WebSocket servers.
      </div>
    </div>
  );
};
