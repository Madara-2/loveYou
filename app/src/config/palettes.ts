import type { Palette } from './types';

/**
 * Color palettes. The first one ("Crimson") reproduces the exact colors
 * of love.py: BG #060208, wine (0.58, 0, 0.09), crimson (0.90, 0.05, 0.14),
 * blood (0.98, 0.10, 0.16) and FLASH (1.0, 0.78, 0.78).
 * New palettes can be added here without touching the engine.
 */
export const PALETTES: Palette[] = [
  {
    id: 'crimson',
    name: 'Crimson',
    bg: '#060208',
    bgRgb: [6 / 255, 2 / 255, 8 / 255],
    wine: [0.58, 0.0, 0.09],
    crimson: [0.9, 0.05, 0.14],
    blood: [0.98, 0.1, 0.16],
    flash: [1.0, 0.78, 0.78],
    glow: 'rgba(230, 13, 36, 0.34)',
    accent: '#E60D24',
    swatch: ['#940017', '#E60D24', '#FFBFCB'],
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    bg: '#0a0406',
    bgRgb: [10 / 255, 4 / 255, 6 / 255],
    wine: [0.55, 0.16, 0.2],
    crimson: [0.95, 0.45, 0.45],
    blood: [1.0, 0.62, 0.5],
    flash: [1.0, 0.9, 0.8],
    glow: 'rgba(255, 140, 120, 0.30)',
    accent: '#FF8E7A',
    swatch: ['#8C2A33', '#F27373', '#FFE3CC'],
  },
  {
    id: 'midnight',
    name: 'Midnight Ruby',
    bg: '#03030c',
    bgRgb: [3 / 255, 3 / 255, 12 / 255],
    wine: [0.32, 0.0, 0.24],
    crimson: [0.78, 0.06, 0.42],
    blood: [0.95, 0.15, 0.55],
    flash: [0.95, 0.75, 0.95],
    glow: 'rgba(190, 20, 110, 0.32)',
    accent: '#D4237E',
    swatch: ['#520040', '#C7106B', '#FFC2E0'],
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: '#080402',
    bgRgb: [8 / 255, 4 / 255, 2 / 255],
    wine: [0.52, 0.1, 0.02],
    crimson: [0.94, 0.32, 0.06],
    blood: [1.0, 0.55, 0.12],
    flash: [1.0, 0.88, 0.62],
    glow: 'rgba(255, 110, 30, 0.30)',
    accent: '#FF6B1F',
    swatch: ['#85200A', '#F05312', '#FFDFA3'],
  },
];

export const DEFAULT_PALETTE_ID = 'crimson';

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
