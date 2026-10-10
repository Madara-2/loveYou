'use client';

import { useEffect, useRef } from 'react';

/**
 * Gentle ambient audio generated with the Web Audio API — a slow pad of
 * soft detuned sines over a deep root, like candlelight in sound form.
 * No audio files needed, nothing plays until the user opts in (autoplay
 * policies respected), and everything is torn down on unmount.
 */
export function useAmbientAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let ACtor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtor) return; // unsupported — button state simply won't change anything audible

    const ctx = new ACtor();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // Warm Am(add9)-ish drone: A2 root + E3 + A3 + C#4 + B3, very quiet.
    const freqs = [110, 164.81, 220, 277.18, 246.94];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 2) * 3;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.16 : 0.05 / (1 + i * 0.4);
      // slow independent LFO per voice for breathing movement
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = g.gain.value * 0.5;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      o.connect(g).connect(master);
      o.start();
      return { o, lfo };
    });

    // Fade in gently.
    void ctx.resume().then(() => {
      if (disposed) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0, t);
      master.gain.linearRampToValueAtTime(0.5, t + 2.5);
    });

    return () => {
      disposed = true;
      const t = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.6);
      } catch {
        /* context may already be closed */
      }
      window.setTimeout(() => {
        oscs.forEach(({ o, lfo }) => {
          try { o.stop(); lfo.stop(); } catch { /* noop */ }
        });
        void ctx.close().catch(() => undefined);
      }, 700);
      ctxRef.current = null;
      masterRef.current = null;
    };
  }, [enabled]);
}
