'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  HeartPulse,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsProvider';
import { GlassCard, PanelLabel } from '@/components/ui/GlassCard';
import { Slider, Toggle } from '@/components/ui/Controls';
import { LIMITS, VISUAL_STYLES } from '@/config/defaults';
import { PALETTES } from '@/config/palettes';
import type { VisualStyleId } from '@/config/types';

interface AnimationControlsProps {
  paused: boolean;
  onTogglePause: () => void;
  onReplay: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  fullscreenSupported: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
}

/**
 * Floating glass dock (Uiverse-inspired icon buttons + ReactBits-style
 * springy transitions). Sliders apply live; the settings drawer holds
 * palette / style choices. Keyboard accessible throughout.
 */
export function AnimationControls({
  paused,
  onTogglePause,
  onReplay,
  soundOn,
  onToggleSound,
  fullscreenSupported,
  isFullscreen,
  onToggleFullscreen,
  panelOpen,
  onPanelOpenChange,
}: AnimationControlsProps) {
  const { settings, update, reset, palette } = useSettings();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="dock-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="pointer-events-auto w-full max-w-md"
          >
            <GlassCard className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <Sparkles className="size-4" style={{ color: palette.accent }} />
                  Motion &amp; Mood
                </p>
                <button
                  type="button"
                  onClick={() => onPanelOpenChange(false)}
                  className="btn-icon !size-8"
                  aria-label="Close settings panel"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid gap-4">
                <Slider
                  label="Animation speed"
                  value={settings.speed}
                  min={LIMITS.speed.min}
                  max={LIMITS.speed.max}
                  step={LIMITS.speed.step}
                  accent={palette.accent}
                  formatValue={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => update({ speed: v })}
                />
                <Slider
                  label="Heart size"
                  value={settings.size}
                  min={LIMITS.size.min}
                  max={LIMITS.size.max}
                  step={LIMITS.size.step}
                  unit="%"
                  accent={palette.accent}
                  onChange={(v) => update({ size: v })}
                />
                <Slider
                  label="Glow intensity"
                  value={settings.glow}
                  min={LIMITS.glow.min}
                  max={LIMITS.glow.max}
                  step={LIMITS.glow.step}
                  unit="%"
                  accent={palette.accent}
                  onChange={(v) => update({ glow: v })}
                />
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <Toggle
                  label="Floating particles"
                  description="Ambient hearts drifting upward"
                  checked={settings.particles}
                  accent={palette.accent}
                  onChange={(v) => update({ particles: v })}
                />
                <Toggle
                  label="Phrase entrance animation"
                  description="Phrases float into place when replaying"
                  checked={settings.phraseAnim}
                  accent={palette.accent}
                  onChange={(v) => update({ phraseAnim: v })}
                />
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <PanelLabel>Visual style</PanelLabel>
                <div role="radiogroup" aria-label="Visual style" className="flex gap-2">
                  {VISUAL_STYLES.map((s) => {
                    const activeStyle = settings.style === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={activeStyle}
                        title={s.hint}
                        onClick={() => update({ style: s.id as VisualStyleId })}
                        className="btn-pill flex-1 justify-center !px-2 text-center"
                        style={
                          activeStyle
                            ? {
                                background: `color-mix(in srgb, ${palette.accent} 40%, transparent)`,
                                borderColor: palette.accent,
                                color: '#fff',
                              }
                            : undefined
                        }
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <PanelLabel>Color palette</PanelLabel>
                <div role="radiogroup" aria-label="Color palette" className="flex flex-wrap gap-2.5">
                  {PALETTES.map((p) => {
                    const activePalette = settings.paletteId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={activePalette}
                        aria-label={`Palette: ${p.name}`}
                        title={p.name}
                        onClick={() => update({ paletteId: p.id })}
                        className="group relative grid size-11 place-items-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                        style={{
                          background: `conic-gradient(${p.swatch[0]} 0 33%, ${p.swatch[1]} 33% 66%, ${p.swatch[2]} 66% 100%)`,
                          boxShadow: activePalette
                            ? `0 0 0 2px ${p.bg}, 0 0 0 4px ${p.accent}, 0 0 18px ${p.glow}`
                            : '0 0 0 2px rgba(255,255,255,0.10)',
                        }}
                      >
                        {activePalette && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-1.5 text-[9px] font-medium text-white/90">
                            {p.name.split(' ')[0]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-3">
                <button
                  type="button"
                  onClick={reset}
                  className="btn-pill"
                  aria-label="Reset all settings to defaults"
                >
                  <RotateCcw className="size-3.5" />
                  Reset defaults
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto"
      >
        <GlassCard className="flex items-center gap-1.5 rounded-full px-2.5 py-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="btn-icon"
            aria-label={paused ? 'Play animation' : 'Pause animation'}
            title={paused ? 'Play' : 'Pause'}
          >
            {paused ? <Play className="size-[18px]" fill="currentColor" /> : <Pause className="size-[18px]" />}
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="btn-icon"
            aria-label="Replay animation from the beginning"
            title="Replay"
          >
            <RotateCcw className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            className="btn-icon"
            data-active={soundOn}
            style={{ ['--accent' as string]: palette.accent }}
            aria-label={soundOn ? 'Turn ambient sound off' : 'Turn ambient sound on'}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            {soundOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
          </button>
          {fullscreenSupported && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="btn-icon hidden sm:inline-flex"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="size-[18px]" /> : <Maximize className="size-[18px]" />}
            </button>
          )}

          <span aria-hidden className="mx-1 h-6 w-px bg-white/10" />

          <button
            type="button"
            onClick={() => onPanelOpenChange(!panelOpen)}
            className="btn-icon"
            data-active={panelOpen}
            style={{ ['--accent' as string]: palette.accent }}
            aria-expanded={panelOpen}
            aria-controls="dock-panel"
            aria-label={panelOpen ? 'Hide animation settings' : 'Show animation settings'}
            title="Settings"
          >
            <Settings2 className="size-[18px]" />
          </button>

          <span
            aria-hidden
            className="ml-1 mr-1 hidden items-center gap-1.5 text-[11px] text-white/35 md:flex"
          >
            <HeartPulse className="size-3.5" style={{ color: palette.accent }} />
            click the heart
          </span>
        </GlassCard>
      </motion.div>
    </div>
  );
}
