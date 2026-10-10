import { ANIMATION_DEFAULTS, MIN_SPAN, POLY_STEPS } from '@/config/defaults';
import type { Palette, Phrase, RGB } from '@/config/types';
import { dimRgb, mixRgb, rgbToHex } from '@/lib/color';
import { Rng } from '@/lib/rng';

/**
 * HeartAnimationEngine — layout half.
 *
 * This is a faithful port of the geometry + placement logic of love.py:
 *   heart(a)      -> parametric heart curve (16sin^3 t, 13cos t - ...)
 *   spans(y)      -> scanline intersection with the polygon
 *   intersect(A,B) -> row bands that are inside the heart for the full row height
 *   build()       -> greedy phrase packing per band with the shuffled cycle
 *   color grading -> wine/crimson/blood by radial distance + edge boost
 *   ordering      -> edges sorted angularly, inner sorted by radius (outside-in)
 */

export interface PlacedPhrase {
  x: number; // canvas coords, center of text
  y: number; // canvas coords, center of text
  text: string;
  size: number; // px font size
  w: number; // measured width px
  edge: boolean;
  color: RGB;
  /** CSS hex of `color` precomputed once. */
  hex: string;
  /** Dimmed variants used by shadow/halo layers. */
  shadowHex: string;
  haloHex: string;
  /** love.py stores these raw colors for shimmer restore. */
  flashHex: string;
  rad: number;
}

export interface LayoutResult {
  phrases: PlacedPhrase[];
  width: number;
  height: number;
  cx: number;
  cy: number;
  sc: number;
  poly: [number, number][];
}

export interface LayoutInput {
  cssWidth: number;
  cssHeight: number;
  sizePct: number;
  palette: Palette;
  texts: string[];
  seed?: number;
}

/** Measure bold Arial widths exactly like tkinter's Font.measure via canvas. */
function makeMeasurer(): (text: string, size: number) => number {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const cache = new Map<string, number>();
  return (text, size) => {
    const key = `${size}|${text}`;
    let w = cache.get(key);
    if (w === undefined) {
      ctx.font = `700 ${size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
      w = ctx.measureText(text).width;
      cache.set(key, w);
    }
    return w;
  };
}

export function buildLayout(input: LayoutInput): LayoutResult {
  const { cssWidth, cssHeight, sizePct, palette, texts } = input;
  const rng = new Rng(input.seed ?? ANIMATION_DEFAULTS.seed);
  const measure = makeMeasurer();

  // --- Fit the heart into the viewport -------------------------------
  // Curve extents in math units: x ∈ [-16, 16], y ∈ [-18, 14] (height 32).
  const padX = Math.max(24, cssWidth * 0.05);
  const padTop = Math.max(56, cssHeight * 0.1); // room for the lobe tips
  const padBottom = Math.max(56, cssHeight * 0.11); // room for the tagline
  const scFit = Math.min((cssWidth / 2 - padX) / 16, (cssHeight - padTop - padBottom) / 32);
  const SC = Math.max(6, scFit * (sizePct / 100));

  // Canvas-space heart points (y flipped so the tip points down).
  const heartPoint = (a: number): [number, number] => {
    const x = 16 * Math.sin(a) ** 3;
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [x * SC, -(y * SC)];
  };

  const poly: [number, number][] = [];
  for (let i = 0; i < POLY_STEPS; i++) poly.push(heartPoint((2 * Math.PI * i) / POLY_STEPS));
  const edges = zipPoly(poly);

  const ys = poly.map((p) => p[1]);
  const YMIN = Math.min(...ys); // top of lobes
  const YMAX = Math.max(...ys); // bottom tip
  const CY = (YMIN + YMAX) / 2;
  const CX = 0;

  // --- Row height from the largest font (tkinter linespace ≈ size*1.35) --
  // Font sizes scale with SC so the heart stays proportional at any viewport.
  const SIZES_PX = ANIMATION_DEFAULTS.sizes.map((z) => Math.max(8, Math.round(z * SC / 12)));
  const rowH = Math.round(Math.max(...SIZES_PX) * 1.35) + 4;
  const half = rowH / 2;

  // Scanline spans in canvas space.
  const spansAt = (y: number): [number, number][] => {
    const xs: number[] = [];
    for (const [x1, y1, x2, y2] of edges) {
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    const out: [number, number][] = [];
    for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
    return out;
  };

  const minSpanPx = Math.max(6, (MIN_SPAN * SC) / 21);
  const intersectSpans = (A: [number, number][], B: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const a of A) {
      for (const b of B) {
        const lo = Math.max(a[0], b[0]);
        const hi = Math.min(a[1], b[1]);
        if (hi - lo > minSpanPx) out.push([lo, hi]);
      }
    }
    return out;
  };

  // Phrase cycle — shuffled repeatedly, exactly like phrase_cycle().
  const cycle = (function* (): Generator<string> {
    while (true) {
      const order = [...texts];
      rng.shuffle(order);
      yield* order;
    }
  })();

  const placed: Omit<PlacedPhrase, 'color' | 'hex' | 'shadowHex' | 'haloHex' | 'flashHex' | 'rad'>[] = [];
  const inset = Math.max(2, (4 * SC) / 21);
  const jitter = Math.max(2, (8 * SC) / 21);
  const gapPx = (ANIMATION_DEFAULTS.gap * SC) / 21;

  for (let y = YMIN + half; y < YMAX - half; y -= rowH) {
    const row = intersectSpans(spansAt(y - half), spansAt(y + half));
    for (let ri = 0; ri < row.length; ri++) {
      // For hearts with multiple interior islands the middle span(s) matter;
      // keep every valid band.
      let [lo, hi] = row[ri];
      lo += inset;
      hi -= inset;
      if (hi - lo < minSpanPx) continue;
      let cur = lo + rng.uniform(0, jitter);
      const line: { cx: number; text: string; size: number; w: number }[] = [];

      for (;;) {
        let fit: { text: string; size: number; w: number } | null = null;
        for (let tries = 0; tries < 10; tries++) {
          const text = cycle.next().value as string;
          const size = rng.choice(SIZES_PX);
          const w = measure(text, size);
          if (cur + w <= hi) {
            fit = { text, size, w };
            break;
          }
        }
        if (!fit) break;
        line.push({ cx: cur + fit.w / 2, text: fit.text, size: fit.size, w: fit.w });
        cur += fit.w + gapPx;
      }

      if (line.length === 0) continue;

      if (line.length > 1) {
        const left = hi - (line[line.length - 1].cx + line[line.length - 1].w / 2);
        line.forEach((it, i) => (it.cx += (left * i) / (line.length - 1)));
      } else {
        line[0].cx = (lo + hi) / 2;
      }

      line.forEach((it, i) => {
        const edge = i === 0 || i === line.length - 1;
        // Store final positions directly in canvas space so the renderer can
        // draw and hit-test without extra offsets.
        placed.push({
          x: it.cx + CX + cssWidth / 2,
          y: y + CY + cssHeight / 2,
          text: it.text,
          size: it.size,
          w: it.w,
          edge,
        });
      });
    }
  }

  // --- Color grading (identical math to love.py) ----------------------
  const mathDist = (x: number, y: number) => Math.hypot(x / (16 * SC), (y - CY) / (14.5 * SC));
  const wine = palette.wine;
  const crimson = palette.crimson;
  const blood = palette.blood;
  const flash = palette.flash;

  const colored = placed.map((p) => {
    const rad = Math.min(1, mathDist(p.x - CX, p.y));
    let base = mixRgb(wine, crimson, 0.25 + 0.75 * rad);
    base = mixRgb(base, blood, rng.uniform(0, 0.35) + (p.edge ? 0.3 : 0));
    base = base.map((v) => Math.min(1, v)) as RGB;
    return {
      ...p,
      rad,
      color: base,
      hex: rgbToHex(base),
      shadowHex: rgbToHex(mixRgb(palette.bgRgb, dimRgb(base, 0.3), 1)),
      haloHex: rgbToHex(mixRgb(palette.bgRgb, dimRgb(base, 0.2), 1)),
      flashHex: rgbToHex(mixRgb(base, flash, 0.6)),
    } satisfies PlacedPhrase;
  });

  // --- Spawn ordering (love.py: edges angularly, inner outside-in) ----
  const edgeList = colored.filter((p) => p.edge);
  const inner = colored.filter((p) => !p.edge);
  edgeList.sort((a, b) => {
    const ka = mod(Math.atan2(a.x - CX, a.y - CY), 2 * Math.PI);
    const kb = mod(Math.atan2(b.x - CX, b.y - CY), 2 * Math.PI);
    return ka - kb;
  });
  // Precompute one jittered key per inner phrase (matches Python's
  // `key=lambda p: -p["rad"] + rng.uniform(0, 0.08)` evaluated once/item).
  const innerKeys = inner
    .map((p) => ({ p, k: -p.rad + rng.uniform(0, 0.08) }))
    .sort((a, b) => a.k - b.k)
    .map(({ p }) => p);

  const ordered = [...edgeList, ...innerKeys];

  return {
    phrases: ordered,
    width: cssWidth,
    height: cssHeight,
    cx: CX + cssWidth / 2,
    cy: CY + cssHeight / 2,
    sc: SC,
    poly,
  };
}

type EdgeTuple = [number, number, number, number];

function zipPoly(poly: [number, number][]): EdgeTuple[] {
  const out: EdgeTuple[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % n];
    out.push([x1, y1, x2, y2]);
  }
  return out;
}

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/** Convenience: active phrase texts from personalization config. */
export function resolveTexts(phrases: Phrase[], enabledIds: string[], custom: string[]): string[] {
  const picked = phrases.filter((p) => enabledIds.includes(p.id)).map((p) => p.text);
  const extras = custom.map((t) => t.trim()).filter(Boolean);
  const all = [...picked, ...extras];
  return all.length > 0 ? all : phrases.map((p) => p.text);
}
