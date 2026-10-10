import { ALL_PHRASE_IDS } from './phrases';
import { DEFAULT_PALETTE_ID } from './palettes';
import type { AnimationDefaults, Settings, VisualStyleId } from './types';

/**
 * Direct port of the constants at the top of love.py.
 * SC / OY are derived per-viewport by the layout engine so the heart
 * always fits; the rest map 1:1.
 */
export const ANIMATION_DEFAULTS: AnimationDefaults = {
  duration: 10, // DURATION — seconds for the spawn sweep
  animFrames: 42, // ANIM — frames each phrase floats in
  lift: 34, // LIFT — pixels phrases hover before settling
  gap: 7, // GAP — spacing between phrases on a row
  sizes: [9, 10, 11, 12], // SIZES — bold font sizes cycled randomly
  seed: 11, // rng = r.Random(11) — reproducible layouts
};

/** Heart curve resolution (POLY uses 720 samples). */
export const POLY_STEPS = 720;

/** Minimum horizontal run that can host text (love.py `hi - lo > 14`). */
export const MIN_SPAN = 14;

export const VISUAL_STYLES: { id: VisualStyleId; name: string; hint: string }[] = [
  { id: 'classic', name: 'Classic', hint: 'The original crimson glow' },
  { id: 'neon', name: 'Neon', hint: 'Intense bloom & sparks' },
  { id: 'soft', name: 'Soft', hint: 'Gentle candlelight' },
];

export const DEFAULT_SETTINGS: Settings = {
  speed: 1,
  size: 100,
  glow: 55,
  particles: true,
  phraseAnim: true,
  style: 'classic',
  paletteId: DEFAULT_PALETTE_ID,
  recipient: '',
  signature: '',
  message: '',
  enabledPhraseIds: [...ALL_PHRASE_IDS],
  customPhrases: [],
};

export const LIMITS = {
  recipient: 24,
  signature: 24,
  message: 220,
  speed: { min: 0.25, max: 3, step: 0.05 },
  size: { min: 50, max: 160, step: 1 },
  glow: { min: 0, max: 100, step: 1 },
};

export const STORAGE_KEY = 'love-heart-settings-v1';
