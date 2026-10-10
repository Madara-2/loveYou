'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Heart, Images, Link2, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/context/SettingsProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCopy } from '@/hooks';
import { buildShareUrl } from '@/lib/share';

interface CompletionScreenProps {
  open: boolean;
  onClose: () => void;
  onReplay: () => void;
  /** Snapshot of the canvas as PNG data URL (null until first completion). */
  getImage: () => string | null;
}

/**
 * Celebrates the finished heart: shimmer note, download as image, copyable
 * romantic message + share link, and a "make another version" replay.
 */
export function CompletionScreen({ open, onClose, onReplay, getImage }: CompletionScreenProps) {
  const { settings, palette } = useSettings();
  const { copied, copy } = useCopy();
  const [downloaded, setDownloaded] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const personalMessage = (() => {
    const to = settings.recipient.trim();
    const from = settings.signature.trim();
    const msg = settings.message.trim();
    const body = msg || 'A thousand ways to say I love you — and every one of them is yours.';
    return `${to ? `To ${to},\n\n` : ''}${body}${from ? `\n\n— ${from}` : ''}`;
  })();

  const handleDownload = () => {
    try {
      const dataUrl = getImage();
      if (!dataUrl) throw new Error('no image');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'love-heart.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1600);
    } catch {
      setExportError('Image export is not available in this browser.');
      setTimeout(() => setExportError(null), 2600);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="done-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="done-card"
            role="dialog"
            aria-modal="true"
            aria-label="Your heart is complete"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2"
          >
            <GlassCard className="overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)` }}
              />
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-full"
                      style={{ background: `color-mix(in srgb, ${palette.accent} 22%, transparent)` }}
                    >
                      <Heart className="love-beat size-5" fill={palette.accent} stroke={palette.accent} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'var(--font-serif-display)' }}>
                        {settings.recipient.trim() ? `${settings.recipient.trim()}, it&apos;s complete` : 'It’s complete'}
                      </h2>
                      <p className="text-xs text-white/45">The heart is now shimmering on its own.</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="btn-icon !size-8" aria-label="Close">
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={() => { onReplay(); onClose(); }} className="btn-love w-full !py-2.5 text-sm">
                    <RotateCcw className="size-4" />
                    Make another version
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={handleDownload} className="btn-pill w-full justify-center">
                      {downloaded ? <Check className="size-3.5" /> : <Download className="size-3.5" />}
                      Save as PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => void copy(personalMessage)}
                      className="btn-pill w-full justify-center"
                    >
                      {copied ? <Check className="size-3.5" /> : <Images className="size-3.5" />}
                      Copy message
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copy(buildShareUrl(window.location.origin + window.location.pathname, settings))}
                    className="btn-pill w-full justify-center"
                  >
                    <Link2 className="size-3.5" />
                    Copy share link
                  </button>
                </div>

                {exportError && (
                  <p role="alert" className="mt-3 text-xs text-red-300/90">{exportError}</p>
                )}

                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
                  Tip: click anywhere on the heart for a little surprise.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
