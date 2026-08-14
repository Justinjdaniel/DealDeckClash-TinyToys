import { useState, useCallback, useRef } from "react";
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
      if (stored) {
        const parsed = parseInt(stored, 10);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      }
    }
    return 0;
  });

  const [level, setLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dcc-level");
      if (stored) {
        const parsed = parseInt(stored, 10);
        return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
      }
    }
    return 1;
  });

  const [streak, setStreak] = useState<number>(0); // Combo multiplier
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dcc-achievements");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // Fallback on JSON parse error
        }
      }
    }
    return [];
  });
  const [recentAchievement, setRecentAchievement] =
    useState<Achievement | null>(null);
  const floatIdCounterRef = useRef(0);

  const triggerScreenShake = useCallback((duration = 500) => {
    setScreenShake(true);
    setTimeout(() => {
      setScreenShake(false);
    }, duration);
  }, []);

  const spawnFloatingText = useCallback(
    (text: string, x = window.innerWidth / 2, y = window.innerHeight / 2) => {
      const uniqueId = `float-${Date.now()}-${floatIdCounterRef.current++}`;
      setFloatingPoints((prev) => [...prev, { id: uniqueId, text, x, y }]);
      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((fp) => fp.id !== uniqueId));
      }, 1200);
    },
    [],
  );

  const gainXP = useCallback(
    (amount: number, _reason?: string, x?: number, y?: number) => {
      spawnFloatingText(`+${amount} XP`, x, y);

      const newXpTotal = xp + amount;
      const xpToLevelUp = level * 1000;

      if (newXpTotal >= xpToLevelUp) {
        const remainingXp = newXpTotal - xpToLevelUp;
        const nextLevel = level + 1;

        setXp(remainingXp);
        localStorage.setItem("dcc-xp", remainingXp.toString());

        setLevel(nextLevel);
        localStorage.setItem("dcc-level", nextLevel.toString());

        playSound("levelUp");
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
        triggerScreenShake(800);
        spawnFloatingText(
          `LEVEL UP: ${nextLevel}! 🌟`,
          window.innerWidth / 2,
          window.innerHeight / 3,
        );
      } else {
        setXp(newXpTotal);
        localStorage.setItem("dcc-xp", newXpTotal.toString());
      }
    },
    [xp, level, spawnFloatingText, playSound, triggerScreenShake],
  );

  const unlockAchievement = useCallback(
    (key: MilestoneKey) => {
      const milestone = MILESTONES[key];
      const alreadyUnlocked = achievements.some((a) => a.id === milestone.id);
      if (alreadyUnlocked) return;

      const newAchievement: Achievement = {
        ...milestone,
        unlockedAt: new Date().toLocaleTimeString(),
      };

      const updated = [...achievements, newAchievement];
      setAchievements(updated);
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
    },
    [achievements, gainXP, playSound],
  );

  const incrementStreak = useCallback(() => {
    const nextStreak = streak + 1;
    setStreak(nextStreak);

    if (nextStreak > 1) {
      // Trigger a pitch-shifted combo chime
      playSound("combo", nextStreak);
      spawnFloatingText(`COMBO x${nextStreak}! 🔥`);
      triggerScreenShake(200);
    }
  }, [streak, playSound, spawnFloatingText, triggerScreenShake]);

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
