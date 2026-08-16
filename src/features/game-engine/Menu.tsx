import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Bot,
  Globe,
  Sparkles,
  Zap,
  Shield,
  Coins,
  Settings,
  Award,
  Swords,
  User,
  Layers,
  HelpCircle,
  Volume2,
  VolumeX,
  Sliders,
  X,
  Trophy,
} from "lucide-react";
import { BotStyle } from "./bot";
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

const botStyles: {
  name: BotStyle;
  desc: string;
  icon: React.ElementType;
  badge: string;
  color: string;
  accent: string;
}[] = [
  {
    name: "Aggressive",
    desc: "Prioritizes swift attacks, high rent charges & property steals.",
    icon: Zap,
    badge: "Aggressive",
    color: "from-amber-500 to-orange-600",
    accent: "border-amber-500/50 text-amber-400 bg-amber-500/10",
  },
  {
    name: "Balanced",
    desc: "Balances bank growth with timed property set completions.",
    icon: Swords,
    badge: "Balanced",
    color: "from-emerald-500 to-teal-600",
    accent: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
  },
  {
    name: "Tactical",
    desc: "Holds Deal Breakers & Just Say No for high-leverage counters.",
    icon: Shield,
    badge: "Defensive Master",
    color: "from-blue-500 to-indigo-600",
    accent: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  },
  {
    name: "Wealthy",
    desc: "Loads cash bank and builds massive hotel monopolies.",
    icon: Award,
    badge: "Tycoon",
    color: "from-purple-500 to-pink-600",
    accent: "border-purple-500/50 text-purple-400 bg-purple-500/10",
  },
];

const mockCollectionCards = [
  { name: "Deal Breaker", type: "Action", color: "bg-purple-600", val: "M 5" },
  { name: "Just Say No", type: "Reaction", color: "bg-blue-600", val: "M 4" },
  {
    name: "Slick Boardwalk",
    type: "Property",
    color: "bg-blue-800",
    val: "M 4",
  },
  { name: "Pass Go", type: "Draw 2", color: "bg-emerald-600", val: "M 1" },
  { name: "Luxury Hotel", type: "Building", color: "bg-amber-600", val: "M 4" },
  { name: "Sly Street Theft", type: "Action", color: "bg-red-600", val: "M 3" },
];

export const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  const [selectedStyle, setSelectedStyle] = useState<BotStyle>("Aggressive");
  const [activeTab, setActiveTab] = useState<"solo" | "multiplayer">("solo");
  const [multiplayerMode, setMultiplayerMode] = useState<"lobby" | "room">(
    "lobby",
  );
  const [customRules, setCustomRules] =
    useState<CustomGameRules>(DEFAULT_CUSTOM_RULES);
  const [showRulesDashboard, setShowRulesDashboard] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { playSound, volume, setVolume, muted, setMuted } = useGamifiedAudio();

  const handleStartLocal = () => {
    playSound("click");
    onStartGame(selectedStyle, undefined, customRules);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    playSound("click");
    setMultiplayerMode("room");
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
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-5 text-white select-none overflow-y-auto relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Toy Elements Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-5 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between z-10 gap-2 mb-3"
      >
        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl px-3 py-1.5 backdrop-blur-md shadow-lg">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-emerald-500 text-slate-950 px-1 rounded-full border border-slate-900">
              LV5
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-slate-100 flex items-center gap-1">
              Tycoon Player
              <Sparkles className="w-3 h-3 text-amber-400" />
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Rank: Toy Master
            </span>
          </div>
        </div>

        {/* Currency & Settings Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-xs font-black font-mono text-amber-300">
              2,450 🪙
            </span>
          </div>

          <button
            onClick={() => {
              playSound("click");
              setShowSettingsModal(true);
            }}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-2xl transition-all shadow-md active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </motion.div>

      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center z-10 my-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm">
          <Sparkles className="w-3 h-3" />
          Tiny Toys Edition
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-serif uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
          DEAL DECK CLASH
        </h1>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
          Tactical fast-paced property trading card arena powered by smart AI &
          live multiplayer.
        </p>

        {/* 3D Toy Card Showcase Banner */}
        <div className="flex justify-center items-center gap-2 mt-4 relative h-28 sm:h-32">
          {mockCollectionCards.slice(0, 4).map((card, idx) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              whileHover={{ scale: 1.1, zIndex: 20, rotate: 0 }}
              style={{
                rotate: (idx - 1.5) * 8,
              }}
              className={`w-20 sm:w-24 h-28 sm:h-32 rounded-xl p-2 border-2 border-white/20 shadow-2xl flex flex-col justify-between cursor-pointer transition-shadow ${card.color} backdrop-blur-md`}
              onClick={() => {
                playSound("click");
                setShowCollectionModal(true);
              }}
            >
              <div className="flex justify-between items-start text-[9px] font-black font-mono">
                <span className="bg-black/40 px-1 rounded text-white">
                  {card.val}
                </span>
                <span className="text-[8px] bg-white/20 px-1 rounded uppercase">
                  {card.type}
                </span>
              </div>
              <div className="text-center my-auto">
                <div className="text-[10px] font-black leading-tight drop-shadow-md">
                  {card.name}
                </div>
              </div>
              <div className="text-[8px] font-mono text-center opacity-80 uppercase">
                Tiny Toy
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Mode Navigation & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="z-10 space-y-3 my-2"
      >
        {/* Play Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              playSound("click");
              setActiveTab("solo");
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "solo"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Bot className="w-4 h-4" />
            Solo vs AI Bot
          </button>
          <button
            onClick={() => {
              playSound("click");
              setActiveTab("multiplayer");
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "multiplayer"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Globe className="w-4 h-4" />
            Online Arena
          </button>
        </div>

        {activeTab === "solo" ? (
          <div className="space-y-3 animate-fadeIn">
            {/* AI Personality Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="uppercase tracking-wider font-mono text-amber-400">
                  Select Bot Personality
                </span>
                <span className="text-[10px] text-slate-500">
                  Local Tactical Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {botStyles.map((style) => {
                  const Icon = style.icon;
                  const isSelected = selectedStyle === style.name;
                  return (
                    <motion.button
                      key={style.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playSound("click");
                        setSelectedStyle(style.name);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? `border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10`
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? "bg-amber-400 text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                            isSelected
                              ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {style.badge}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-100">
                          {style.name} Bot
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                          {style.desc}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
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
              Configure Game Rules ({customRules.setsRequiredToFinish} Sets to
              Win)
            </button>

            <button
            {/* Primary CTA Play Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartLocal}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:brightness-110 transition-all border border-emerald-400/50"
            >
              <Play className="w-5 h-5 fill-current" />
              QUICK MATCH VS {selectedStyle.toUpperCase()}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3 animate-fadeIn">
            {multiplayerMode === "lobby" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="uppercase tracking-wider font-mono text-amber-400">
                    Live Arena Lobbies
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online Servers Active
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        ROOM_9022 (VIP Casino)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Host: MasterPlayer • 1/2
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playSound("click");
                        setRoomCode("ROOM_9022");
                        setMultiplayerMode("room");
                      }}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      JOIN
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        ROOM_4429 (Monopoly Elite)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Host: RichTycoon • 1/2
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playSound("click");
                        setRoomCode("ROOM_4429");
                        setMultiplayerMode("room");
                      }}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition-colors"
                    >
                      JOIN
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER ROOM CODE"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl"
                  >
                    JOIN
                  </button>
                </div>

                <button
                  onClick={() => {
                    playSound("click");
                    const newCode = `ROOM_${Math.floor(1000 + Math.random() * 9000)}`;
                    setRoomCode(newCode);
                    setMultiplayerMode("room");
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  CREATE CUSTOM LOBBY
                </button>
              </div>
            )}

            {multiplayerMode === "room" && (
              <div className="space-y-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
                <div className="text-center p-2.5 bg-slate-950 rounded-xl border border-amber-500/30">
                  <span className="text-[9px] uppercase text-amber-400 font-mono tracking-widest">
                    LOBBY READY
                  </span>
                  <div className="text-base font-mono font-black text-slate-100 mt-0.5">
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
                  <div className="p-2 bg-slate-800/60 rounded-lg flex items-center justify-between">
                    <span className="text-slate-400">
                      Waiting for Opponent...
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound("click");
                    onStartGame(selectedStyle, roomCode, customRules);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  START MATCH (WITH MOCK BOT)
                </button>
                <button
                  onClick={() => {
                    playSound("click");
                    setMultiplayerMode("lobby");
                  }}
                  className="w-full py-2 bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl"
                >
                  LEAVE ROOM
                </button>
              </div>
            )}
          </div>
        )}

        {/* Secondary Action Buttons (Collection, How to Play, Stats) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => {
              playSound("click");
              setShowCollectionModal(true);
            }}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-colors"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-300">Cards</span>
          </button>
          <button
            onClick={() => {
              playSound("click");
              setShowRulesModal(true);
            }}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-300">Rules</span>
          </button>
          <button
            onClick={() => {
              playSound("click");
              setShowSettingsModal(true);
            }}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-colors"
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-300">Stats</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="border-t border-slate-800/80 pt-2.5 z-10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>v1.5 • Tiny Toys Engine</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          WebSocket Ready
        </span>
      </div>

      {/* Modals & Overlay Drawers */}

      {/* Rules Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
                  How To Play
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-1">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="font-bold text-amber-400">
                    1. Objective:
                  </span>
                  <p className="mt-0.5 text-slate-400">
                    Be the first player to complete 3 full property sets of
                    different colors!
                  </p>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="font-bold text-amber-400">
                    2. Play 3 Cards Per Turn:
                  </span>
                  <p className="mt-0.5 text-slate-400">
                    Deposit cash into your bank, lay property cards, or play
                    action cards like Deal Breaker and Rent.
                  </p>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="font-bold text-amber-400">
                    3. Reactions & Defense:
                  </span>
                  <p className="mt-0.5 text-slate-400">
                    Use "Just Say No" cards to instantly block incoming action
                    cards or rent charges!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider"
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      {/* Cards Collection Showcase Modal */}
      <AnimatePresence>
        {showCollectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCollectionModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
                  Tiny Toys Card Vault
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {mockCollectionCards.map((c) => (
                  <div
                    key={c.name}
                    className={`p-2.5 rounded-xl border border-white/20 ${c.color} text-white space-y-1 shadow-md`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="bg-black/40 px-1 rounded">{c.val}</span>
                      <span className="opacity-80">{c.type}</span>
                    </div>
                    <div className="font-black text-xs">{c.name}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowCollectionModal(false)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider"
              >
                CLOSE VAULT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / Controls Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
                  Game Settings
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Audio Master Volume</span>
                    <button
                      onClick={() => setMuted(!muted)}
                      className="p-1.5 bg-slate-800 rounded-lg text-amber-400"
                    >
                      {muted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    disabled={muted}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Career Statistics
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="text-amber-400 font-mono font-black text-sm">
                        24
                      </div>
                      <div className="text-[10px] text-slate-400">Wins</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="text-emerald-400 font-mono font-black text-sm">
                        78%
                      </div>
                      <div className="text-[10px] text-slate-400">Win Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider"
              >
                SAVE & CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
