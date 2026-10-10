'use client';

import { useMemo, useRef } from 'react';
import { useSettings } from '@/context/SettingsProvider';
import { mulberry32 } from '@/lib/rng';

/**
 * ReactBits-inspired atmosphere: radial ambient wash that gently follows the
 * pointer, a deterministic faint starfield and slow floating hearts.
 * Everything is pure CSS/DOM (no extra canvas) and pauses when hidden.
 */
export function AmbientBackground() {
  const { palette, settings, reducedMotion } = useSettings();
  const glowRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(() => {
    if (reducedMotion) return [];
    const rng = mulberry32(42);
    return Array.from({ length: 46 }, (_, i) => ({
      id: i,
      left: rng() * 100,
      top: rng() * 100,
      size: 1 + rng() * 1.8,
      dur: 3 + rng() * 5,
      delay: rng() * 6,
      min: 0.05 + rng() * 0.15,
      max: 0.4 + rng() * 0.5,
    }));
  }, [reducedMotion]);

  const floaters = useMemo(() => {
    if (reducedMotion || !settings.particles) return [];
    const rng = mulberry32(7);
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      left: rng() * 100,
      size: 8 + rng() * 14,
      dur: 16 + rng() * 18,
      delay: -rng() * 30,
      drift: (rng() - 0.5) * 120,
      opacity: 0.12 + rng() * 0.2,
    }));
  }, [reducedMotion, settings.particles]);

  // Pointer parallax via direct DOM writes — zero re-renders per move.
  const onPointerMove = (e: React.PointerEvent) => {
    const el = glowRef.current;
    if (!el || reducedMotion) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  };

  const glowScale = settings.glow / 100;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ background: palette.bg }}>
      {/* Pointer parallax is attached to the page shell instead, since this
          layer is pointer-events-none by design. */}
      {/* Deep burgundy vignette */}
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `radial-gradient(ellipse 120% 90% at 50% 42%, ${palette.glow}, transparent 62%)`,
          opacity: 0.16 + 0.5 * glowScale,
        }}
      />
      {/* Pointer-following soft light */}
      <div
        ref={glowRef}
        className="absolute inset-0"
        style={{
          ['--mx' as string]: '50%',
          ['--my' as string]: '45%',
          background: `radial-gradient(420px circle at var(--mx) var(--my), ${palette.glow}, transparent 70%)`,
          opacity: reducedMotion ? 0 : 0.14 + 0.22 * glowScale,
          transition: 'background 700ms ease, opacity 700ms ease',
        }}
      />
      {/* Starfield */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="love-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            ['--tw-dur' as string]: `${s.dur}s`,
            ['--tw-delay' as string]: `${s.delay}s`,
            ['--tw-min' as string]: s.min,
            ['--tw-max' as string]: s.max,
          }}
        />
      ))}
      {/* Floating mini hearts */}
      {floaters.map((f) => (
        <svg
          key={f.id}
          viewBox="0 0 24 24"
          className="love-floating-heart"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            ['--fh-dur' as string]: `${f.dur}s`,
            ['--fh-delay' as string]: `${f.delay}s`,
            ['--fh-drift' as string]: `${f.drift}px`,
            ['--fh-opacity' as string]: f.opacity,
          }}
        >
          <path
            d="M12 21C12 21 4 14.5 4 9.2 4 6.3 6.3 4 9 4c1.5 0 2.4.7 3 1.6C12.6 4.7 13.5 4 15 4c2.7 0 5 2.3 5 5.2C20 14.5 12 21 12 21z"
            fill={palette.accent}
          />
        </svg>
      ))}
      {/* Film grain-ish darkening at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
