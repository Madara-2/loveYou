import { ANIMATION_DEFAULTS } from '@/config/defaults';
import type { EngineCallbacks, EngineSettings, Palette, VisualStyleId } from '@/config/types';
import { clamp01, dimRgb, mixRgb, rgba } from '@/lib/color';
import { Rng } from '@/lib/rng';
import type { LayoutResult, PlacedPhrase } from './layout';

/**
 * HeartAnimationEngine — runtime half.
 *
 * Port of spawn()/animate()/step()/shimmer() from love.py, rendered with a
 * single requestAnimationFrame loop onto one canvas (three layered passes:
 * shadow → halo → main text, exactly like the tkinter item layers).
 *
 * The engine is framework-agnostic: React only constructs it and forwards
 * setting changes; no per-frame React state updates happen here.
 */

interface RuntimePhrase extends PlacedPhrase {
  /** Animation progress counter `f` in animate(). */
  f: number;
  /** Horizontal drift dx = rng.uniform(-10, 10) scaled by SC. */
  dx: number;
  /** Current shimmer override color (null = resting color). */
  shimmerUntil: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: string;
}

type StyleParams = {
  bloomBase: number; // extra shadowBlur for main pass at glow=55
  flashBoost: number; // multiplier on the light-flash term
  shimmerEveryMs: number; // how often a phrase glimmers
  shimmerCount: number; // phrases glimmering per tick
};

const STYLE_PARAMS: Record<VisualStyleId, StyleParams> = {
  classic: { bloomBase: 6, flashBoost: 1, shimmerEveryMs: 140, shimmerCount: 1 },
  neon: { bloomBase: 14, flashBoost: 1.35, shimmerEveryMs: 90, shimmerCount: 2 },
  soft: { bloomBase: 3, flashBoost: 0.7, shimmerEveryMs: 220, shimmerCount: 1 },
};

export class HeartRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutResult | null = null;
  private palette: Palette;
  private settings: EngineSettings;
  private callbacks: EngineCallbacks;

  private items: RuntimePhrase[] = [];
  private cursor = 0; // next phrase to spawn (index into ORDER)
  private active: RuntimePhrase[] = [];
  private acc = 0; // fractional spawner (love.py RATE/acc)
  private rate = 0; // phrases per tick-second
  private spawning = true;
  private done = false;
  private finishedAt = 0;

  private raf = 0;
  private lastTs = 0;
  private paused = false;
  private reducedMotion = false;

  private sparks: Spark[] = [];
  private shimmerRng: Rng;
  private lastShimmerAt = 0;

  private pulseStart = 0;
  private pulseActive = false;

  constructor(
    canvas: HTMLCanvasElement,
    palette: Palette,
    settings: EngineSettings,
    callbacks: EngineCallbacks = {},
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');
    this.ctx = ctx;
    this.palette = palette;
    this.settings = settings;
    this.callbacks = callbacks;
    this.shimmerRng = new Rng((settings.seedOffset ?? 7) + ANIMATION_DEFAULTS.seed);
  }

  // ---- lifecycle ------------------------------------------------------

  setLayout(layout: LayoutResult) {
    this.layout = layout;
    this.resetRuntime();
    this.resize();
  }

  private resetRuntime() {
    if (!this.layout) return;
    const rng = new Rng(ANIMATION_DEFAULTS.seed + 5); // independent of layout rng stream end
    this.items = this.layout.phrases.map((p) => ({
      ...p,
      f: 0,
      dx: rng.uniform(-10, 10) * (this.layout!.sc / 21),
      shimmerUntil: 0,
    }));
    this.cursor = 0;
    this.active = [];
    this.acc = 0;
    this.spawning = true;
    this.done = false;
    this.rate = this.items.length / ANIMATION_DEFAULTS.duration; // phrases per second
    // If phrase animation is off, everything lands instantly.
    if (!this.settings.phraseAnim) {
      this.cursor = this.items.length;
      this.spawning = false;
      this.finish(true);
    } else {
      this.active = [];
    }
  }

  resize() {
    if (!this.layout) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const { width, height } = this.layout;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw(performance.now());
  }

  setSettings(next: EngineSettings) {
    const prev = this.settings;
    this.settings = next;
    if (prev.phraseAnim !== next.phraseAnim && !this.done) {
      this.resetRuntime();
    }
  }

  setPalette(p: Palette) {
    this.palette = p;
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  start() {
    this.stop();
    this.lastTs = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTs = 0;
  }

  get isPaused() {
    return this.paused;
  }

  replay() {
    if (!this.layout) return;
    this.shimmerRng = new Rng(Math.floor(Math.random() * 1e9));
    this.sparks = [];
    this.pulseActive = false;
    if (!this.settings.phraseAnim) {
      this.resetRuntime();
      this.draw(performance.now());
      this.callbacks.onProgress?.(1);
      this.callbacks.onComplete?.();
      return;
    }
    this.resetRuntime();
    this.start();
  }

  destroy() {
    this.stop();
    this.layout = null;
    this.items = [];
    this.active = [];
    this.sparks = [];
  }

  /** Snapshot the current canvas as a PNG data URL (for export/share). */
  exportImage(): string {
    return this.canvas.toDataURL('image/png');
  }

  /** Surprise burst at a canvas-space point (heart click). */
  burst(x: number, y: number) {
    const count = this.reducedMotion ? 10 : 26;
    const colors = [this.palette.flash, this.palette.blood, this.palette.crimson];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 40 + Math.random() * 160;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 40,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 2.5,
        hue: rgba(colors[i % colors.length], 1),
      });
    }
    // gentle heart-beat pulse
    this.pulseStart = performance.now();
    this.pulseActive = true;
    if (!this.raf) this.start();
  }

  // ---- frame loop -----------------------------------------------------

  private tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    if (this.paused || !this.layout) return;

    let dt = this.lastTs ? (ts - this.lastTs) / 1000 : 0.016;
    this.lastTs = ts;
    dt = Math.min(dt, 0.05); // avoid huge jumps after tab switches
    const speed = this.settings.speed;

    // Spawner — mirrors step(): acc += RATE each TICK(16ms) frame.
    if (this.spawning) {
      this.acc += this.rate * dt * speed;
      while (this.acc >= 1 && this.cursor < this.items.length) {
        this.acc -= 1;
        const p = this.items[this.cursor];
        p.f += dt * speed * (1000 / 16); // it animates from its spawn frame on
        this.active.push(p);
        this.cursor += 1;
      }
      if (this.cursor >= this.items.length) {
        this.spawning = false;
        this.acc = 0;
      }
      this.callbacks.onProgress?.(clamp01(this.cursor / Math.max(1, this.items.length)));
    }

    // Animate actives (each phrase advances ANIM frames per 1/speed).
    const animFrames = ANIMATION_DEFAULTS.animFrames;
    const stillActive: RuntimePhrase[] = [];
    for (const p of this.active) {
      p.f += dt * speed * (1000 / 16); // original loop ran every 16ms
      if (p.f < animFrames) stillActive.push(p);
      else p.f = animFrames;
    }
    this.active = stillActive;

    if (!this.spawning && this.active.length === 0 && !this.done) {
      this.finish(false);
    }

    // Shimmer timing after completion.
    if (this.done && !this.reducedMotion) {
      const style = STYLE_PARAMS[this.settings.style];
      if (ts - this.lastShimmerAt > style.shimmerEveryMs / speed) {
        this.lastShimmerAt = ts;
        for (let i = 0; i < style.shimmerCount; i++) {
          const p = this.shimmerRng.choice(this.items);
          if (p) p.shimmerUntil = ts + 260; // love.py restores after 260ms
        }
      }
    }

    // Sparks physics.
    if (this.sparks.length) {
      const alive: Spark[] = [];
      for (const s of this.sparks) {
        s.life += dt;
        if (s.life < s.maxLife) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 120 * dt;
          s.vx *= 1 - 0.6 * dt;
          alive.push(s);
        }
      }
      this.sparks = alive;
    }
    if (this.pulseActive && ts - this.pulseStart > 900) this.pulseActive = false;

    this.draw(ts);
  };

  private finish(instant: boolean) {
    this.done = true;
    this.finishedAt = performance.now();
    this.callbacks.onProgress?.(1);
    if (!instant) this.callbacks.onComplete?.();
  }

  // ---- rendering -------------------------------------------------------

  private draw(ts: number) {
    const { ctx, layout, palette } = this;
    if (!layout) return;
    const { width, height, cx, cy } = layout;

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    // Ambient radial glow behind the heart (CSS layer also contributes).
    const glowPct = this.settings.glow / 100;
    if (glowPct > 0.01) {
      const r = layout.sc * 22;
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, withAlpha(palette.glow, 0.55 * glowPct));
      g.addColorStop(0.55, withAlpha(palette.glow, 0.18 * glowPct));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // Beat pulse scale after clicking the heart.
    let scale = 1;
    if (this.pulseActive) {
      const t = (ts - this.pulseStart) / 900;
      scale = 1 + 0.035 * Math.sin(Math.PI * Math.min(t, 1)) * (t < 0.5 ? 1 : (1 - t) * 2);
    }

    ctx.save();
    if (scale !== 1) {
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }

    const style = STYLE_PARAMS[this.settings.style];
    const bg = palette.bgRgb;
    const fontOf = (size: number) =>
      `700 ${size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;

    // Draw order: shadows first, then halos, then mains — keeps the
    // three-layer look of the tkinter version without per-item thrash.
    const renderPass = (
      pickFill: (p: RuntimePhrase) => string,
      offset: (p: RuntimePhrase, e: number) => [number, number],
      blur: (p: RuntimePhrase, e: number) => number,
      grow: number,
    ) => {
      for (const p of this.items) {
        const spawned = this.spawning ? pIndexSpawned(p) : true;
        if (!spawned && p.f <= 0) continue;
        const u = clamp01(p.f / ANIMATION_DEFAULTS.animFrames);
        const e = this.settings.phraseAnim ? 1 - (1 - u) ** 3 : 1; // cubic ease-out
        const [x, y] = offset(p, e);
        ctx.font = fontOf(p.size + grow);
        const fill = pickFill(p);
        const b = blur(p, e);
        if (b > 0.2) {
          ctx.shadowColor = fill;
          ctx.shadowBlur = b;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = fill;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, x, y);
        ctx.shadowBlur = 0;
      }
    };

    const lift = ANIMATION_DEFAULTS.lift * (layout.sc / 21);
    const shOff = [2 * (layout.sc / 21), 3 * (layout.sc / 21)];

    // PASS 1 — shadow (BG until colored in, ends at dim(c,0.30) mixed w/ BG)
    renderPass(
      (p) => {
        const u = clamp01(p.f / ANIMATION_DEFAULTS.animFrames);
        const e = this.settings.phraseAnim ? 1 - (1 - u) ** 3 : 1;
        return rgbMixToCss(mixRgb(bg, dimRgb(p.color, 0.3), e));
      },
      (p, e) => {
        const hover = (1 - e) * lift;
        return [p.x + cx + p.dx * (1 - e) + shOff[0], p.y + cy - hover + shOff[1]];
      },
      () => 0,
      0,
    );

    // PASS 2 — halo (one px bigger, dark, fades in with e²)
    renderPass(
      (p) => {
        const u = clamp01(p.f / ANIMATION_DEFAULTS.animFrames);
        const e = this.settings.phraseAnim ? 1 - (1 - u) ** 3 : 1;
        return rgbMixToCss(mixRgb(bg, dimRgb(p.color, 0.2), e * e));
      },
      (p, e) => {
        const hover = (1 - e) * lift;
        return [p.x + cx + p.dx * (1 - e), p.y + cy - hover];
      },
      () => 0,
      1,
    );

    // PASS 3 — main text with light-flash + shimmer + bloom
    const now = ts;
    renderPass(
      (p) => {
        if (this.done && p.shimmerUntil > now) return p.flashHex; // shimmer highlight
        if (!this.settings.phraseAnim || p.f >= ANIMATION_DEFAULTS.animFrames) {
          // subtle post-completion breathing keeps it alive
          return p.hex;
        }
        const u = clamp01(p.f / ANIMATION_DEFAULTS.animFrames);
        const e = 1 - (1 - u) ** 3;
        const flash = 0.75 * Math.sin(Math.PI * clamp01((u - 0.55) / 0.45)) * style.flashBoost;
        const col = mixRgb(mixRgb(bg, p.color, Math.pow(e, 1.5)), palette.flash, flash);
        return rgbMixToCss(col);
      },
      (p, e) => {
        const hover = (1 - e) * lift;
        return [p.x + cx + p.dx * (1 - e), p.y + cy - hover];
      },
      (p, e) => {
        if (e < 1 && this.settings.phraseAnim) return 0;
        const edgeBoost = p.edge ? 1.6 : 1;
        const radGlow = 0.4 + 0.6 * p.rad;
        return glowPct * style.bloomBase * edgeBoost * radGlow;
      },
      0,
    );

    ctx.restore();

    // Completion sweep: a bright horizontal flash across the heart once done.
    if (this.done && !this.reducedMotion) {
      const since = now - this.finishedAt;
      if (since < 900) {
        const k = since / 900;
        const g = ctx.createLinearGradient(cx - layout.sc * 20, 0, cx + layout.sc * 20, 0);
        const pos = -0.3 + 1.6 * k;
        g.addColorStop(clamp01(pos - 0.12), 'rgba(255,255,255,0)');
        g.addColorStop(clamp01(pos), rgba(palette.flash, 0.16 * Math.sin(Math.PI * k)));
        g.addColorStop(clamp01(pos + 0.12), 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - layout.sc * 20, cy - layout.sc * 19, layout.sc * 40, layout.sc * 38);
      }
    }

    // Sparks (click surprise).
    if (this.sparks.length) {
      for (const s of this.sparks) {
        const a = 1 - s.life / s.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.hue;
        ctx.shadowColor = s.hue;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }
}

/** Items are drawn only once spawned; use their progress counter as marker. */
function pIndexSpawned(p: RuntimePhrase): boolean {
  return p.f > 0;
}

function rgbMixToCss(c: [number, number, number]): string {
  const q = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${q(c[0])},${q(c[1])},${q(c[2])})`;
}

function withAlpha(color: string, mul: number): string {
  // color is an rgba(...) string from config palettes
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const parts = m[1].split(',').map((s) => parseFloat(s));
  const a = (parts[3] ?? 1) * mul;
  return `rgba(${parts[0]},${parts[1]},${parts[2]},${a.toFixed(3)})`;
}

// small helper typing shim so settings can carry a seed offset
declare module '@/config/types' {
  interface EngineSettings {
    seedOffset?: number;
  }
}
