/**
 * Shared TypeScript interfaces for the Love Heart experience.
 * Keeping every public contract in one place makes the app
 * future-proof: new palettes, shapes or styles only need to
 * satisfy these interfaces.
 */

export type RGB = [number, number, number];

export interface Phrase {
  /** Stable id used for share links + selection (language code). */
  id: string;
  /** Language shown in the UI, e.g. "Turkish". */
  language: string;
  /** The phrase itself, e.g. "Seni seviyorum". */
  text: string;
  /** Native script / short label, e.g. "Türkçe". */
  native: string;
}

export interface Palette {
  id: string;
  name: string;
  /** Page background, hex string (like BG in love.py). */
  bg: string;
  /** Background as normalized rgb triple (BGC in love.py). */
  bgRgb: RGB;
  /** Deep base tone (wine in love.py). */
  wine: RGB;
  /** Mid tone (crimson in love.py). */
  crimson: RGB;
  /** Hot edge tone (blood in love.py). */
  blood: RGB;
  /** Highlight flash color (FLASH in love.py). */
  flash: RGB;
  /** Ambient radial glow behind the heart. */
  glow: string;
  /** Accent color for UI chrome. */
  accent: string;
  /** Swatch preview colors for the picker. */
  swatch: [string, string, string];
}

export type VisualStyleId = 'classic' | 'neon' | 'soft';

export interface AnimationDefaults {
  /** Seconds for the full spawn sweep (DURATION in love.py). */
  duration: number;
  /** Frames each phrase spends floating in (ANIM in love.py). */
  animFrames: number;
  /** Pixels a phrase lifts from before settling (LIFT in love.py). */
  lift: number;
  /** Gap between phrases on a row (GAP in love.py). */
  gap: number;
  /** Font sizes cycled per phrase (SIZES in love.py). */
  sizes: number[];
  /** Fixed RNG seed so layouts are reproducible (rng = r.Random(11)). */
  seed: number;
}

export interface EngineSettings {
  speed: number; // 0.25 .. 3
  size: number; // 40 .. 160 (% of default)
  glow: number; // 0 .. 100 (%)
  particles: boolean;
  phraseAnim: boolean;
  style: VisualStyleId;
  paletteId: string;
}

export interface Personalization {
  recipient: string;
  signature: string;
  message: string;
  enabledPhraseIds: string[];
  customPhrases: string[];
}

export interface Settings extends EngineSettings, Personalization {}

export interface EngineCallbacks {
  onProgress?: (p: number) => void;
  onComplete?: () => void;
}
