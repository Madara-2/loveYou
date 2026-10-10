'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Feather, Link2, Plus, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsProvider';
import { GlassCard, PanelLabel } from '@/components/ui/GlassCard';
import { LIMITS } from '@/config/defaults';
import { MAX_CUSTOM_PHRASES, MAX_PHRASE_LENGTH, PHRASES } from '@/config/phrases';
import { buildShareUrl } from '@/lib/share';
import { useCopy } from '@/hooks';

/**
 * Personalization drawer: names, message, language selection and custom
 * phrases. Slides in from the right on desktop, up as a bottom sheet on
 * mobile (intentional breakpoint design, not a shrunk desktop panel).
 */
export function CustomizationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, palette, addCustomPhrase, removeCustomPhrase, togglePhrase } = useSettings();
  const [draftPhrase, setDraftPhrase] = useState('');
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [addedOk, setAddedOk] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();

  const shareCopied = useRef(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Focus management for keyboard users when the sheet opens.
      const t = setTimeout(() => firstFieldRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submitPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addCustomPhrase(draftPhrase);
    if (res.ok) {
      setDraftPhrase('');
      setPhraseError(null);
      setAddedOk(true);
      setTimeout(() => setAddedOk(false), 1400);
    } else {
      setPhraseError(res.error ?? 'Could not add that phrase.');
    }
  };

  const copyShareLink = async () => {
    const url = buildShareUrl(window.location.origin + window.location.pathname, settings);
    const ok = await copy(url);
    setShareMsg(ok ? 'Link copied — it carries your personalization.' : 'Copying failed; your browser blocked it.');
    shareCopied.current = ok;
    setTimeout(() => setShareMsg(null), 2600);
  };

  const enabledCount = settings.enabledPhraseIds.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Personalize your heart"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="love-scroll fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto rounded-l-3xl border-l border-white/[0.07] bg-[#0b0310]/90 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:max-sm:inset-x-0 sm:max-sm:bottom-0 sm:max-sm:top-auto sm:max-sm:rounded-b-none sm:max-sm:rounded-t-3xl sm:max-sm:max-h-[85dvh]"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-serif-display)' }}>
                  Make it yours
                </h2>
                <p className="mt-0.5 text-xs text-white/45">
                  Everything here flows into the heart instantly.
                </p>
              </div>
              <button type="button" onClick={onClose} className="btn-icon" aria-label="Close personalization panel">
                <X className="size-4" />
              </button>
            </div>

            {/* Names + message */}
            <GlassCard className="mb-5 p-4">
              <div className="grid gap-4">
                <Field
                  inputRef={firstFieldRef}
                  label="To (recipient)"
                  value={settings.recipient}
                  maxLength={LIMITS.recipient}
                  placeholder="e.g. Elif"
                  onChange={(v) => update({ recipient: v })}
                />
                <Field
                  label="From (signature)"
                  value={settings.signature}
                  maxLength={LIMITS.signature}
                  placeholder="e.g. Always, Mert"
                  onChange={(v) => update({ signature: v })}
                />
                <div>
                  <label htmlFor="love-msg" className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-white/70">
                    Love message
                    <span className="font-mono text-[11px] text-white/35">
                      {settings.message.length}/{LIMITS.message}
                    </span>
                  </label>
                  <textarea
                    id="love-msg"
                    rows={3}
                    value={settings.message}
                    maxLength={LIMITS.message}
                    placeholder="You are my favorite hello and my hardest goodbye…"
                    onChange={(e) => update({ message: e.target.value })}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm leading-relaxed text-white/90 placeholder:text-white/25 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Languages */}
            <div className="mb-5">
              <PanelLabel>
                Languages on the heart · {enabledCount}/{PHRASES.length}
              </PanelLabel>
              <div className="flex flex-wrap gap-2">
                {PHRASES.map((p) => {
                  const on = settings.enabledPhraseIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePhrase(p.id)}
                      title={`${p.language}: ${p.text}`}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                      style={{
                        borderColor: on ? palette.accent : 'rgba(255,255,255,0.12)',
                        background: on ? `color-mix(in srgb, ${palette.accent} 35%, transparent)` : 'rgba(255,255,255,0.04)',
                        color: on ? '#fff' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {p.native}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                At least one language always stays on. Tap again to switch it back on.
              </p>
            </div>

            {/* Custom phrases */}
            <div className="mb-5">
              <PanelLabel>
                Your own phrases · {settings.customPhrases.length}/{MAX_CUSTOM_PHRASES}
              </PanelLabel>
              <form onSubmit={submitPhrase} className="flex gap-2">
                <input
                  value={draftPhrase}
                  onChange={(e) => {
                    setDraftPhrase(e.target.value);
                    setPhraseError(null);
                  }}
                  maxLength={MAX_PHRASE_LENGTH}
                  placeholder={`e.g. "Better together" (${MAX_PHRASE_LENGTH} chars max)`}
                  aria-label="New custom love phrase"
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
                <button
                  type="submit"
                  className="btn-icon shrink-0"
                  data-active={addedOk}
                  style={{ ['--accent' as string]: palette.accent }}
                  aria-label="Add custom phrase"
                >
                  {addedOk ? <Check className="size-4" /> : <Plus className="size-4" />}
                </button>
              </form>
              {phraseError && (
                <p role="alert" className="mt-2 text-xs text-red-300/90">
                  {phraseError}
                </p>
              )}
              {settings.customPhrases.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {settings.customPhrases.map((cp, i) => (
                    <li
                      key={`${cp}-${i}`}
                      className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-sm text-white/80"
                    >
                      <span className="truncate">“{cp}”</span>
                      <button
                        type="button"
                        onClick={() => removeCustomPhrase(i)}
                        className="ml-2 shrink-0 text-white/40 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
                        aria-label={`Remove phrase ${cp}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Share */}
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={copyShareLink} className="btn-pill">
                  {copied && shareCopied.current ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
                  Copy share link
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = buildShareUrl(window.location.href, settings);
                      void navigator
                        .share({
                          title: 'A thousand ways to say I love you',
                          text: settings.recipient ? `For ${settings.recipient} ❤` : 'Made with love.',
                          url,
                        })
                        .catch(() => undefined);
                    }}
                    className="btn-pill"
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </button>
                )}
              </div>
              {shareMsg && (
                <p role="status" className="mt-2 text-xs text-white/55">
                  {shareMsg}
                </p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/30">
                <Feather className="size-3" />
                Share links include names, message, palette &amp; style only.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const id = `field-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-white/70">
        {label}
        <span className="font-mono text-[11px] text-white/35">
          {value.length}/{maxLength}
        </span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
      />
    </div>
  );
}
