'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useSettings } from '@/context/SettingsProvider';

/**
 * Romantic opening screen (Dribbble-style hero): a beating heart glyph,
 * an elegant serif invitation and a single glowing "Open My Heart" action.
 * Fades away to reveal the animation — never obscuring the heart itself.
 */
export function IntroScreen({ onOpen }: { onOpen: () => void }) {
  const { palette, settings } = useSettings();
  const greeting = settings.recipient.trim()
    ? `For ${settings.recipient.trim()}`
    : 'For you';

  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${palette.bg}e6 0%, ${palette.bg}fa 55%, ${palette.bg} 100%)`,
        backdropFilter: 'blur(2px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full blur-2xl"
            style={{ backgroundColor: palette.glow, opacity: 0.6 }}
          />
          <Heart className="love-beat size-12" fill={palette.accent} stroke={palette.accent} strokeWidth={1.5} />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
          {greeting}
        </p>

        <h1
          className="max-w-xl text-balance text-3xl leading-tight text-white sm:text-4xl md:text-5xl"
          style={{ fontFamily: 'var(--font-serif-display)' }}
        >
          A thousand ways to say{' '}
          <span style={{ color: palette.swatch[2] }}>I love you</span>
        </h1>

        <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/50 md:text-base">
          Twenty languages, one heart. Watch it beat itself into existence —
          then make it yours.
        </p>

        <motion.button
          type="button"
          onClick={onOpen}
          whileTap={{ scale: 0.96 }}
          className="btn-love mt-10"
          autoFocus
        >
          <Heart className="size-4" fill="#fff" stroke="none" />
          Open My Heart
        </motion.button>

        <p className="mt-6 text-[11px] text-white/25">Press Enter or tap to begin</p>
      </motion.div>
    </motion.div>
  );
}
