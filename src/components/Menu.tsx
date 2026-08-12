import React, { useState } from 'react';
import { BotStyle } from '../services/bot';
import { Disc, Play, Users, Cpu, Radio, Shield, Globe, Terminal, LucideIcon } from 'lucide-react';

interface MenuProps {
  onStartGame: (botStyle: BotStyle, roomCode?: string) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  const [selectedStyle, setSelectedStyle] = useState<BotStyle>('Aggressive');
  const [roomCode, setRoomCode] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerMode, setMultiplayerMode] = useState<'lobby' | 'joining' | 'room'>('lobby');

  const botStyles: { name: BotStyle; desc: string; icon: LucideIcon }[] = [
    { name: 'Aggressive', desc: 'Focuses on disrupting completed sets and charging massive rent.', icon: Terminal },
    { name: 'Defensive', desc: 'Prioritizes safety, banking cash, and holding counters.', icon: Shield },
    { name: 'Hoarder', desc: 'Hoards property cards and builds massive private vaults.', icon: Disc }
  ];

  const handleStartLocal = () => {
    onStartGame(selectedStyle);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      setMultiplayerMode('room');
    }
  };

  return (
    <div className="min-h-screen bg-radial-gradient-felt flex flex-col items-center justify-center p-4">
      {/* Outer elegant border frame */}
      <div className="max-w-4xl w-full glass-panel rounded-3xl p-8 md:p-12 shadow-2xl relative border-2 border-casino-gold/30">
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-casino-gold/10 rounded-2xl pointer-events-none" />

        {/* Title area */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold font-serif tracking-wide gold-text-shimmer mb-3 drop-shadow-lg">
            DEAL DECK CLASH
          </h1>
          <p className="text-casino-gold/70 tracking-widest text-xs uppercase font-semibold">
            The Ultimate Monopoly Deal Boardroom Arena
          </p>
        </div>

        {/* Main Content split */}
        <div className="grid md:grid-cols-2 gap-8 relative z-10">

          {/* Section 1: Play vs AI */}
          <div className="glass-panel-light rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="text-casino-gold w-6 h-6 animate-pulse" />
                <h2 className="text-xl font-bold text-white font-serif">Singleplayer Boardroom</h2>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                Challenge our tactical client-side heuristic AI bot configured with unique playing styles and strategic decision-making trees.
              </p>

              <label className="block text-xs uppercase text-casino-gold/80 font-bold mb-3 tracking-wider">
                Select Bot Personality Style
              </label>

              <div className="space-y-3 mb-6">
                {botStyles.map(style => {
                  const Icon = style.icon;
                  const isSelected = selectedStyle === style.name;
                  return (
                    <button
                      key={style.name}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-casino-gold bg-casino-gold/10 shadow-gold-glow'
                          : 'border-white/10 bg-black/10 hover:bg-white/5'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-casino-gold text-casino-felt' : 'bg-white/5 text-casino-gold'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{style.name} Bot</div>
                        <div className="text-xs text-gray-300 mt-0.5">{style.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleStartLocal}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldLight text-casino-felt font-bold text-base shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Enter Match vs Smart AI
            </button>
          </div>

          {/* Section 2: Mock Multiplayer Lobby */}
          <div className="glass-panel-light rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
            {!isMultiplayer ? (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="text-casino-gold w-6 h-6" />
                    <h2 className="text-xl font-bold text-white font-serif">Multiplayer Lobby</h2>
                  </div>
                  <p className="text-gray-300 text-sm mb-6">
                    Future-proof network interface fully compatible with asynchronous API calls and WebSocket room subscriptions.
                  </p>

                  <div className="rounded-xl border border-dashed border-casino-gold/20 p-5 bg-black/10 text-center text-gray-400 mb-6">
                    <Radio className="w-8 h-8 text-casino-gold mx-auto mb-3 animate-ping" />
                    <span className="text-xs font-semibold text-casino-gold/90 block mb-1">NETWORK DECOUPLING ACTIVE</span>
                    <span className="text-[11px] leading-relaxed">
                      All game states are fully abstracted. Activating multiplayer loads a simulated network API layer.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMultiplayer(true)}
                  className="w-full py-4 rounded-xl border border-casino-gold/40 hover:border-casino-gold/80 text-casino-gold font-bold text-sm hover:bg-casino-gold/5 transition-all flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Connect To Multiplayer Portal
                </button>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full">
                {multiplayerMode === 'lobby' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-bold text-white">Online Rooms</h3>
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Ping: 12ms
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                        <div>
                          <div className="text-xs font-bold text-white">ROOM_9022 (Vip Casino)</div>
                          <div className="text-[10px] text-gray-400">Host: PlayerOne • 1/2 players</div>
                        </div>
                        <button
                          onClick={() => {
                            setRoomCode('ROOM_9022');
                            setMultiplayerMode('room');
                          }}
                          className="px-3 py-1.5 bg-casino-gold text-casino-felt text-xs font-bold rounded-lg hover:bg-casino-goldLight"
                        >
                          Join
                        </button>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                        <div>
                          <div className="text-xs font-bold text-white">ROOM_4429 (Monopoly Elite)</div>
                          <div className="text-[10px] text-gray-400">Host: RichUncle • 1/2 players</div>
                        </div>
                        <button
                          onClick={() => {
                            setRoomCode('ROOM_4429');
                            setMultiplayerMode('room');
                          }}
                          className="px-3 py-1.5 bg-casino-gold text-casino-felt text-xs font-bold rounded-lg hover:bg-casino-goldLight"
                        >
                          Join
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <input
                        type="text"
                        placeholder="Enter Room Code (e.g. MONO1)"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-casino-gold text-center font-mono tracking-widest"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleJoinRoom}
                          disabled={!roomCode}
                          className="py-3 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl disabled:opacity-40"
                        >
                          Join Room
                        </button>
                        <button
                          onClick={() => {
                            const newCode = `ROOM_${Math.floor(1000 + Math.random() * 9000)}`;
                            setRoomCode(newCode);
                            setMultiplayerMode('room');
                          }}
                          className="py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 rounded-xl"
                        >
                          Create Room
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {multiplayerMode === 'room' && (
                  <div className="space-y-4">
                    <div className="border-b border-white/10 pb-3 text-center">
                      <div className="text-[10px] uppercase text-casino-gold tracking-widest font-bold">Room Active</div>
                      <div className="text-xl font-mono text-white font-bold">{roomCode}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-white font-bold">You (Ready)</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-gray-400">Waiting for opponent...</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="rounded-xl bg-casino-gold/5 p-4 border border-casino-gold/10 text-center">
                      <span className="text-[11px] text-casino-gold/90 font-medium">
                        Mock network abstraction layer online. You can choose to inject a smart AI bot to play as Player 2 inside this decoupled network room.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onStartGame(selectedStyle, roomCode);
                        }}
                        className="py-3 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl hover:scale-[1.02] transition-transform"
                      >
                        Start Game (With Bot)
                      </button>
                      <button
                        onClick={() => {
                          setIsMultiplayer(false);
                          setMultiplayerMode('lobby');
                          setRoomCode('');
                        }}
                        className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 rounded-xl"
                      >
                        Exit Lobby
                      </button>
                    </div>
                  </div>
                )}

                {multiplayerMode === 'lobby' && (
                  <button
                    onClick={() => setIsMultiplayer(false)}
                    className="w-full py-3.5 mt-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 font-bold text-xs transition-all"
                  >
                    Return to Offline Screen
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer info banner */}
        <div className="mt-8 text-center border-t border-white/5 pt-6 text-[11px] text-gray-400">
          Handcrafted modern boardroom. Rules are 100% compliant with the official Monopoly Deal handbook.
        </div>
      </div>
    </div>
  );
};
