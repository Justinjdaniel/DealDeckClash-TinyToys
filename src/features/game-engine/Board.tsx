import React, { useState, useEffect, useRef } from "react";
import {
  GameState,
  Card,
  CardColor,
  WildcardCard,
  ActionCard,
  GameAction,
} from "../../types/game";
import { BotStyle, evaluateBotTurn } from "./bot";
import { COLOR_HEX } from "./deck";
import { findJSNInHand } from "./rules";
import {
  Coins,
  AlertTriangle,
  Sparkles,
  LogOut,
  RefreshCw,
  ArrowUp,
  Play,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGamifiedAudio } from "../audio/AudioContext";
import { PlayingCard } from "../cards/PlayingCard";
import { XPBar } from "../../components/ui/XPBar";

interface BoardProps {
  state: GameState;
  onDispatch: (action: GameAction) => void;
  botStyle: BotStyle;
  xp: number;
  level: number;
  streak: number;
  gainXP: (amount: number, reason: string, x?: number, y?: number) => void;
  unlockAchievement: (
    key: import("../../hooks/useGamification").MilestoneKey,
  ) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  triggerScreenShake: (dur?: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  onDispatch,
  botStyle,
  xp,
  level,
  streak,
  gainXP,
  unlockAchievement,
  incrementStreak,
  resetStreak,
  triggerScreenShake,
}) => {
  const { playSound } = useGamifiedAudio();
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

  const bot = state.players.find((p) => p.isBot);
  const human = state.players.find((p) => !p.isBot);
  const isHumanTurn = state.players[state.currentPlayerIndex].id === human?.id;

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.logs]);

  // Trigger win or lose celebration once
  useEffect(() => {
    if (state.status === "WINNER") {
      if (!victoryTriggeredRef.current) {
        victoryTriggeredRef.current = true;
        if (state.winnerId === human?.id) {
          playSoundRef.current("victoryFanfare");
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          unlockAchievement("VICTORY");
        } else {
          playSoundRef.current("lossMelody");
        }
      }
    } else {
      victoryTriggeredRef.current = false;
    }
  }, [state.status, state.winnerId, human?.id, unlockAchievement]);

  // AI bot play logic loop
  const isBotActive = !isHumanTurn && bot;
  const botTurnKey = isBotActive
    ? `${state.status}-${state.currentPlayerIndex}-${state.actionPointsLeft}-${state.reactionQueue ? "rx" : "norx"}-${state.players[state.currentPlayerIndex].hand.length}`
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

  // AI bot reaction resolution
  useEffect(() => {
    const rx = state.reactionQueue;
    if (!rx || rx.targetPlayerId !== bot?.id) return;

    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      const jsn = findJSNInHand(bot);
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

  const handleHandCardClick = (card: Card) => {
    if (!isHumanTurn || state.status !== "PLAYING") return;
    playSound("click");
    setSelectedHandCard(card);
    setActionMenuOpen(true);
  };

  const executePlayDispatch = (
    action: GameAction,
    xpGain: number,
    xpReason: string,
    clientX?: number,
    clientY?: number,
  ) => {
    onDispatch(action);
    incrementStreak();
    gainXP(xpGain, xpReason, clientX, clientY);
    triggerScreenShake(150);
  };

  const handlePlayToBank = (e: React.MouseEvent) => {
    if (!selectedHandCard) return;
    playSound("bankCoin");

    executePlayDispatch(
      {
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "bank",
        },
      },
      100,
      "Deposited card to bank",
      e.clientX,
      e.clientY,
    );

    unlockAchievement("FIRST_BANK");

    setSelectedHandCard(null);
    setActionMenuOpen(false);
  };

  const handlePlayToProperties = (e: React.MouseEvent) => {
    if (!selectedHandCard) return;

    if (selectedHandCard.type === "Property") {
      playSound("cardPlay");
      executePlayDispatch(
        {
          type: "PLAY_CARD",
          payload: {
            playerId: human.id,
            cardId: selectedHandCard.id,
            targetZone: "properties",
          },
        },
        150,
        "Built property",
        e.clientX,
        e.clientY,
      );

      // Check if any set is complete after play
      setTimeout(() => {
        const hasComplete = latestStateRef.current.players
          .find((p) => p.id === human.id)
          ?.properties.some((s) => s.isComplete);
        if (hasComplete) {
          unlockAchievement("SET_COMPLETE");
        }
      }, 300);

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

    // Sly Deal targeting
    if (actionCard.actionType === "Sly Deal") {
      const targetProps = bot.properties
        .filter((s) => !s.isComplete && s.cards.length > 0)
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

    // Forced Deal targeting
    if (actionCard.actionType === "Forced Deal") {
      const botProps = bot.properties
        .filter((s) => !s.isComplete && s.cards.length > 0)
        .flatMap((s) => s.cards);
      const myProps = human.properties
        .filter((s) => !s.isComplete && s.cards.length > 0)
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

    // Deal Breaker targeting
    if (actionCard.actionType === "Deal Breaker") {
      const completeSets = bot.properties.filter((s) => s.isComplete);
      if (completeSets.length > 0) {
        setTargetOptions({
          type: "DEAL_BREAKER_TARGET",
          options: completeSets.map((s) => ({
            label: `Steal completed ${s.color} set`,
            value: s.color,
          })),
        });
        setTargetSelectOpen(true);
        setActionMenuOpen(false);
        return;
      }
    }

    // Rent targeting
    if (
      (actionCard.actionType === "Rent" ||
        actionCard.actionType === "Multi-Rent") &&
      actionCard.rentColors
    ) {
      const playerColors = human.properties
        .filter((s) => s.cards.length > 0)
        .map((s) => s.color);
      const choices =
        actionCard.actionType === "Multi-Rent"
          ? playerColors
          : actionCard.rentColors.filter((c) => playerColors.includes(c));

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

    // Normal non-targeted action
    playSound("cardPlay");
    executePlayDispatch(
      {
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: selectedHandCard.id,
          targetZone: "center",
        },
      },
      200,
      `Played action: ${actionCard.name}`,
    );

    setSelectedHandCard(null);
    setActionMenuOpen(false);
  };

  const handleTargetConfirm = (e: React.MouseEvent) => {
    if (!selectedHandCard || !selectedTargetOption || !targetOptions) return;

    if (targetOptions.type === "RENT_COLOR") {
      playSound("cardPlay");
      executePlayDispatch(
        {
          type: "PLAY_CARD",
          payload: {
            playerId: human.id,
            cardId: selectedHandCard.id,
            targetZone: "center",
            options: { color: selectedTargetOption as CardColor },
          },
        },
        150,
        "Charged Rent",
        e.clientX,
        e.clientY,
      );
      unlockAchievement("RENT_COLLECTOR");
    } else if (targetOptions.type === "SLY_DEAL_TARGET") {
      playSound("cardPlay");
      executePlayDispatch(
        {
          type: "PLAY_CARD",
          payload: {
            playerId: human.id,
            cardId: selectedHandCard.id,
            targetZone: "center",
            options: { targetCardId: selectedTargetOption },
          },
        },
        200,
        "Stealing card",
        e.clientX,
        e.clientY,
      );
    } else if (targetOptions.type === "FORCED_DEAL_STEP_1") {
      const myProps = human.properties
        .filter((s) => !s.isComplete && s.cards.length > 0)
        .flatMap((s) => s.cards);
      setTargetOptions({
        type: "FORCED_DEAL_STEP_2",
        options: myProps.map((c) => ({
          label: `Swap with ${c.name}`,
          value: c.id,
        })),
        extra: { opponentCardId: selectedTargetOption },
      });
      setSelectedTargetOption(null);
      return;
    } else if (targetOptions.type === "FORCED_DEAL_STEP_2") {
      playSound("cardPlay");
      executePlayDispatch(
        {
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
        },
        200,
        "Swapped properties",
        e.clientX,
        e.clientY,
      );
    } else if (targetOptions.type === "DEAL_BREAKER_TARGET") {
      playSound("cardPlay");
      executePlayDispatch(
        {
          type: "PLAY_CARD",
          payload: {
            playerId: human.id,
            cardId: selectedHandCard.id,
            targetZone: "center",
            options: { targetColor: selectedTargetOption as CardColor },
          },
        },
        300,
        "Stealing completed set",
        e.clientX,
        e.clientY,
      );
      unlockAchievement("DEAL_BREAKER");
    }

    setSelectedHandCard(null);
    setSelectedTargetOption(null);
    setTargetOptions(null);
    setTargetSelectOpen(false);
  };

  const handleWildcardColorSelect = (color: CardColor, e: React.MouseEvent) => {
    if (!activeWildcard) return;
    playSound("cardPlay");
    executePlayDispatch(
      {
        type: "PLAY_CARD",
        payload: {
          playerId: human.id,
          cardId: activeWildcard.id,
          targetZone: "properties",
          options: { color },
        },
      },
      150,
      `Wildcard set to ${color}`,
      e.clientX,
      e.clientY,
    );
    setActiveWildcard(null);
    setWildcardSelectorOpen(false);
  };

  const handleEndTurn = () => {
    if (!isHumanTurn || state.status !== "PLAYING") return;
    playSound("click");
    resetStreak();
    onDispatch({
      type: "END_TURN",
      payload: { playerId: human.id },
    });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative text-left">
      {/* Dynamic HUD header */}
      <div className="px-4 py-2 bg-black/40 border-b border-casino-gold/15 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-casino-gold w-4 h-4 animate-pulse" />
          <span className="font-serif font-black text-white text-sm">
            Boardroom
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono font-bold text-gray-300">
            ACTIONS:{" "}
            <span
              className={`text-xs font-black ${state.actionPointsLeft > 0 ? "text-green-400" : "text-red-400"}`}
            >
              {state.actionPointsLeft}/3
            </span>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onDispatch({ type: "RESET_GAME" });
            }}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg hover:scale-105 active:scale-95 transition-transform"
            title="Surrender Match"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded XP Progression Bar */}
      <div className="px-4 py-2 relative z-20 bg-slate-900/40 border-b border-casino-gold/5 flex justify-center">
        <XPBar xp={xp} level={level} streak={streak} />
      </div>

      {/* Main Board scrolling grid view */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-1 relative z-10 scrollbar-none">
        {/* BOT AI SECTION */}
        <div className="p-3 bg-black/35 rounded-xl border border-white/5 relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center font-serif text-red-400 text-xs font-bold">
                AI
              </div>
              <div>
                <h4 className="text-xs font-black text-white leading-none">
                  Rich Aunt Bot
                </h4>
                <span className="text-[9px] text-gray-400 font-mono">
                  Vault: {bot.bank.reduce((acc, c) => acc + c.value, 0)}M
                </span>
              </div>
            </div>

            <span className="text-[9px] bg-red-500/15 text-red-400 font-mono font-bold px-2 py-0.5 rounded-full">
              {bot.hand.length} Hand Cards
            </span>
          </div>

          {/* AI Property Sets */}
          <div className="grid grid-cols-2 gap-2">
            {bot.properties.map((set) => {
              if (set.cards.length === 0) return null;
              return (
                <div
                  key={set.color}
                  className="p-2 bg-black/25 rounded-lg border border-white/5 flex flex-col justify-between h-20 relative"
                >
                  <div
                    className="w-full h-1 rounded"
                    style={{ backgroundColor: COLOR_HEX[set.color] }}
                  />
                  <span className="text-[9px] text-white font-bold font-mono truncate">
                    {set.color} Set
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold">
                    {set.cards.length} Cards
                  </span>
                  {set.isComplete && (
                    <span className="absolute top-1 right-1 bg-casino-gold text-casino-felt text-[7px] font-black px-1 rounded uppercase">
                      Complete
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DECISION / LOGS SECTION */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* Bot commentary bubbles */}
          <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-between h-28">
            <span className="text-[8px] text-casino-gold font-bold uppercase tracking-wider block border-b border-white/5 pb-1">
              AI commentary
            </span>
            <p className="text-[10px] text-gray-300 italic leading-snug my-auto line-clamp-3">
              {botCommentary ||
                "Welcome to Deal Deck Clash. Place your bets and roll your cards."}
            </p>
          </div>

          {/* Console Action Log */}
          <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-between h-28">
            <span className="text-[8px] text-casino-gold font-bold uppercase tracking-wider block border-b border-white/5 pb-1">
              Board logs
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 mt-1 text-[8px] font-mono text-gray-400 leading-tight">
              {state.logs.slice(0, 5).map((log, i) => (
                <div
                  key={i}
                  className="truncate border-b border-white/5 pb-0.5 last:border-none"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HUMAN PLAYERS ASSETS */}
        <div className="p-3 bg-black/35 rounded-xl border border-white/5 relative space-y-3">
          <h4 className="text-xs font-serif font-bold text-white border-b border-white/5 pb-1 flex justify-between">
            <span>Your Boardroom Assets</span>
            <span className="text-casino-gold font-mono">
              Bank: {human.bank.reduce((acc, c) => acc + c.value, 0)}M Cash
            </span>
          </h4>

          {/* Cash Vault */}
          <div className="p-2 bg-black/25 rounded-lg border border-white/5">
            <span className="text-[8px] uppercase font-bold text-casino-gold tracking-widest block mb-1">
              Liquid Bank Cash
            </span>
            {human.bank.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {human.bank.map((card) => (
                  <div
                    key={card.id}
                    className="px-2 py-1 bg-green-950/40 border border-green-500/20 rounded-md text-[9px] font-mono text-white flex items-center gap-1"
                  >
                    <Coins className="w-3 h-3 text-green-400" />
                    <span>{card.value}M</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[9px] text-gray-500 italic block">
                No cash banked. Complete rent triggers will auto-liquidate
                properties!
              </span>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-1.5">
            <span className="text-[8px] uppercase font-bold text-casino-gold tracking-widest block">
              Your Property Sets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {human.properties.map((set) => {
                if (set.cards.length === 0) return null;
                return (
                  <div
                    key={set.color}
                    className="p-2 bg-black/25 rounded-lg border border-white/5 flex flex-col justify-between h-20 relative"
                  >
                    <div
                      className="w-full h-1 rounded"
                      style={{ backgroundColor: COLOR_HEX[set.color] }}
                    />
                    <span className="text-[9px] text-white font-bold font-mono truncate">
                      {set.color} Set
                    </span>
                    <span className="text-[8px] text-gray-400 font-bold">
                      {set.cards.length} Cards in play
                    </span>
                    {set.isComplete && (
                      <span className="absolute top-1 right-1 bg-casino-gold text-casino-felt text-[7px] font-black px-1 rounded uppercase">
                        Complete
                      </span>
                    )}

                    {/* Interactive Wildcards */}
                    {set.cards.some((c) => c.type === "Wildcard") && (
                      <div className="mt-1 flex gap-1">
                        {set.cards
                          .filter((c) => c.type === "Wildcard")
                          .map((card) => {
                            const wild = card as WildcardCard;
                            return (
                              <button
                                key={wild.id}
                                onClick={() => {
                                  playSound("click");
                                  const nextCol = wild.colors.find(
                                    (c) => c !== set.color && c !== "Any",
                                  );
                                  if (nextCol) {
                                    onDispatch({
                                      type: "TOGGLE_WILDCARD_COLOR",
                                      payload: {
                                        playerId: human.id,
                                        cardId: wild.id,
                                        color: nextCol,
                                      },
                                    });
                                  }
                                }}
                                className="text-[7px] uppercase bg-casino-gold/10 hover:bg-casino-gold/30 border border-casino-gold/20 text-casino-gold px-1 rounded font-bold"
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

      {/* PLAYER HAND DISCARD OVERLAY */}
      {state.status === "DISCARDING" &&
        state.pendingDiscardPlayerId === human.id && (
          <div className="absolute inset-x-0 bottom-0 bg-red-950/95 backdrop-blur-md border-t border-red-500/30 z-40 py-4 px-3 flex flex-col items-center">
            <div className="text-center mb-2 flex items-center gap-1">
              <AlertTriangle className="text-red-400 animate-bounce w-4 h-4" />
              <span className="text-[11px] font-bold text-red-200">
                DISCARD EXCEEDED: Discard hand down to 7 cards!
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {human.hand.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    playSound("cardSweep");
                    onDispatch({
                      type: "DISCARD_OVERFLOW",
                      payload: { playerId: human.id, cardIds: [card.id] },
                    });
                  }}
                  className="px-2.5 py-1 bg-red-900/40 hover:bg-red-900 border border-red-500/20 rounded-lg text-[10px] font-bold text-white transition-all"
                >
                  Discard {card.name}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* PLAYER PORTABLE PRIVATE HAND DRAWER TRAY */}
      <div className="px-4 py-3 bg-black/40 border-t border-casino-gold/15 flex flex-col items-center relative z-20">
        <div className="flex justify-between w-full items-center mb-2">
          <span className="text-[8px] font-bold uppercase tracking-widest text-casino-gold">
            Private Hand Deck ({human.hand.length}/7)
          </span>
          <button
            onClick={handleEndTurn}
            disabled={!isHumanTurn || state.status !== "PLAYING"}
            className={`py-1.5 px-3 rounded-lg text-[9px] font-bold font-mono flex items-center gap-1 transition-all ${
              isHumanTurn && state.status === "PLAYING"
                ? "bg-gradient-to-r from-casino-goldDark to-casino-gold text-casino-felt shadow-gold-glow hover:scale-[1.02]"
                : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            End Turn
          </button>
        </div>

        {/* Fanned flex card queue row */}
        <div className="w-full flex overflow-x-auto gap-2 py-1 scrollbar-none items-center justify-start min-h-[140px]">
          {human.hand.map((card) => {
            const isSelected = selectedHandCard?.id === card.id;
            return (
              <div key={card.id} className="w-20 h-28 flex-shrink-0">
                <PlayingCard
                  card={card}
                  isSelected={isSelected}
                  onClick={() => handleHandCardClick(card)}
                  className="w-full h-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Action Menus & selectors */}
      <AnimatePresence>
        {actionMenuOpen && selectedHandCard && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-base font-serif font-black text-white text-center mb-1">
                {selectedHandCard.name}
              </h3>
              <p className="text-[10px] text-gray-400 text-center mb-4 leading-normal">
                Deploy this asset onto the boardroom field.
              </p>

              <div className="space-y-2">
                {selectedHandCard.type === "Money" && (
                  <button
                    onClick={(e) => handlePlayToBank(e)}
                    className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:scale-[1.02] transition-all"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Deposit Cash into Bank
                  </button>
                )}

                {(selectedHandCard.type === "Property" ||
                  selectedHandCard.type === "Wildcard") && (
                  <button
                    onClick={(e) => handlePlayToProperties(e)}
                    className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:scale-[1.02] transition-all"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    Build Property Zone
                  </button>
                )}

                {selectedHandCard.type === "Action" && (
                  <>
                    <button
                      onClick={handlePlayAction}
                      className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:scale-[1.02] transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Action Card
                    </button>
                    <button
                      onClick={(e) => handlePlayToBank(e)}
                      className="w-full py-2.5 border border-casino-gold/30 hover:border-casino-gold text-casino-gold font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-casino-gold/5 transition-all"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Deposit Cash face value
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setSelectedHandCard(null);
                    setActionMenuOpen(false);
                  }}
                  className="w-full py-2 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl"
                >
                  Cancel Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Target modal */}
        {targetSelectOpen && targetOptions && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-sm font-serif font-black text-white text-center mb-1">
                SPECIFY TARGET
              </h3>
              <p className="text-[9px] text-gray-400 text-center mb-4 leading-normal">
                Choose opponent cards or sets to execute this attack.
              </p>

              <div className="space-y-1.5 mb-4 max-h-[160px] overflow-y-auto">
                {targetOptions.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      playSound("click");
                      setSelectedTargetOption(opt.value);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-between ${
                      selectedTargetOption === opt.value
                        ? "border-casino-gold bg-casino-gold/15 text-white shadow-gold-glow"
                        : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedTargetOption === opt.value && <span>✓</span>}
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
                  className="py-2.5 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => handleTargetConfirm(e)}
                  disabled={!selectedTargetOption}
                  className="py-2.5 bg-casino-gold text-casino-felt font-bold text-[10px] rounded-xl disabled:opacity-40"
                >
                  Confirm Target
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wildcard custom color assignment */}
        {wildcardSelectorOpen && activeWildcard && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
              <h3 className="text-sm font-serif font-black text-white text-center mb-1">
                WILDCARD TUNING
              </h3>
              <p className="text-[9px] text-gray-400 text-center mb-4 leading-normal">
                Choose the property color set to assign this wildcard to.
              </p>

              <div className="grid grid-cols-2 gap-1.5 mb-4 max-h-[180px] overflow-y-auto pr-1">
                {activeWildcard.colors.includes("Any")
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
                        onClick={(e) =>
                          handleWildcardColorSelect(col as CardColor, e)
                        }
                        className="py-2 rounded-xl border border-white/10 font-bold text-[10px] text-white hover:bg-white/5 text-left pl-3"
                        style={{
                          borderLeft: `4px solid ${COLOR_HEX[col as CardColor]}`,
                        }}
                      >
                        {col}
                      </button>
                    ))
                  : activeWildcard.colors.map((col) => (
                      <button
                        key={col}
                        onClick={(e) => handleWildcardColorSelect(col, e)}
                        className="py-2.5 rounded-xl border border-white/10 font-bold text-[10px] text-white hover:bg-white/5 text-left pl-3"
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
                className="w-full py-2 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl"
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
