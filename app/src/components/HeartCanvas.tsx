'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/context/SettingsProvider';
import { buildLayout, resolveTexts } from '@/engine/layout';
import { HeartRenderer } from '@/engine/renderer';
import { useDebouncedValue, useElementSize } from '@/hooks';
import { PHRASES } from '@/config/phrases';
import type { EngineSettings } from '@/config/types';

interface HeartCanvasProps {
  active: boolean; // start once the intro is dismissed
  paused: boolean;
  onProgress: (p: number) => void;
  onComplete: () => void;
  /** bump to force replay from parent */
  replayToken: number;
  /** called with the renderer instance so parents can export images */
  onRendererReady?: (renderer: HeartRenderer | null) => void;
}

/**
 * Mounts the framework-agnostic HeartRenderer onto a canvas and keeps it in
 * sync with settings. All per-frame work happens inside the renderer — React
 * only re-renders when layout-affecting values change (debounced).
 */
export function HeartCanvas({
  active,
  paused,
  onProgress,
  onComplete,
  replayToken,
  onRendererReady,
}: HeartCanvasProps) {
  const { settings, palette, layoutVersion, reducedMotion } = useSettings();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<HeartRenderer | null>(null);
  const errorRef = useRef<string | null>(null);
  const { width, height } = useElementSize(hostRef);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks without re-creating the renderer.
  const cbRef = useRef({ onProgress, onComplete });
  cbRef.current = { onProgress, onComplete };

  const engineSettings = useMemo<EngineSettings>(
    () => ({
      speed: settings.speed,
      size: settings.size,
      glow: settings.glow,
      particles: settings.particles,
      phraseAnim: settings.phraseAnim,
      style: settings.style,
      paletteId: settings.paletteId,
    }),
    [settings.speed, settings.size, settings.glow, settings.particles, settings.phraseAnim, settings.style, settings.paletteId],
  );

  const texts = useMemo(
    () => resolveTexts(PHRASES, settings.enabledPhraseIds, settings.customPhrases),
    [settings.enabledPhraseIds, settings.customPhrases],
  );

  // Debounce the size slider so dragging doesn't relayout every frame.
  const debouncedSize = useDebouncedValue(engineSettings.size, 200);
  const engineForLayout = useMemo(() => ({ ...engineSettings, size: debouncedSize }), [engineSettings, debouncedSize]);

  // --- create / destroy renderer --------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: HeartRenderer | null = null;
    try {
      renderer = new HeartRenderer(canvas, palette, engineForLayout, {
        onProgress: (p) => cbRef.current.onProgress(p),
        onComplete: () => cbRef.current.onComplete(),
      });
      renderer.setReducedMotion(reducedMotion);
      rendererRef.current = renderer;
      onRendererReady?.(renderer);
      setError(null);
    } catch (e) {
      errorRef.current = e instanceof Error ? e.message : 'Canvas rendering is unavailable.';
      setError(errorRef.current);
    }
    return () => {
      renderer?.destroy();
      rendererRef.current = null;
      onRendererReady?.(null);
    };
    // Renderer identity should not churn on setting changes; we forward them below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forward live settings (speed/glow/style/palette) without relayout.
  useEffect(() => {
    rendererRef.current?.setSettings(engineSettings);
    rendererRef.current?.setPalette(palette);
  }, [engineSettings, palette]);

  useEffect(() => {
    rendererRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  // --- layout on viewport / phrase / size / palette changes ------------
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || width < 40 || height < 40) return;
    try {
      const layout = buildLayout({
        cssWidth: width,
        cssHeight: height,
        sizePct: engineForLayout.size,
        palette,
        texts,
      });
      renderer.setLayout(layout);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build the heart layout.');
    }
  }, [width, height, engineForLayout.size, palette, texts, layoutVersion]);

  // Pause/resize handling for DPR changes.
  useEffect(() => {
    const onResize = () => rendererRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Start/stop the loop with the intro gate + visibility.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !ready) return;
    if (active) {
      renderer.start();
    } else {
      renderer.stop();
      // Fresh layout while on the intro screen: show a still heart preview
      // instead of a black canvas.
      renderer.drawStill();
    }
  }, [active, ready]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !ready) return;
    if (paused) renderer.pause();
    else renderer.resume();
  }, [paused, ready]);

  // Pause when tab hidden — saves CPU/battery.
  useEffect(() => {
    const onVis = () => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      if (document.hidden) renderer.pause();
      else if (!paused) renderer.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [paused]);

  // Replay token from the controls dock.
  useEffect(() => {
    if (replayToken > 0 && active) rendererRef.current?.replay();
  }, [replayToken, active]);

  // Click surprise: burst near the click point if it lands on the heart.
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const renderer = rendererRef.current;
      if (!renderer || !ready) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      renderer.burst(x, y);
    },
    [ready],
  );

  return (
    <div ref={hostRef} className="absolute inset-0">
      {!error ? (
        <motion.canvas
          ref={canvasRef}
          onClick={onClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0.001 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="block cursor-pointer"
          aria-label="Animated heart made of love phrases in many languages"
          role="img"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Your browser could not start the animation canvas ({error}). The rest of the
            experience still works — try a modern browser like Chrome, Firefox or Safari.
          </p>
        </div>
      )}
    </div>
  );
}
