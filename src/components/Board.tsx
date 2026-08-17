import React, { useState, useEffect, useRef } from "react";
import {
  GameState,
  Card,
  CardColor,
  WildcardCard,
  ActionCard,
  PropertyCard,
  GameAction,
  PropertySet,
} from "../types/game";
import { BotStyle, evaluateBotTurn } from "../services/bot";
import { COLOR_HEX } from "../services/deck";
import {
  findJSNInHand,
  getPlayerBankCards,
} from "../features/game-engine/rules";
import {
  Coins,
  AlertTriangle,
  MessageCircle,
  FileText,
  Sparkles,
  LogOut,
  RefreshCw,
  ArrowUp,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { SoundEffectType } from "../hooks/useFoly";

interface BoardProps {
  state: GameState;
  onDispatch: (action: GameAction) => void;
  botStyle: BotStyle;
  playSound: (type: SoundEffectType) => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  onDispatch,
  botStyle,
  playSound,
}) => {
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [botCommentary, setBotCommentary] = useState<string>("");

  const latestStateRef = useRef(state);
  const onDispatchRef = useRef(onDispatch);
  const playSoundRef = useRef(playSound);
  const victoryTriggeredRef = useRef(false);

  useEffect(() => {
    latestStateRef.current = state;
    onDispatchRef.current = onDispatch;
    playSoundRef.current = playSound;
  }, [state, onDispatch, playSound]);

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [targetSelectOpen, setTargetSelectOpen] = useState(false);
  const [targetOptions, setTargetOptions] = useState<{
    type: string;
    options: { label: string; value: string }[];
    extra?: { opponentCardId: string };
  } | null>(null);
  const [selectedTargetOption, setSelectedTargetOption] = useState<
    string | null
  >(null);

  const [activeWildcard, setActiveWildcard] = useState<WildcardCard | null>(
    null,
  );
  const [wildcardSelectorOpen, setWildcardSelectorOpen] = useState(false);

  const bot = (state.players || []).find((p) => p?.isBot);
  const human = (state.players || []).find((p) => !p?.isBot);
  const activePlayer = state.players?.[state.currentPlayerIndex];
  const isHumanTurn = activePlayer ? activePlayer.id === human?.id : false;

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.logs]);

  useEffect(() => {
    if (state.status === "WINNER") {
      if (!victoryTriggeredRef.current) {
        victoryTriggeredRef.current = true;
        if (state.winnerId === human?.id) {
          playSoundRef.current("victoryFanfare");
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else {
          playSoundRef.current("lossMelody");
        }
      }
    } else {
      victoryTriggeredRef.current = false;
    }
  }, [state.status, state.winnerId, human?.id]);

  const isBotActive = !isHumanTurn && bot;
  const botTurnKey = isBotActive
    ? `${state.status}-${state.currentPlayerIndex}-${state.actionPointsLeft}-${state.reactionQueue ? "rx" : "norx"}-${(state.players?.[state.currentPlayerIndex]?.hand || []).length}`
    : "idle";

  useEffect(() => {
    if (!isBotActive) return;
    const currentStatus = state.status;
    if (currentStatus !== "PLAYING" && currentStatus !== "DISCARDING") return;
    if (state.reactionQueue) return;

    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      const currentState = latestStateRef.current;
      if (!bot) return;
      const decision = evaluateBotTurn(currentState, bot.id, botStyle);

      if (decision.intentReason) {
        setBotCommentary(decision.intentReason);
      }

      if (decision.action.type === "PLAY_CARD") {
        playSoundRef.current("cardPlay");
        onDispatchRef.current({
          type: "PLAY_CARD",
          payload: decision.action.payload,
        });
      } else if (decision.action.type === "DISCARD_OVERFLOW") {
        playSoundRef.current("cardSweep");
        onDispatchRef.current({
          type: "DISCARD_OVERFLOW",
          payload: decision.action.payload,
        });
      } else if (decision.action.type === "END_TURN") {
        onDispatchRef.current({
          type: "END_TURN",
          payload: decision.action.payload,
        });
      }
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    botTurnKey,
    botStyle,
    bot?.id,
    isBotActive,
    bot,
    state.reactionQueue,
    state.status,
  ]);

  useEffect(() => {
    const rx = state.reactionQueue;
    if (!rx || rx.targetPlayerId !== bot?.id) return;

    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      const currentBot = (latestStateRef.current.players || []).find(
        (p) => p?.id === bot?.id,
      );
      const jsn = findJSNInHand(currentBot);
      if (jsn && Math.random() < 0.5) {
        playSoundRef.current("jsnPlay");
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: bot.id, useJSN: true, jsnCardId: jsn.id },
        });
      } else {
        onDispatchRef.current({
          type: "RESPOND_TO_ACTION",
          payload: { playerId: bot.id, useJSN: false },
        });
      }
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [state.reactionQueue, bot]);

  if (!human || !bot) return null;

  const botBankCards = getPlayerBankCards(bot);
  const botBankTotal = botBankCards.reduce(
    (acc, c) => acc + (c?.value || 0),
    0,
  );
  const botSets: PropertySet[] = Array.isArray(bot.properties)
    ? bot.properties
    : Object.values(bot.properties || {});

  const humanBankCards = getPlayerBankCards(human);
  const humanBankTotal = humanBankCards.reduce(
    (acc, c) => acc + (c?.value || 0),
    0,
  );
  const humanSets: PropertySet[] = Array.isArray(human.properties)
    ? human.properties
    : Object.values(human.properties || {});
  const humanHand = (human.hand || []).filter(Boolean);

  const handleHandCardClick = (card: Card) => {
    if (!isHumanTurn || state.status !== "PLAYING") return;
    setSelectedHandCard(card);
    setActionMenuOpen(true);
  };

  const handlePlayToBank = () => {
    if (!selectedHandCard) return;
    playSound("bankCoin");
    onDispatch({
      type: "PLAY_CARD",
      payload: {
        playerId: human.id,
        cardId: selectedHandCard.id,
        targetZone: "bank",
      },
    });
    setSelectedHandCard(null);
    setActionMenuOpen(false);
  };

  const handlePlayToProperties = () => {
    if (!selectedHandCard) return;

    if (selectedHandCard.type === "Property") {
      playSound("cardPlay");
      onDispatch({
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "properties",
        },
      });
      setSelectedHandCard(null);
      setActionMenuOpen(false);
    } else if (selectedHandCard.type === "Wildcard") {
      setActiveWildcard(selectedHandCard as WildcardCard);
      setWildcardSelectorOpen(true);
      setActionMenuOpen(false);
    }
  };

  const handlePlayAction = () => {
    if (!selectedHandCard || selectedHandCard.type !== "Action") return;
    const actionCard = selectedHandCard as ActionCard;

    if (actionCard.actionType === "Rent" && actionCard.rentColors) {
      const playerColors = humanSets
        .filter((s) => Array.isArray(s?.cards) && s.cards.length > 0)
        .map((s) => s.color);
      const choices = actionCard.rentColors.filter((c) =>
        playerColors.includes(c),
      );

      if (choices.length > 0) {
        setTargetOptions({
          type: "RENT_COLOR",
          options: choices.map((c) => ({ label: `Rent on ${c}`, value: c })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    if (actionCard.actionType === "Multi-Rent") {
      const playerColors = humanSets
        .filter((s) => Array.isArray(s?.cards) && s.cards.length > 0)
        .map((s) => s.color);
      if (playerColors.length > 0) {
        setTargetOptions({
          type: "RENT_COLOR",
          options: playerColors.map((c) => ({
            label: `Multi-Rent on ${c}`,
            value: c,
          })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    if (actionCard.actionType === "Sly Deal") {
      const targetProps = botSets
        .filter(
          (s) =>
            s && !s.isComplete && Array.isArray(s.cards) && s.cards.length > 0,
        )
        .flatMap((s) => s.cards);
      if (targetProps.length > 0) {
        setTargetOptions({
          type: "SLY_DEAL_TARGET",
          options: targetProps.map((c) => ({
            label: `Steal ${c.name}`,
            value: c.id,
          })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    if (actionCard.actionType === "Forced Deal") {
      const botProps = botSets
        .filter(
          (s) =>
            s && !s.isComplete && Array.isArray(s.cards) && s.cards.length > 0,
        )
        .flatMap((s) => s.cards);
      const myProps = humanSets
        .filter(
          (s) =>
            s && !s.isComplete && Array.isArray(s.cards) && s.cards.length > 0,
        )
        .flatMap((s) => s.cards);

      if (botProps.length > 0 && myProps.length > 0) {
        setTargetOptions({
          type: "FORCED_DEAL_STEP_1",
          options: botProps.map((c) => ({
            label: `Steal ${c.name}`,
            value: c.id,
          })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    if (actionCard.actionType === "Deal Breaker") {
      const completeSets = botSets.filter((s) => s?.isComplete);
      if (completeSets.length > 0) {
        setTargetOptions({
          type: "DEAL_BREAKER_TARGET",
          options: completeSets.map((s) => ({
            label: `Steal complete ${s.color} set`,
            value: s.color,
          })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    playSound("cardPlay");
    onDispatch({
      type: "PLAY_CARD",
      payload: {
        playerId: human.id,
        cardId: selectedHandCard.id,
        targetZone: "center",
      },
    });
    setSelectedHandCard(null);
    setActionMenuOpen(false);
  };

  const handleTargetConfirm = () => {
    if (!selectedHandCard || !selectedTargetOption || !targetOptions) return;

    if (targetOptions.type === "RENT_COLOR") {
      playSound("cardPlay");
      onDispatch({
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "center",
          options: { color: selectedTargetOption as CardColor },
        },
      });
    } else if (targetOptions.type === "SLY_DEAL_TARGET") {
      playSound("cardPlay");
      onDispatch({
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "center",
          options: { targetCardId: selectedTargetOption },
        },
      });
    } else if (targetOptions.type === "FORCED_DEAL_STEP_1") {
      const myProps = humanSets
        .filter(
          (s) =>
            s && !s.isComplete && Array.isArray(s.cards) && s.cards.length > 0,
        )
        .flatMap((s) => s.cards);
      setTargetOptions({
        type: "FORCED_DEAL_STEP_2",
        options: myProps.map((c) => ({ label: `Give ${c.name}`, value: c.id })),
        extra: { opponentCardId: selectedTargetOption },
      });
      setSelectedTargetOption(null);
      return;
    } else if (targetOptions.type === "FORCED_DEAL_STEP_2") {
      playSound("cardPlay");
      onDispatch({
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "center",
          options: {
            targetCardId: targetOptions.extra?.opponentCardId,
            swapCardId: selectedTargetOption,
          },
        },
      });
    } else if (targetOptions.type === "DEAL_BREAKER_TARGET") {
      playSound("cardPlay");
      onDispatch({
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "center",
          options: { targetColor: selectedTargetOption as CardColor },
        },
      });
    }

    setSelectedHandCard(null);
    setSelectedTargetOption(null);
    setTargetOptions(null);
    setTargetSelectOpen(false);
  };

  const handleWildcardColorSelect = (color: CardColor) => {
    if (!activeWildcard) return;
    playSound("cardPlay");
    onDispatch({
      type: "PLAY_CARD",
      payload: {
        playerId: human.id,
        cardId: activeWildcard.id,
        targetZone: "properties",
        options: { color },
      },
    });
    setActiveWildcard(null);
    setWildcardSelectorOpen(false);
  };

  const handleEndTurn = () => {
    if (!isHumanTurn || state.status !== "PLAYING") return;
    onDispatch({
      type: "END_TURN",
      payload: { playerId: human.id },
    });
  };

  const toggleWildcardInPlay = (cardId: string, color: CardColor) => {
    if (!isHumanTurn) return;
    onDispatch({
      type: "TOGGLE_WILDCARD_COLOR",
      payload: { playerId: human.id, cardId, color },
    });
  };

  return (
    <div className="min-h-screen bg-radial-gradient-felt flex flex-col justify-between overflow-hidden relative select-none">
      {/* HUD Bar */}
      <div className="glass-panel w-full px-6 py-4 flex items-center justify-between border-b border-casino-gold/10 relative z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-casino-gold w-5 h-5 animate-pulse" />
          <span className="font-serif font-bold text-lg text-white">
            Boardroom Arena
          </span>
          {state.roomCode && (
            <span className="text-[11px] bg-casino-gold/10 text-casino-gold border border-casino-gold/20 px-2.5 py-0.5 rounded-full font-mono tracking-widest font-bold">
              {state.roomCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Coins className="text-casino-gold w-5 h-5" />
            <div className="text-xs font-bold text-gray-300">
              TURN ACTIONS:{" "}
              <span
                className={`text-base font-mono font-bold ${state.actionPointsLeft > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {state.actionPointsLeft}/3
              </span>
            </div>
          </div>

          <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isHumanTurn ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}
            />
            STATUS:{" "}
            <span className="text-white font-mono">
              {isHumanTurn ? "YOUR TURN" : "BOT IS THINKING..."}
            </span>
          </div>

          <button
            onClick={() => onDispatch({ type: "RESET_GAME" })}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg hover:scale-105 active:scale-95 transition-transform"
            title="Surrender Match"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col justify-between gap-4 max-h-[85vh] overflow-y-auto pr-1">
          {/* BOT AREA */}
          <div className="glass-panel rounded-2xl p-4 border border-white/5 relative">
            <div className="absolute top-2 right-4 flex items-center gap-1 text-casino-gold/80 text-[11px] font-bold">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{botStyle} AI BOT</span>
            </div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-casino-gold/10 border-2 border-casino-gold flex items-center justify-center font-serif text-white text-lg font-bold">
                  AI
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white">
                  {(bot.hand || []).length} Cards
                </div>
              </div>

              <div>
                <h3 className="font-serif font-bold text-white text-sm">
                  Rich Aunt Bot
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-gray-300">
                    Bank Vault: {botBankTotal}M
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {botSets.map((set) => {
                if (!set || !Array.isArray(set.cards) || set.cards.length === 0)
                  return null;
                return (
                  <div
                    key={set.color}
                    className="p-2.5 rounded-xl bg-black/25 border border-white/5 flex flex-col justify-between h-28 relative"
                  >
                    <div
                      className="w-full h-2 rounded-full mb-2"
                      style={{ backgroundColor: COLOR_HEX[set.color] }}
                    />
                    <div className="text-center font-bold text-[11px] text-white font-mono truncate">
                      {set.color} Set
                    </div>
                    <div className="text-center text-[10px] text-gray-400 font-bold mb-1">
                      {set.cards.length} Card{set.cards.length > 1 ? "s" : ""}
                    </div>
                    {set.isComplete && (
                      <div className="absolute top-1 right-1 bg-casino-gold text-casino-felt text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">
                        Complete
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PLAY AREA */}
          <div className="grid grid-cols-3 gap-4 items-center justify-center py-4">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-36 rounded-xl bg-gradient-to-br from-casino-goldDark to-casino-goldLight p-1 shadow-gold-glow cursor-not-allowed">
                <div className="w-full h-full rounded-lg bg-casino-felt border border-casino-gold/40 flex flex-col items-center justify-center p-2 text-center">
                  <Coins className="w-8 h-8 text-casino-gold animate-bounce mb-2" />
                  <span className="font-serif font-bold text-white text-xs tracking-wider">
                    DRAW DECK
                  </span>
                  <span className="font-mono text-[10px] text-casino-gold font-bold mt-1">
                    {(state.deck || []).length} Left
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-36 rounded-xl border-2 border-dashed border-casino-gold/30 flex flex-col items-center justify-center text-center p-2">
                {(state.discardPile || []).length > 0 ? (
                  <div className="w-full h-full rounded-lg bg-black/40 border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
                    <div className="w-full h-1.5 rounded-full bg-red-500 mb-1" />
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                      Played
                    </span>
                    <span className="font-bold text-[11px] text-white leading-tight block my-auto">
                      {state.discardPile[0]?.name || "Card"}
                    </span>
                    <span className="text-[8px] text-casino-gold/80 block mt-1 font-mono">
                      {state.discardPile.length} Discards
                    </span>
                  </div>
                ) : (
                  <>
                    <ArrowUp className="w-6 h-6 text-casino-gold/40 mb-2" />
                    <span className="text-[10px] font-bold text-casino-gold/60 uppercase tracking-widest leading-tight">
                      Action Pile
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full max-w-[200px] glass-panel-light rounded-xl p-3 border border-white/5 relative h-36 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-casino-gold text-[10px] font-bold uppercase tracking-widest border-b border-white/5 pb-1 mb-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Bot Commentary</span>
                </div>
                <div className="flex-1 overflow-y-auto text-xs text-gray-300 italic py-1 leading-relaxed scrollbar-none font-medium">
                  {botCommentary ||
                    ((state.logs || []).length > 0
                      ? state.logs[0]
                      : "Welcome to Deal Deck Clash. Place your bets and roll your cards.")}
                </div>
              </div>
            </div>
          </div>

          {/* PLAYER AREA */}
          <div className="glass-panel rounded-2xl p-4 border border-white/5 relative">
            <h3 className="font-serif font-bold text-white text-sm mb-3 border-b border-white/5 pb-2 flex items-center justify-between">
              <span>Your Boardroom Assets</span>
              <span className="font-mono text-xs text-casino-gold">
                Bank Vault: {humanBankTotal}M Cash
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-casino-gold tracking-widest block mb-2">
                  Liquid Cash Vault
                </span>
                {humanBankCards.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {humanBankCards.map((card) => (
                      <div
                        key={card.id}
                        className="px-3 py-1.5 rounded-lg bg-green-950/40 border border-green-500/30 flex items-center gap-1.5"
                      >
                        <Coins className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-mono font-bold text-white">
                          {card.value || 0}M
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 block italic py-2">
                    No banked money card in vault.
                  </span>
                )}
              </div>

              <div className="p-3 bg-black/25 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-casino-gold tracking-widest block mb-2">
                  Your Property Sets
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {humanSets.map((set) => {
                    if (
                      !set ||
                      !Array.isArray(set.cards) ||
                      set.cards.length === 0
                    )
                      return null;
                    return (
                      <div
                        key={set.color}
                        className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between h-24 relative"
                      >
                        <div
                          className="w-full h-1.5 rounded-full mb-1"
                          style={{ backgroundColor: COLOR_HEX[set.color] }}
                        />
                        <span className="text-[10px] text-white font-mono font-bold block truncate">
                          {set.color}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono block mt-1">
                          {set.cards.length} Cards in play
                        </span>
                        {set.isComplete && (
                          <span className="absolute top-1 right-1 bg-casino-gold text-casino-felt text-[8px] font-bold px-1 rounded">
                            Set
                          </span>
                        )}

                        {set.cards.some((c) => c?.type === "Wildcard") && (
                          <div className="mt-1.5 flex gap-1">
                            {set.cards
                              .filter((c) => c?.type === "Wildcard")
                              .map((card) => {
                                const wild = card as WildcardCard;
                                return (
                                  <button
                                    key={wild.id}
                                    onClick={() => {
                                      const nextCol = (wild.colors || []).find(
                                        (c) => c !== set.color && c !== "Any",
                                      );
                                      if (nextCol) {
                                        toggleWildcardInPlay(wild.id, nextCol);
                                      }
                                    }}
                                    className="text-[8px] uppercase bg-casino-gold/10 hover:bg-casino-gold/30 border border-casino-gold/20 text-casino-gold px-1.5 py-0.5 rounded font-bold"
                                    title="Flip/toggle wildcard color assignment"
                                  >
                                    Flip
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console Event Logs Panel */}
        <div className="w-full lg:w-80 glass-panel rounded-2xl p-4 border border-white/5 flex flex-col justify-between h-[450px] lg:h-auto">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
              <FileText className="text-casino-gold w-4 h-4" />
              <h3 className="font-serif font-bold text-white text-sm uppercase tracking-wider">
                Boardroom Logs
              </h3>
            </div>

            <div className="h-[280px] lg:h-[450px] overflow-y-auto space-y-2.5 pr-1 font-mono text-[11px] leading-relaxed">
              {(state.logs || []).map((log, idx) => {
                let colorClass = "text-gray-300";
                if (log.includes("🏆") || log.includes("WINNER"))
                  colorClass = "text-casino-gold font-bold";
                else if (log.includes("🛡️") || log.includes("counterplayed"))
                  colorClass = "text-blue-400 font-bold";
                else if (log.includes("⏰") || log.includes("expired"))
                  colorClass = "text-yellow-400";
                else if (log.includes("Action Card:"))
                  colorClass = "text-red-400 font-bold";
                return (
                  <div
                    key={idx}
                    className={`p-2 bg-black/20 rounded-lg border border-white/5 ${colorClass}`}
                  >
                    {log}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              onClick={handleEndTurn}
              disabled={!isHumanTurn || state.status !== "PLAYING"}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isHumanTurn && state.status === "PLAYING"
                  ? "bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt shadow-gold-glow hover:scale-[1.02]"
                  : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isHumanTurn ? "animate-spin" : ""}`}
              />
              Complete & End Turn
            </button>
          </div>
        </div>
      </div>

      {/* Fan card fanning tray container bottom */}
      <div className="w-full glass-panel border-t border-casino-gold/10 py-6 px-4 md:px-12 flex flex-col items-center relative z-20">
        <div className="text-center mb-2">
          <span className="text-[10px] uppercase font-bold text-casino-gold tracking-widest">
            Your Private Hand Deck
          </span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 max-w-5xl">
          {humanHand.map((card) => {
            const isSelected = selectedHandCard?.id === card.id;
            return (
              <motion.div
                key={card.id}
                onClick={() => handleHandCardClick(card)}
                whileHover={{ y: -20, scale: 1.05 }}
                className={`w-20 md:w-24 h-32 md:h-36 rounded-xl p-1.5 cursor-pointer relative overflow-hidden transition-all select-none shadow-md ${
                  isSelected
                    ? "ring-4 ring-casino-gold shadow-gold-glow bg-casino-gold/20"
                    : "bg-black/40 border border-white/15 hover:border-casino-gold/60"
                }`}
              >
                <div className="w-full h-full rounded-lg bg-casino-felt border border-white/5 p-1 flex flex-col justify-between relative">
                  {card.type === "Property" && (
                    <div
                      className="w-full h-2 rounded"
                      style={{
                        backgroundColor:
                          COLOR_HEX[(card as PropertyCard).color],
                      }}
                    />
                  )}
                  {card.type === "Wildcard" && (
                    <div className="w-full h-2 rounded bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                  )}
                  {card.type === "Action" && (
                    <div className="w-full h-2 rounded bg-red-600" />
                  )}
                  {card.type === "Money" && (
                    <div className="w-full h-2 rounded bg-green-600" />
                  )}

                  <div className="text-center font-bold text-[10px] md:text-[11px] text-white leading-tight mt-1 truncate">
                    {card.name}
                  </div>

                  <div className="my-auto text-[8px] md:text-[9px] text-gray-400 font-medium text-center line-clamp-3 leading-tight">
                    {card.description ||
                      "Monopoly Deal standard game card asset."}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1 font-mono font-bold text-[9px] text-casino-gold">
                    <span>{card.type}</span>
                    <span>{card.value || 0}M</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* DISCARDING TRASH OVERFLOW BAR */}
      {state.status === "DISCARDING" &&
        state.pendingDiscardPlayerId === human.id && (
          <div className="fixed inset-x-0 bottom-0 bg-red-950/95 backdrop-blur-md border-t border-red-500/30 z-50 py-6 px-4 flex flex-col items-center">
            <div className="text-center mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-400 animate-bounce" />
              <span className="text-sm font-bold text-red-200">
                HAND SIZE EXCEEDED: You have {humanHand.length} cards and must
                select cards to discard down to 7 limit!
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {humanHand.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    playSound("cardSweep");
                    onDispatch({
                      type: "DISCARD_OVERFLOW",
                      payload: { playerId: human.id, cardIds: [card.id] },
                    });
                  }}
                  className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900 border border-red-500/20 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  Discard {card.name}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Dynamic Interaction Modals */}
      <AnimatePresence>
        {actionMenuOpen && selectedHandCard && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-6 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-xl font-serif font-bold text-white text-center mb-2">
                {selectedHandCard.name}
              </h3>
              <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                Choose how you want to deploy this asset onto the boardroom
                arena.
              </p>

              <div className="space-y-3">
                {selectedHandCard.type === "Money" && (
                  <button
                    onClick={handlePlayToBank}
                    className="w-full py-3.5 bg-casino-gold text-casino-felt font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Coins className="w-4 h-4" />
                    Deposit Cash directly into Bank
                  </button>
                )}

                {(selectedHandCard.type === "Property" ||
                  selectedHandCard.type === "Wildcard") && (
                  <button
                    onClick={handlePlayToProperties}
                    className="w-full py-3.5 bg-casino-gold text-casino-felt font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Build Property Zone
                  </button>
                )}

                {selectedHandCard.type === "Action" && (
                  <>
                    <button
                      onClick={handlePlayAction}
                      className="w-full py-3.5 bg-casino-gold text-casino-felt font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Play Action to Field
                    </button>
                    <button
                      onClick={handlePlayToBank}
                      className="w-full py-3.5 border border-casino-gold/30 hover:border-casino-gold text-casino-gold font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-casino-gold/5 transition-all"
                    >
                      <Coins className="w-4 h-4" />
                      Deposit Action Card face-value Cash
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setSelectedHandCard(null);
                    setActionMenuOpen(false);
                  }}
                  className="w-full py-3 border border-white/10 hover:bg-white/5 text-gray-400 font-bold text-xs rounded-xl"
                >
                  Cancel Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {targetSelectOpen && targetOptions && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-6 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-lg font-serif font-bold text-white text-center mb-2">
                TARGET SPECIFIER
              </h3>
              <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                Choose target properties or color sets to execute this attack.
              </p>

              <div className="space-y-2 mb-6">
                {targetOptions.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedTargetOption(opt.value)}
                    className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs transition-all ${
                      selectedTargetOption === opt.value
                        ? "border-casino-gold bg-casino-gold/10 text-white shadow-gold-glow"
                        : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedHandCard(null);
                    setSelectedTargetOption(null);
                    setTargetOptions(null);
                    setTargetSelectOpen(false);
                  }}
                  className="py-3 border border-white/10 hover:bg-white/5 text-gray-400 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTargetConfirm}
                  disabled={!selectedTargetOption}
                  className="py-3 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl disabled:opacity-40"
                >
                  Confirm Target
                </button>
              </div>
            </div>
          </div>
        )}

        {wildcardSelectorOpen && activeWildcard && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-6 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-lg font-serif font-bold text-white text-center mb-2">
                WILDCARD TUNING
              </h3>
              <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                Choose the color set you want to assign this wildcard to.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {(activeWildcard.colors || []).includes("Any")
                  ? [
                      "Brown",
                      "Light Blue",
                      "Pink",
                      "Orange",
                      "Red",
                      "Yellow",
                      "Green",
                      "Dark Blue",
                      "Railroad",
                      "Utility",
                    ].map((col) => (
                      <button
                        key={col}
                        onClick={() =>
                          handleWildcardColorSelect(col as CardColor)
                        }
                        className="py-3 rounded-xl border border-white/10 font-bold text-xs text-white hover:bg-white/5"
                        style={{
                          borderLeft: `4px solid ${COLOR_HEX[col as CardColor]}`,
                        }}
                      >
                        {col}
                      </button>
                    ))
                  : (activeWildcard.colors || []).map((col) => (
                      <button
                        key={col}
                        onClick={() => handleWildcardColorSelect(col)}
                        className="py-3.5 rounded-xl border border-white/10 font-bold text-xs text-white hover:bg-white/5"
                        style={{ borderLeft: `4px solid ${COLOR_HEX[col]}` }}
                      >
                        {col}
                      </button>
                    ))}
              </div>

              <button
                onClick={() => {
                  setActiveWildcard(null);
                  setWildcardSelectorOpen(false);
                }}
                className="w-full py-3 border border-white/10 hover:bg-white/5 text-gray-400 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
