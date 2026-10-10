'use client';

import { motion } from 'framer-motion';
import { Heart, Quote } from 'lucide-react';
import { useSettings } from '@/context/SettingsProvider';

/**
 * Digital love letter — appears below the heart once the animation is done.
 * Renders recipient / message / signature with elegant serif typography.
 * When nothing is personalized yet it invites the user to write one.
 */
export function LoveLetter({ visible, onWrite }: { visible: boolean; onWrite: () => void }) {
  const { settings, palette } = useSettings();
  const hasContent = Boolean(settings.recipient.trim() || settings.message.trim() || settings.signature.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: visible ? 0.5 : 0 }}
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4 sm:bottom-28"
    >
      {hasContent ? (
        <figure
          className="pointer-events-auto max-w-lg rounded-2xl border border-white/[0.07] bg-black/35 px-6 py-5 text-center backdrop-blur-md"
          style={{ boxShadow: `0 0 44px -8px ${palette.glow}` }}
        >
          <Quote aria-hidden className="mx-auto mb-2 size-4 opacity-40" style={{ color: palette.swatch[2] }} />
          {settings.recipient.trim() && (
            <figcaption className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
              For {settings.recipient.trim()}
            </figcaption>
          )}
          {settings.message.trim() && (
            <blockquote
              className="mt-2 text-balance text-[15px] leading-relaxed text-white/85 md:text-base"
              style={{ fontFamily: 'var(--font-serif-display)' }}
            >
              {settings.message.trim()}
            </blockquote>
          )}
          {settings.signature.trim() && (
            <p className="mt-3 text-sm italic text-white/60" style={{ fontFamily: 'var(--font-serif-display)' }}>
              — {settings.signature.trim()}
            </p>
          )}
        </figure>
      ) : (
        <button
          type="button"
          onClick={onWrite}
          className="btn-pill pointer-events-auto !rounded-full bg-black/40 backdrop-blur-md"
        >
          <Heart className="size-3.5" style={{ color: palette.accent }} />
          Add your names &amp; a love message
        </button>
      )}
    </motion.div>
  );
}
