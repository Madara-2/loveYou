'use client';

import { useEffect, useState } from 'react';

/** Track a media query with SSR-safe default. */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/** Element size via ResizeObserver (used by the heart canvas). */
export function useElementSize<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      // Round to avoid sub-pixel relayout loops.
      setSize((prev) => {
        const w = Math.round(width);
        const h = Math.round(height);
        return prev.width === w && prev.height === h ? prev : { width: w, height: h };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Debounced value — used to coalesce rapid slider changes into relayouts. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Fullscreen toggle with graceful fallback when unsupported. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(Boolean(document.fullscreenElement !== undefined || (document as unknown as { webkitFullscreenElement?: unknown }).webkitFullscreenElement !== undefined));
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* unsupported / denied — fail quietly, UI shows state unchanged */
    }
  };
  return { isFullscreen, supported, toggle };
}

/** Copy text to clipboard with feedback state. */
export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
      return true;
    } catch {
      return false;
    }
  };
  return { copied, copy };
}
