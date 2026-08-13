import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { SoundEffectType } from "../features/audio/AudioContext";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlockedAt: string;
}

export interface FloatingPoint {
  id: string;
  text: string;
  x: number;
  y: number;
}

export const MILESTONES = {
  FIRST_BANK: {
    id: "first_bank",
    title: "🏦 Liquid Cash Flow",
    description: "Deposited your first cash card to the bank vault!",
    xpReward: 100,
  },
  SET_COMPLETE: {
    id: "set_complete",
    title: "🏘️ Property Tycoon",
    description: "Completed a full set of property cards!",
    xpReward: 250,
  },
  SHIELD_MASTER: {
    id: "shield_master",
    title: "🛡️ Just Say No!",
    description: "Blocked a hostile boardroom attack with JSN!",
    xpReward: 200,
  },
  RENT_COLLECTOR: {
    id: "rent_collector",
    title: "💰 Rent Kingpin",
    description: "Collected rent cash from an opponent player!",
    xpReward: 150,
  },
  DEAL_BREAKER: {
    id: "deal_breaker",
    title: "💥 Hostile Takeover",
    description: "Stole an entire complete property set with Deal Breaker!",
    xpReward: 300,
  },
  VICTORY: {
    id: "victory",
    title: "🏆 Executive Dominance",
    description: "Won a boardroom match vs Smart AI bot!",
    xpReward: 500,
  },
};

export type MilestoneKey = keyof typeof MILESTONES;

export const useGamification = (
  playSound: (type: SoundEffectType, streakCount?: number) => void,
) => {
  const [xp, setXp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dcc-xp");
      return stored ? parseInt(stored) : 0;
    }
    return 0;
  });

  const [level, setLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dcc-level");
      return stored ? parseInt(stored) : 1;
    }
    return 1;
  });

  const [streak, setStreak] = useState<number>(0); // Combo multiplier
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dcc-achievements");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [recentAchievement, setRecentAchievement] =
    useState<Achievement | null>(null);

  const triggerScreenShake = useCallback((duration = 500) => {
    setScreenShake(true);
    setTimeout(() => {
      setScreenShake(false);
    }, duration);
  }, []);

  const spawnFloatingText = useCallback(
    (text: string, x = window.innerWidth / 2, y = window.innerHeight / 2) => {
      const id = Math.random().toString(36).substr(2, 9);
      setFloatingPoints((prev) => [...prev, { id, text, x, y }]);
      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((fp) => fp.id !== id));
      }, 1200);
    },
    [],
  );

  const gainXP = useCallback(
    (amount: number, _reason?: string, x?: number, y?: number) => {
      setXp((prevXp) => {
        let newXp = prevXp + amount;
        const xpToLevelUp = level * 1000;

        spawnFloatingText(`+${amount} XP`, x, y);

        if (newXp >= xpToLevelUp) {
          newXp = newXp - xpToLevelUp;
          setLevel((prevLevel) => {
            const nextLvl = prevLevel + 1;
            localStorage.setItem("dcc-level", nextLvl.toString());
            setTimeout(() => {
              playSound("levelUp");
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
              triggerScreenShake(800);
              spawnFloatingText(
                `LEVEL UP: ${nextLvl}! 🌟`,
                window.innerWidth / 2,
                window.innerHeight / 3,
              );
            }, 100);
            return nextLvl;
          });
        }

        localStorage.setItem("dcc-xp", newXp.toString());
        return newXp;
      });
    },
    [level, spawnFloatingText, playSound, triggerScreenShake],
  );

  const unlockAchievement = useCallback(
    (key: MilestoneKey) => {
      const milestone = MILESTONES[key];
      setAchievements((prev) => {
        if (prev.some((a) => a.id === milestone.id)) return prev; // Already unlocked

        const newAchievement: Achievement = {
          ...milestone,
          unlockedAt: new Date().toLocaleTimeString(),
        };

        const updated = [...prev, newAchievement];
        localStorage.setItem("dcc-achievements", JSON.stringify(updated));

        // Display achievement announcement popup
        setRecentAchievement(newAchievement);
        setTimeout(() => {
          setRecentAchievement(null);
        }, 5000);

        // Award XP
        setTimeout(() => {
          gainXP(milestone.xpReward, `Unlocked milestone: ${milestone.title}`);
          playSound("victoryFanfare");
        }, 200);

        return updated;
      });
    },
    [gainXP, playSound],
  );

  const incrementStreak = useCallback(() => {
    setStreak((prev) => {
      const next = prev + 1;
      if (next > 1) {
        // Trigger a pitch-shifted combo chime
        playSound("combo", next);
        spawnFloatingText(`COMBO x${next}! 🔥`);
        triggerScreenShake(200);
      }
      return next;
    });
  }, [playSound, spawnFloatingText, triggerScreenShake]);

  const resetStreak = useCallback(() => {
    setStreak(0);
  }, []);

  return {
    xp,
    level,
    streak,
    screenShake,
    floatingPoints,
    achievements,
    recentAchievement,
    gainXP,
    unlockAchievement,
    incrementStreak,
    resetStreak,
    triggerScreenShake,
    spawnFloatingText,
  };
};
