import React, { useState, useEffect, useRef } from "react";
import {
  GameState,
  Card,
  CardColor,
  WildcardCard,
  ActionCard,
  GameAction,
} from "../../types/game";
import { BotStyle } from "./bot";
import { COLOR_HEX } from "./deck";
import {
  Coins,
  AlertTriangle,
  Sparkles,
  LogOut,
  RefreshCw,
  ArrowUp,
  Play,
  FileText,
  X,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useGamifiedAudio } from "../audio/AudioContext";
import { PlayingCard } from "../cards/PlayingCard";
import { BotSpeechBubble } from "../../components/ui/BotSpeechBubble";
import { useBotController } from "../../hooks/useBotController";

interface BoardProps {
  state: GameState;
  onDispatch: (action: GameAction) => boolean;
  botStyle: BotStyle;
  gainXP: (amount: number, reason: string, x?: number, y?: number) => void;
  unlockAchievement: (
    key: import("../../hooks/useGamification").MilestoneKey,
  ) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  triggerScreenShake: (dur?: number) => void;
}

// Focus management hook for accessible dialogs / modals
function useDialogFocus(isOpen: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (dialogRef.current) {
        dialogRef.current.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  return dialogRef;
}

export const Board: React.FC<BoardProps> = ({
  state,
  onDispatch,
  botStyle,
  gainXP,
  unlockAchievement,
  incrementStreak,
  resetStreak,
  triggerScreenShake,
}) => {
  const { playSound } = useGamifiedAudio();
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);

  const victoryTriggeredRef = useRef(false);

  const [logsOpen, setLogsOpen] = useState(false);

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [targetSelectOpen, setTargetSelectOpen] = useState(false);
  const [targetOptions, setTargetOptions] = useState<{
    type: string;
    options: { label: string; value: string; card?: Card; color?: CardColor }[];
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

  const isDiscarding =
    state.status === "DISCARDING" && state.pendingDiscardPlayerId === human?.id;

  // Dialog focus refs
  const logsDialogRef = useDialogFocus(logsOpen);
  const actionMenuDialogRef = useDialogFocus(actionMenuOpen);
  const targetSelectDialogRef = useDialogFocus(targetSelectOpen);
  const wildcardSelectorDialogRef = useDialogFocus(wildcardSelectorOpen);
  const discardDialogRef = useDialogFocus(isDiscarding);

  // AI bot controller handles bot decision timing, weights, and action dispatch
  const { botCommentary, botWeight, tacticalExplanation } = useBotController({
    state,
    onDispatch,
    botStyle,
    playSound,
  });

  // Auto-end turn transition when 0 action points remain for human player
  useEffect(() => {
    if (
      !human ||
      !isHumanTurn ||
      state.status !== "PLAYING" ||
      state.actionPointsLeft > 0 ||
      state.reactionQueue !== null ||
      actionMenuOpen ||
      targetSelectOpen ||
      wildcardSelectorOpen
    ) {
      return;
    }

    const timer = setTimeout(() => {
      resetStreak();
      onDispatch({
        type: "END_TURN",
        payload: { playerId: human.id },
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    isHumanTurn,
    state.status,
    state.actionPointsLeft,
    state.reactionQueue,
    actionMenuOpen,
    targetSelectOpen,
    wildcardSelectorOpen,
    human?.id,
    onDispatch,
    human,
    resetStreak,
  ]);

  // Trigger win or lose celebration once
  useEffect(() => {
    if (state.status === "WINNER") {
      if (!victoryTriggeredRef.current) {
        victoryTriggeredRef.current = true;
        if (state.winnerId === human?.id) {
          playSound("victoryFanfare");
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          unlockAchievement("VICTORY");
        } else {
          playSound("lossMelody");
        }
      }
    } else {
      victoryTriggeredRef.current = false;
    }
  }, [state.status, state.winnerId, human?.id, unlockAchievement, playSound]);

  // Completed set effect
  const completedSetsCount = human
    ? human.properties.filter((s) => s.isComplete).length
    : 0;
  useEffect(() => {
    if (completedSetsCount > 0) {
      unlockAchievement("SET_COMPLETE");
    }
  }, [completedSetsCount, unlockAchievement]);

  if (!human || !bot) return null;

  const handleHandCardClick = (card: Card) => {
    if (
      !isHumanTurn ||
      state.status !== "PLAYING" ||
      state.actionPointsLeft <= 0
    )
      return;
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
    const accepted = onDispatch(action);
    if (accepted) {
      incrementStreak();
      gainXP(xpGain, xpReason, clientX, clientY);
      triggerScreenShake(150);
    }
  };

  const handlePlayToBank = (e: React.MouseEvent) => {
    if (!selectedHandCard) return;
    playSound("bankCoin");

    const action: GameAction = {
      type: "PLAY_CARD",
      payload: {
        playerId: human.id,
        cardId: selectedHandCard.id,
        targetZone: "bank",
      },
    };
    const accepted = onDispatch(action);
    if (accepted) {
      incrementStreak();
      gainXP(100, "Deposited card to bank", e.clientX, e.clientY);
      triggerScreenShake(150);
      unlockAchievement("FIRST_BANK");
    }

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
            card: c,
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
            card: c,
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
            card: s.cards[0],
            color: s.color,
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
          options: choices.map((c) => {
            const matchingSet = human.properties.find((s) => s.color === c);
            return {
              label: `Rent on ${c}`,
              value: c,
              color: c,
              card: matchingSet?.cards[0],
            };
          }),
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
          card: c,
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

  const topDiscardCard = state.discardPile[0] || null;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative text-left">
      {/* Top HUD Header */}
      <div className="px-3 sm:px-4 py-2 bg-black/50 border-b border-casino-gold/20 flex items-center justify-between relative z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="text-casino-gold w-4 h-4 animate-pulse" />
          <span className="font-serif font-black text-white text-xs sm:text-sm">
            Boardroom
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Collapsible Game Log Drawer Badge Button */}
          <button
            onClick={() => {
              playSound("click");
              setLogsOpen(true);
            }}
            className="px-2.5 py-1 bg-casino-gold/10 hover:bg-casino-gold/20 text-casino-gold border border-casino-gold/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-casino-gold"
            title="View Game Console Logs"
            aria-label="View Game Console Logs"
          >
            <FileText className="w-3 h-3" />
            <span>📜 Logs [{state.logs.length}]</span>
          </button>

          <div className="text-[10px] font-mono font-bold text-gray-300 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
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
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Surrender Match"
            aria-label="Surrender Match"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Game Table Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 relative z-10 scrollbar-none min-h-0">
        {/* BOT AI SECTION */}
        <div className="p-3 bg-black/40 rounded-2xl border border-white/10 relative shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center font-serif text-red-400 text-xs font-bold shadow-inner">
                AI
              </div>
              <div>
                <h4 className="text-xs font-black text-white leading-none flex items-center gap-1.5">
                  Rich Aunt Bot
                  {!isHumanTurn && (
                    <span className="text-[9px] bg-red-500/20 text-red-400 font-mono px-1.5 py-0.5 rounded animate-pulse">
                      PLAYING...
                    </span>
                  )}
                </h4>
                <span className="text-[10px] text-gray-400 font-mono">
                  Vault: {bot.bank.reduce((acc, c) => acc + c.value, 0)}M Cash
                </span>
              </div>
            </div>

            {/* Fanned / Stacked Face-down Bot Hand Cards */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-400 font-mono font-bold mr-1">
                Hand ({bot.hand.length}):
              </span>
              <div className="flex -space-x-3 items-center">
                {bot.hand.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="w-6 h-9 sm:w-7 sm:h-10 rounded overflow-hidden shadow-md border border-casino-gold/30 transform hover:-translate-y-1 transition-transform"
                  >
                    <PlayingCard card={card} isFlipped={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Bot Commentary Popover */}
          <BotSpeechBubble
            commentary={botCommentary}
            weight={botWeight}
            tacticalExplanation={tacticalExplanation}
            botStyle={botStyle}
            botName={bot.name}
          />

          {/* Bot Visual Bank Cards Zone */}
          <div className="mb-3">
            <span className="text-[9px] uppercase font-bold text-casino-gold tracking-widest block mb-1">
              Bot Bank ({bot.bank.length} cards)
            </span>
            {bot.bank.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {bot.bank.map((card) => (
                  <div key={card.id} className="w-12 h-16 flex-shrink-0">
                    <PlayingCard card={card} />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[9px] text-gray-500 italic block">
                Bot bank empty
              </span>
            )}
          </div>

          {/* Bot Visual Property Sets Zone */}
          <div>
            <span className="text-[9px] uppercase font-bold text-casino-gold tracking-widest block mb-1">
              Bot Property Sets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {bot.properties.map((set) => {
                if (set.cards.length === 0) return null;
                return (
                  <div
                    key={set.color}
                    className="p-2 bg-black/40 rounded-xl border border-white/10 flex flex-col justify-between relative shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="h-1.5 rounded-full flex-1 mr-2"
                        style={{ backgroundColor: COLOR_HEX[set.color] }}
                      />
                      {set.isComplete && (
                        <span className="bg-casino-gold text-black text-[7px] font-black px-1 rounded uppercase">
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col -space-y-10 mt-1 pb-2">
                      {set.cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className="w-12 h-18 flex-shrink-0 relative shadow-md"
                          style={{ zIndex: idx }}
                        >
                          <PlayingCard card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER TABLE PLAY ZONE: DECK & DISCARD PILE VISUAL RENDERING */}
        <div className="p-3 bg-black/30 rounded-2xl border border-casino-gold/10 flex items-center justify-around shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Draw Deck ({state.deck.length})
            </span>
            <div className="w-14 h-20 relative">
              {state.deck.length > 0 ? (
                <div className="w-full h-full rounded-xl overflow-hidden shadow-gold-glow border border-casino-gold/40">
                  <PlayingCard card={state.deck[0]} isFlipped={true} />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl border border-dashed border-gray-600 flex items-center justify-center text-[9px] text-gray-500">
                  Empty
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Center Discard Pile ({state.discardPile.length})
            </span>
            <div className="w-14 h-20 relative">
              {topDiscardCard ? (
                <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/20">
                  <PlayingCard card={topDiscardCard} />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl border border-dashed border-gray-600 flex items-center justify-center text-[9px] text-gray-500">
                  <Layers className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HUMAN PLAYER ASSETS */}
        <div className="p-3 bg-black/40 rounded-2xl border border-white/10 relative space-y-3 shadow-lg">
          <h4 className="text-xs font-serif font-bold text-white border-b border-white/10 pb-1.5 flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span>Your Boardroom Assets</span>
              {isHumanTurn && (
                <span className="text-[9px] bg-green-500/20 text-green-400 font-mono px-1.5 py-0.5 rounded font-bold animate-pulse">
                  YOUR TURN
                </span>
              )}
            </span>
            <span className="text-casino-gold font-mono text-xs font-bold">
              Bank: {human.bank.reduce((acc, c) => acc + c.value, 0)}M Cash
            </span>
          </h4>

          {/* Liquid Cash Bank Zone */}
          <div>
            <span className="text-[9px] uppercase font-bold text-casino-gold tracking-widest block mb-1">
              Liquid Bank Cash
            </span>
            {human.bank.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {human.bank.map((card) => (
                  <div key={card.id} className="w-12 h-16 flex-shrink-0">
                    <PlayingCard card={card} />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[9px] text-gray-500 italic block">
                No cash banked. Rent charges will forfeit property cards!
              </span>
            )}
          </div>

          {/* Player Property Sets Zone */}
          <div>
            <span className="text-[9px] uppercase font-bold text-casino-gold tracking-widest block mb-1">
              Your Property Sets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {human.properties.map((set) => {
                if (set.cards.length === 0) return null;
                return (
                  <div
                    key={set.color}
                    className="p-2 bg-black/40 rounded-xl border border-white/10 flex flex-col justify-between relative shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="h-1.5 rounded-full flex-1 mr-2"
                        style={{ backgroundColor: COLOR_HEX[set.color] }}
                      />
                      {set.isComplete && (
                        <span className="bg-casino-gold text-black text-[7px] font-black px-1 rounded uppercase">
                          Complete
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col -space-y-12 mt-1 pb-2">
                      {set.cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className="w-14 h-20 flex-shrink-0 relative group shadow-md"
                          style={{ zIndex: idx }}
                        >
                          <PlayingCard card={card} />
                          {card.type === "Wildcard" && (
                            <button
                              onClick={() => {
                                playSound("click");
                                const wild = card as WildcardCard;
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
                              className="absolute -top-1 -right-1 bg-casino-gold text-black text-[7px] font-black px-1 rounded shadow hover:scale-110 transition-transform z-20 focus:outline-none focus:ring-1 focus:ring-black"
                              title="Flip Wildcard Color"
                              aria-label={`Flip Wildcard ${card.name} color`}
                            >
                              Flip
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DISCARD OVERFLOW MODAL VIEW */}
      {isDiscarding && (
        <div
          ref={discardDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Discard Overflow Modal"
          className="absolute inset-x-0 bottom-0 top-0 bg-black/85 backdrop-blur-md z-40 p-4 flex flex-col items-center justify-center animate-[scaleIn_0.2s_ease-out] focus:outline-none"
        >
          <div className="max-w-md w-full bg-red-950/90 border border-red-500/40 rounded-2xl p-4 shadow-2xl flex flex-col items-center">
            <div className="text-center mb-3 flex items-center gap-1.5">
              <AlertTriangle className="text-red-400 animate-bounce w-5 h-5" />
              <span className="text-xs sm:text-sm font-black text-red-200">
                HAND LIMIT EXCEEDED: Discard down to 7 cards!
              </span>
            </div>
            <p className="text-[10px] text-red-300 text-center mb-3">
              Tap cards below to discard from hand ({human.hand.length}/7):
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-h-[220px] overflow-y-auto p-1">
              {human.hand.map((card) => (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => {
                    playSound("cardSweep");
                    onDispatch({
                      type: "DISCARD_OVERFLOW",
                      payload: { playerId: human.id, cardIds: [card.id] },
                    });
                  }}
                  aria-label={`Discard ${card.name}`}
                  className="w-14 h-20 flex-shrink-0 relative text-left focus:outline-none focus:ring-2 focus:ring-red-400 rounded-2xl"
                >
                  <PlayingCard card={card} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAYER PRIVATE HAND & CONTROLS FOOTER */}
      <div className="px-3 sm:px-4 py-2.5 bg-black/60 border-t border-casino-gold/20 flex flex-col items-center relative z-20 backdrop-blur-md">
        <div className="flex justify-between w-full items-center mb-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-casino-gold flex items-center gap-1">
            Private Hand ({human.hand.length}/7)
          </span>

          {/* Prominent Gamified Manual End Turn Button */}
          <button
            onClick={handleEndTurn}
            disabled={!isHumanTurn || state.status !== "PLAYING"}
            aria-label="End Turn"
            className={`py-1.5 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-serif font-black flex items-center gap-1.5 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-casino-gold ${
              isHumanTurn && state.status === "PLAYING"
                ? "bg-gradient-to-r from-amber-500 via-casino-gold to-yellow-400 text-black shadow-gold-glow hover:scale-105 active:scale-95 animate-pulse"
                : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            End Turn
          </button>
        </div>

        {/* Fanned flex card hand queue */}
        <div className="w-full flex overflow-x-auto gap-2 py-1 scrollbar-none items-center justify-start min-h-[120px] sm:min-h-[140px]">
          {human.hand.map((card) => {
            const isSelected = selectedHandCard?.id === card.id;
            return (
              <button
                type="button"
                key={card.id}
                onClick={() => handleHandCardClick(card)}
                aria-label={`Select hand card ${card.name}`}
                className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 text-left focus:outline-none focus:ring-2 focus:ring-casino-gold rounded-2xl"
              >
                <PlayingCard card={card} isSelected={isSelected} />
              </button>
            );
          })}
        </div>
      </div>

      {/* CONSOLE LOGS DRAWER POPUP */}
      {logsOpen && (
        <div
          ref={logsDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Board Console Logs Dialog"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
        >
          <div className="max-w-md w-full glass-panel rounded-2xl p-4 border border-casino-gold/40 shadow-2xl flex flex-col h-[350px] animate-[scaleIn_0.15s_ease-out]">
            <div className="flex items-center justify-between border-b border-casino-gold/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="text-casino-gold w-4 h-4" />
                <h3 className="text-sm font-serif font-bold text-white">
                  Board Console Logs
                </h3>
              </div>
              <button
                onClick={() => setLogsOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-casino-gold"
                aria-label="Close Logs Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] font-mono text-gray-300 pr-1 leading-relaxed">
              {state.logs.map((log, i) => (
                <div
                  key={i}
                  className="p-1.5 bg-black/40 rounded border border-white/5 text-gray-300"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTION DEPLOYMENT SELECTION MENU */}
      {actionMenuOpen && selectedHandCard && (
        <div
          ref={actionMenuDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Deploy ${selectedHandCard.name}`}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
        >
          <div className="max-w-sm w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out] flex flex-col items-center">
            {/* Visual Preview of selected card */}
            <div className="w-20 h-28 mb-3">
              <PlayingCard card={selectedHandCard} />
            </div>

            <h3 className="text-base font-serif font-black text-white text-center mb-1">
              {selectedHandCard.name}
            </h3>
            <p className="text-[10px] text-gray-300 text-center mb-4 leading-normal">
              Choose how to deploy this card onto the boardroom.
            </p>

            <div className="space-y-2 w-full">
              {selectedHandCard.type === "Money" && (
                <button
                  onClick={(e) => handlePlayToBank(e)}
                  className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-casino-gold"
                >
                  <Coins className="w-4 h-4" />
                  Deposit Cash into Bank
                </button>
              )}

              {(selectedHandCard.type === "Property" ||
                selectedHandCard.type === "Wildcard") && (
                <button
                  onClick={(e) => handlePlayToProperties(e)}
                  className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-casino-gold"
                >
                  <ArrowUp className="w-4 h-4" />
                  Build Property Zone
                </button>
              )}

              {selectedHandCard.type === "Action" && (
                <>
                  <button
                    onClick={handlePlayAction}
                    className="w-full py-2.5 bg-casino-gold text-casino-felt font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-casino-gold"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Action Card Effect
                  </button>
                  <button
                    onClick={(e) => handlePlayToBank(e)}
                    className="w-full py-2.5 border border-casino-gold/40 hover:border-casino-gold text-casino-gold font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-casino-gold/10 transition-all focus:outline-none focus:ring-2 focus:ring-casino-gold"
                  >
                    <Coins className="w-4 h-4" />
                    Deposit Cash face value ({selectedHandCard.value}M)
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setSelectedHandCard(null);
                  setActionMenuOpen(false);
                }}
                className="w-full py-2 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-casino-gold"
              >
                Cancel Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARGET SELECTION MODAL WITH FULL VISUAL CARDS */}
      {targetSelectOpen && targetOptions && (
        <div
          ref={targetSelectDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Specify Target Card Dialog"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
        >
          <div className="max-w-md w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
            <h3 className="text-sm font-serif font-black text-white text-center mb-1">
              SPECIFY TARGET CARD
            </h3>
            <p className="text-[10px] text-gray-300 text-center mb-4 leading-normal">
              Select target property card or set to execute play.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-4 max-h-[220px] overflow-y-auto p-1">
              {targetOptions.options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    playSound("click");
                    setSelectedTargetOption(opt.value);
                  }}
                  aria-label={opt.label}
                  className={`w-16 h-24 flex-shrink-0 cursor-pointer rounded-2xl transition-all transform hover:scale-105 relative text-left focus:outline-none focus:ring-2 focus:ring-casino-gold ${
                    selectedTargetOption === opt.value
                      ? "ring-4 ring-casino-gold shadow-gold-glow scale-105"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {opt.card ? (
                    <PlayingCard card={opt.card} />
                  ) : (
                    <div
                      className="w-full h-full rounded-xl border border-casino-gold/40 flex flex-col items-center justify-between p-1.5 text-center bg-black/60"
                      style={{
                        borderTop: opt.color
                          ? `4px solid ${COLOR_HEX[opt.color]}`
                          : undefined,
                      }}
                    >
                      <span className="text-[8px] font-mono font-bold text-white leading-tight">
                        {opt.label}
                      </span>
                    </div>
                  )}
                  {selectedTargetOption === opt.value && (
                    <div className="absolute -top-1 -right-1 bg-casino-gold text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black z-20">
                      ✓
                    </div>
                  )}
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
                className="py-2.5 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-casino-gold"
              >
                Cancel
              </button>
              <button
                onClick={(e) => handleTargetConfirm(e)}
                disabled={!selectedTargetOption}
                className="py-2.5 bg-casino-gold text-casino-felt font-bold text-[10px] rounded-xl disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-casino-gold"
              >
                Confirm Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WILDCARD COLOR SELECTION MODAL */}
      {wildcardSelectorOpen && activeWildcard && (
        <div
          ref={wildcardSelectorDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Wildcard Color Tuning Dialog"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 focus:outline-none"
        >
          <div className="max-w-sm w-full glass-panel rounded-2xl p-5 border border-casino-gold/40 shadow-gold-glow animate-[scaleIn_0.15s_ease-out]">
            <h3 className="text-sm font-serif font-black text-white text-center mb-1">
              WILDCARD COLOR TUNING
            </h3>
            <p className="text-[10px] text-gray-300 text-center mb-4 leading-normal">
              Select property color set to assign this wildcard to.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto pr-1">
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
                      className="py-2.5 px-3 rounded-xl border border-white/10 font-bold text-[10px] text-white hover:bg-white/10 transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-casino-gold"
                      style={{
                        borderLeft: `5px solid ${COLOR_HEX[col as CardColor]}`,
                      }}
                    >
                      <span>{col}</span>
                      <span className="text-[8px] font-mono text-casino-gold">
                        Assign
                      </span>
                    </button>
                  ))
                : activeWildcard.colors.map((col) => (
                    <button
                      key={col}
                      onClick={(e) => handleWildcardColorSelect(col, e)}
                      className="py-2.5 px-3 rounded-xl border border-white/10 font-bold text-[10px] text-white hover:bg-white/10 transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-casino-gold"
                      style={{ borderLeft: `5px solid ${COLOR_HEX[col]}` }}
                    >
                      <span>{col}</span>
                      <span className="text-[8px] font-mono text-casino-gold">
                        Assign
                      </span>
                    </button>
                  ))}
            </div>

            <button
              onClick={() => {
                setActiveWildcard(null);
                setWildcardSelectorOpen(false);
              }}
              className="w-full py-2 border border-white/10 text-gray-400 font-bold text-[10px] rounded-xl hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-casino-gold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
