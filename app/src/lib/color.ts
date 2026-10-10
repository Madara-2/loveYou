import type { RGB } from '@/config/types';

/** Port of hx() in love.py — clamp + to hex string. */
export function rgbToHex(c: RGB): string {
  const [r, g, b] = c;
  const ch = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/** Port of mix() — linear interpolation between two normalized colors. */
export function mixRgb(a: RGB, b: RGB, k: number): RGB {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Port of dim(). */
export function dimRgb(c: RGB, k: number): RGB {
  return [c[0] * k, c[1] * k, c[2] * k];
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** #rrggbb -> normalized RGB triple. */
export function hexToRgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

/** rgba() string for canvas fills from a normalized color + alpha. */
export function rgba(c: RGB, a: number): string {
  const q = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgba(${q(c[0])},${q(c[1])},${q(c[2])},${a})`;
}
