'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, LIMITS, STORAGE_KEY } from '@/config/defaults';
import { ALL_PHRASE_IDS, MAX_CUSTOM_PHRASES, MAX_PHRASE_LENGTH } from '@/config/phrases';
import { getPalette } from '@/config/palettes';
import type { Palette, Settings } from '@/config/types';
import { decodeShare } from '@/lib/share';

interface SettingsContextValue {
  settings: Settings;
  palette: Palette;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  addCustomPhrase: (text: string) => { ok: boolean; error?: string };
  removeCustomPhrase: (index: number) => void;
  togglePhrase: (id: string) => void;
  /** bump to force a heart re-layout (size / phrases / palette changes). */
  layoutVersion: number;
  reducedMotion: boolean;
}

const Ctx = createContext<SettingsContextValue | null>(null);

function sanitizeLoaded(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, def: number, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
  const str = (v: unknown, def: string, max: number) =>
    typeof v === 'string' ? v.slice(0, max) : def;
  const ids = Array.isArray(r.enabledPhraseIds)
    ? (r.enabledPhraseIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [...ALL_PHRASE_IDS];
  const customs = Array.isArray(r.customPhrases)
    ? (r.customPhrases as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .map((t) => t.slice(0, MAX_PHRASE_LENGTH))
        .slice(0, MAX_CUSTOM_PHRASES)
    : [];
  const style = ['classic', 'neon', 'soft'].includes(String(r.style)) ? (r.style as Settings['style']) : DEFAULT_SETTINGS.style;
  return {
    speed: num(r.speed, DEFAULT_SETTINGS.speed, LIMITS.speed.min, LIMITS.speed.max),
    size: num(r.size, DEFAULT_SETTINGS.size, LIMITS.size.min, LIMITS.size.max),
    glow: num(r.glow, DEFAULT_SETTINGS.glow, LIMITS.glow.min, LIMITS.glow.max),
    particles: bool(r.particles, DEFAULT_SETTINGS.particles),
    phraseAnim: bool(r.phraseAnim, DEFAULT_SETTINGS.phraseAnim),
    style,
    paletteId: getPalette(String(r.paletteId ?? '')).id,
    recipient: str(r.recipient, '', LIMITS.recipient),
    signature: str(r.signature, '', LIMITS.signature),
    message: str(r.message, '', LIMITS.message),
    enabledPhraseIds: ids.length ? ids : [...ALL_PHRASE_IDS],
    customPhrases: customs,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe initial state: defaults; hydrated in effect.
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS }));
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const initialized = useRef(false);

  // Load from URL (?h=...) then localStorage on mount.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let loaded: Settings | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) loaded = sanitizeLoaded(JSON.parse(stored));
    } catch {
      /* ignore corrupt storage */
    }
    const shared = decodeShare(new URLSearchParams(window.location.search).get('h'));
    const merged = { ...(loaded ?? DEFAULT_SETTINGS), ...shared } as Settings;
    setSettings(sanitizeLoaded(merged));

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Persist whenever settings change (after init).
  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage may be unavailable (private mode) — fail quietly */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const layoutKeys: (keyof Settings)[] = ['size', 'paletteId', 'enabledPhraseIds', 'customPhrases'];
      if (layoutKeys.some((k) => k in patch)) setLayoutVersion((v) => v + 1);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, enabledPhraseIds: [...ALL_PHRASE_IDS] });
    setLayoutVersion((v) => v + 1);
  }, []);

  const addCustomPhrase = useCallback((text: string) => {
    const clean = text.trim().replace(/\s+/g, ' ').slice(0, MAX_PHRASE_LENGTH);
    if (!clean) return { ok: false, error: 'Phrase cannot be empty.' };
    if (clean.length < 2) return { ok: false, error: 'Phrase is too short.' };
    let err: string | undefined;
    let changed = false;
    setSettings((prev) => {
      if (prev.customPhrases.length >= MAX_CUSTOM_PHRASES) {
        err = `You can add up to ${MAX_CUSTOM_PHRASES} custom phrases.`;
        return prev;
      }
      if (prev.customPhrases.some((p) => p.toLowerCase() === clean.toLowerCase())) {
        err = 'That phrase is already added.';
        return prev;
      }
      changed = true;
      return { ...prev, customPhrases: [...prev.customPhrases, clean] };
    });
    // Defer the layout bump until after the state updater has run.
    queueMicrotask(() => {
      if (changed) setLayoutVersion((v) => v + 1);
    });
    return { ok: !err, error: err };
  }, []);

  const removeCustomPhrase = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      customPhrases: prev.customPhrases.filter((_, i) => i !== index),
    }));
    setLayoutVersion((v) => v + 1);
  }, []);

  const togglePhrase = useCallback((id: string) => {
    setSettings((prev) => {
      const has = prev.enabledPhraseIds.includes(id);
      const nextIds = has ? prev.enabledPhraseIds.filter((x) => x !== id) : [...prev.enabledPhraseIds, id];
      if (nextIds.length === 0) return prev; // always keep at least one language
      return { ...prev, enabledPhraseIds: nextIds };
    });
    setLayoutVersion((v) => v + 1);
  }, []);

  const palette = useMemo(() => getPalette(settings.paletteId), [settings.paletteId]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      palette,
      update,
      reset,
      addCustomPhrase,
      removeCustomPhrase,
      togglePhrase,
      layoutVersion,
      reducedMotion,
    }),
    [settings, palette, update, reset, addCustomPhrase, removeCustomPhrase, togglePhrase, layoutVersion, reducedMotion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
