import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { triggerHaptic } from "./HapticManager";

export type SoundEffectType =
  | "cardSweep" // Card deal/draw / slide sweep
  | "cardPlay" // Card play to center / snap drop
  | "bankCoin" // Money banked / Rent collected / Coin chime
  | "alertBuzz" // Incorrect play or reaction popup
  | "victoryFanfare" // Win fanfare
  | "lossMelody" // Lose sound
  | "timerTick" // Countdown tick
  | "jsnPlay" // Just Say No shield sound
  | "combo" // Consecutive Match / Combo Streak chimes
  | "levelUp" // Synthesizer level up fanfares
  | "click"; // Tactile low-freq mechanical button clicks

interface AudioContextProps {
  volume: number; // 0 to 1
  muted: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  playSound: (type: SoundEffectType, streakCount?: number) => void;
}

const AudioContextState = createContext<AudioContextProps | undefined>(
  undefined,
);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("dcc-volume");
      if (v) {
        const parsed = parseFloat(v);
        if (Number.isFinite(parsed)) {
          return Math.max(0, Math.min(1, parsed));
        }
      }
    }
    return 0.6;
  });

  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const m = localStorage.getItem("dcc-muted");
      return m === "true";
    }
    return false;
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const setVolume = useCallback((v: number) => {
    const parsed = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.6;
    setVolumeState(parsed);
    localStorage.setItem("dcc-volume", parsed.toString());
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    localStorage.setItem("dcc-muted", m.toString());
  }, []);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch((err) => {
        console.warn("AudioContext resume failed:", err);
      });
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        audioCtxRef.current = null;
        if (ctx.state !== "closed") {
          ctx.close().catch((err) => {
            console.warn("Error closing AudioContext:", err);
          });
        }
      }
    };
  }, []);

  const playSound = useCallback(
    (type: SoundEffectType, streakCount = 0) => {
      const sanitizedVolume = Number.isFinite(volume)
        ? Math.max(0, Math.min(1, volume))
        : 0.6;
      if (muted || sanitizedVolume <= 0) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(sanitizedVolume, now);
      masterGain.connect(ctx.destination);

      const getPitchVariation = () => 1 + (Math.random() * 0.1 - 0.05);
      let duration = 0.5;

      try {
        switch (type) {
          case "click": {
            duration = 0.1;
            triggerHaptic("tap");
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(120, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.06);
            break;
          }

          case "cardSweep": {
            duration = 0.2;
            triggerHaptic("tap");
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const rate = getPitchVariation();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(150 * rate, now);
            osc.frequency.exponentialRampToValueAtTime(600 * rate, now + 0.15);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.16);
            break;
          }

          case "cardPlay": {
            duration = 0.15;
            triggerHaptic("tap");
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const rate = getPitchVariation();

            osc.type = "sine";
            osc.frequency.setValueAtTime(400 * rate, now);
            osc.frequency.exponentialRampToValueAtTime(80 * rate, now + 0.1);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.11);
            break;
          }

          case "bankCoin": {
            duration = 0.4;
            triggerHaptic("success");
            const playCoinTone = (timeOffset: number, pitch: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = "sine";
              osc.frequency.setValueAtTime(pitch, now + timeOffset);

              gain.gain.setValueAtTime(0.1, now + timeOffset);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + timeOffset + 0.2,
              );

              osc.connect(gain);
              gain.connect(masterGain);

              osc.start(now + timeOffset);
              osc.stop(now + timeOffset + 0.22);
            };

            playCoinTone(0, 987.77); // B5
            playCoinTone(0.08, 1318.51); // E6
            break;
          }

          case "jsnPlay": {
            duration = 0.4;
            triggerHaptic("success");
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            const filter = ctx.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.setValueAtTime(400, now);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.35);
            break;
          }

          case "alertBuzz": {
            duration = 0.3;
            triggerHaptic("error");
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = "sawtooth";
            osc2.type = "sawtooth";

            osc1.frequency.setValueAtTime(120, now);
            osc2.frequency.setValueAtTime(124, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(masterGain);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.23);
            osc2.stop(now + 0.23);
            break;
          }

          case "timerTick": {
            duration = 0.1;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1600, now);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.04);
            break;
          }

          case "combo": {
            duration = 0.3;
            triggerHaptic("success");
            const baseFreq = 523.25; // C5
            const pitchFactor = 1 + streakCount * 0.15;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(baseFreq * pitchFactor, now);
            osc.frequency.exponentialRampToValueAtTime(
              baseFreq * 1.5 * pitchFactor,
              now + 0.18,
            );

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.22);
            break;
          }

          case "levelUp": {
            duration = 1.0;
            triggerHaptic("success");
            const playNote = (pitch: number, start: number, length: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(pitch, now + start);

              gain.gain.setValueAtTime(0.06, now + start);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + start + length,
              );

              const lowpass = ctx.createBiquadFilter();
              lowpass.type = "lowpass";
              lowpass.frequency.setValueAtTime(1000, now + start);

              osc.connect(lowpass);
              lowpass.connect(gain);
              gain.connect(masterGain);

              osc.start(now + start);
              osc.stop(now + start + length + 0.02);
            };

            playNote(261.63, 0, 0.15);
            playNote(329.63, 0.06, 0.15);
            playNote(392.0, 0.12, 0.15);
            playNote(523.25, 0.22, 0.6);
            playNote(659.25, 0.22, 0.6);
            playNote(783.99, 0.22, 0.6);
            break;
          }

          case "victoryFanfare": {
            duration = 1.5;
            triggerHaptic("success");
            const notes = [
              261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5,
            ];
            const noteDur = 0.12;

            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, now + idx * noteDur);

              const dur = idx === notes.length - 1 ? 0.6 : noteDur;
              gain.gain.setValueAtTime(0.12, now + idx * noteDur);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + idx * noteDur + dur,
              );

              osc.connect(gain);
              gain.connect(masterGain);

              osc.start(now + idx * noteDur);
              osc.stop(now + idx * noteDur + dur + 0.02);
            });
            break;
          }

          case "lossMelody": {
            duration = 1.8;
            triggerHaptic("error");
            const notes = [392.0, 370.0, 349.23, 293.66];
            const noteDur = 0.22;

            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, now + idx * noteDur);

              const dur = idx === notes.length - 1 ? 0.7 : noteDur;
              gain.gain.setValueAtTime(0.1, now + idx * noteDur);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + idx * noteDur + dur,
              );

              osc.connect(gain);
              gain.connect(masterGain);

              osc.start(now + idx * noteDur);
              osc.stop(now + idx * noteDur + dur + 0.02);
            });
            break;
          }

          default:
            break;
        }
      } catch (e) {
        console.warn("Foly audio generation error:", e);
      }

      // Schedule masterGain disconnect
      setTimeout(
        () => {
          try {
            masterGain.disconnect();
          } catch {
            // Safe disconnect
          }
        },
        duration * 1000 + 100,
      );
    },
    [volume, muted],
  );

  const contextValue = useMemo(
    () => ({
      volume,
      muted,
      setVolume,
      setMuted,
      playSound,
    }),
    [volume, muted, setVolume, setMuted, playSound],
  );

  return (
    <AudioContextState.Provider value={contextValue}>
      {children}
    </AudioContextState.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGamifiedAudio = () => {
  const context = useContext(AudioContextState);
  if (!context) {
    throw new Error("useGamifiedAudio must be used inside an AudioProvider");
  }
  return context;
};
