import { useCallback, useRef, useEffect } from "react";

export type SoundEffectType =
  | "cardSweep" // Card deal/draw / slide sweep
  | "cardPlay" // Card play to center / snap drop
  | "bankCoin" // Money banked / Rent collected / Coin chime
  | "alertBuzz" // Incorrect play or reaction popup
  | "victoryFanfare" // Win fanfare
  | "lossMelody" // Lose sound
  | "timerTick" // Countdown tick
  | "jsnPlay"; // Just Say No shield sound

export const useFoly = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      // Create modern audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    // Resume context if suspended (browser security policy)
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch((err) => {
        console.warn("Foly AudioContext resume failed/interrupted:", err);
      });
    }
    return audioCtxRef.current;
  };

  // Add unmount cleanup that closes any created AudioContext and clears the ref
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        audioCtxRef.current = null;
        if (ctx.state !== "closed") {
          ctx.close().catch((err) => {
            console.warn(
              "Error closing Foly AudioContext during cleanup:",
              err,
            );
          });
        }
      }
    };
  }, []);

  const playSound = useCallback((type: SoundEffectType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    try {
      switch (type) {
        case "cardSweep": {
          // Slide sweep sound: low-pass white noise or frequency sweep of triangle wave
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case "cardPlay": {
          // Pop/snap play sound: frequency drop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.11);
          break;
        }

        case "bankCoin": {
          // Retro double-chime coin sound
          const playCoinTone = (timeOffset: number, pitch: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(pitch, now + timeOffset);

            gain.gain.setValueAtTime(0.12, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              now + timeOffset + 0.2,
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.22);
          };

          playCoinTone(0, 987.77); // B5
          playCoinTone(0.08, 1318.51); // E6
          break;
        }

        case "jsnPlay": {
          // Just Say No futuristic power shield activate: rising pitch & frequency modulation
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

          // Add a highpass filter to make it sound laser/shield-like
          const filter = ctx.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.setValueAtTime(400, now);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case "alertBuzz": {
          // Short error buzzer
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sawtooth";
          osc2.type = "sawtooth";

          osc1.frequency.setValueAtTime(120, now);
          osc2.frequency.setValueAtTime(124, now); // Detuned buzzer

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.23);
          osc2.stop(now + 0.23);
          break;
        }

        case "timerTick": {
          // Short high frequency click/tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(1500, now);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case "victoryFanfare": {
          // Happy C major arpeggio / success melody
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6
          const noteDur = 0.12;

          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * noteDur);

            // Longer sustain on the final peak note
            const dur = idx === notes.length - 1 ? 0.6 : noteDur;
            gain.gain.setValueAtTime(0.15, now + idx * noteDur);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              now + idx * noteDur + dur,
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * noteDur);
            osc.stop(now + idx * noteDur + dur + 0.02);
          });
          break;
        }

        case "lossMelody": {
          // Sad descending melody
          const notes = [392.0, 370.0, 349.23, 293.66]; // G4, F#4, F4, D4
          const noteDur = 0.22;

          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * noteDur);

            const dur = idx === notes.length - 1 ? 0.7 : noteDur;
            gain.gain.setValueAtTime(0.12, now + idx * noteDur);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              now + idx * noteDur + dur,
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

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
  }, []);

  return { playSound };
};
