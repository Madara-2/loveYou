'use client';

import { AnimatePresence } from 'framer-motion';
import { Heart, PenLine } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AnimationControls } from '@/components/AnimationControls';
import { CompletionScreen } from '@/components/CompletionScreen';
import { CustomizationPanel } from '@/components/CustomizationPanel';
import { HeartCanvas } from '@/components/HeartCanvas';
import { IntroScreen } from '@/components/IntroScreen';
import { LoveLetter } from '@/components/LoveLetter';
import { useSettings } from '@/context/SettingsProvider';
import { useFullscreen } from '@/hooks';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import type { HeartRenderer } from '@/engine/renderer';

type Phase = 'intro' | 'animating' | 'complete';

/**
 * The experience shell: intro gate → animated heart → shimmering completion.
 * Owns only UI-level state; the animation itself lives in HeartCanvas +
 * HeartRenderer, personalization in SettingsProvider.
 */
export function Experience() {
  const { palette, settings } = useSettings();
  const [phase, setPhase] = useState<Phase>('intro');
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const [dockOpen, setDockOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false); // off by default (autoplay policy)
  const rendererRef = useRef<HeartRenderer | null>(null);

  const { isFullscreen, supported: fsSupported, toggle: toggleFullscreen } = useFullscreen();
  useAmbientAudio(soundOn);

  const active = phase !== 'intro';

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleComplete = useCallback(() => {
    setPhase('complete');
    // Celebrate once per full playthrough; users can reopen from the dock.
    setCompletionOpen(true);
  }, []);

  const handleReplay = useCallback(() => {
    setCompletionOpen(false);
    setProgress(0);
    setPhase('animating');
    setPaused(false);
    setReplayToken((t) => t + 1);
  }, []);

  const openHeart = useCallback(() => {
    setPhase('animating');
  }, []);

  // Space bar toggles playback while the heart screen is up and no dialog
  // or text field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!active) return;
      e.preventDefault();
      setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const showProgress = phase === 'animating' && progress < 1;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <AmbientBackground />

      {/* The heart — full-viewport stage */}
      <section className="absolute inset-0" aria-label="Love heart animation">
        <HeartCanvas
          active={active}
          paused={paused}
          onProgress={handleProgress}
          onComplete={handleComplete}
          replayToken={replayToken}
          onRendererReady={(r) => (rendererRef.current = r)}
        />
      </section>

      {/* Top bar: wordmark + personalize */}
      <AnimatePresence>
        {active && (
          <header
            className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between px-4 pb-2 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6"
            key="topbar"
          >
            <div className="pointer-events-auto flex items-center gap-2 select-none">
              <Heart className="size-4" fill={palette.accent} stroke={palette.accent} strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide text-white/70" style={{ fontFamily: 'var(--font-serif-display)' }}>
                {settings.recipient.trim() ? `For ${settings.recipient.trim()}` : 'A thousand ways to say I love you'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="btn-pill pointer-events-auto bg-black/30 backdrop-blur-md"
              aria-label="Personalize names, message and languages"
            >
              <PenLine className="size-3.5" style={{ color: palette.accent }} />
              <span className="hidden sm:inline">Personalize</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </header>
        )}
      </AnimatePresence>

      {/* Progress indicator during the spawn sweep */}
      {showProgress && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Heart forming"
          className="fixed inset-x-0 top-0 z-40 h-[3px]"
        >
          <div
            className="love-progress-fill h-full rounded-r-full transition-[width] duration-150 ease-linear"
            style={{
              width: `${Math.max(2, progress * 100)}%`,
              backgroundColor: palette.accent,
              boxShadow: `0 0 12px ${palette.accent}`,
            }}
          />
        </div>
      )}

      {/* Love letter / floating message after completion */}
      <LoveLetter visible={phase === 'complete' && !completionOpen} onWrite={() => setCustomizeOpen(true)} />

      {/* Controls dock */}
      {active && (
        <AnimationControls
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onReplay={handleReplay}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
          fullscreenSupported={fsSupported}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => void toggleFullscreen()}
          panelOpen={dockOpen}
          onPanelOpenChange={setDockOpen}
        />
      )}

      {/* Dialogs */}
      <CustomizationPanel open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <CompletionScreen
        open={completionOpen && phase === 'complete'}
        onClose={() => setCompletionOpen(false)}
        onReplay={handleReplay}
        getImage={() => rendererRef.current?.exportImage() ?? null}
      />

      {/* Intro gate */}
      <AnimatePresence>{phase === 'intro' && <IntroScreen onOpen={openHeart} />}</AnimatePresence>
    </main>
  );
}
