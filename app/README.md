# ❤ A Thousand Ways to Say I Love You

A premium, interactive romantic website — a faithful web port of the original
`love.py` Tkinter animation. A glowing crimson heart is woven from “I love
you” in **20 languages**, animates into place phrase by phrase, then shimmers
forever. Personalize it with your names and message, tune the motion, share a
link, or save it as an image.

Built with **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Framer
Motion + Lucide** — rendered entirely on HTML5 Canvas in the browser (no
Python server needed). Deployable to Vercel as-is.

---

## Quick start (how to run)

Requirements: **Node.js 18.18+ (20+ recommended)**.

```bash
cd app
npm install        # first time only
npm run dev        # development server → http://localhost:3000
```

Open **http://localhost:3000**, click **“Open My Heart”**, and enjoy.

### Production build

```bash
npm run build      # optimized static build
npm run start      # serve the production build locally
```

### Lint / type-check

```bash
npm run lint
npx tsc --noEmit
```

### Deploy to Vercel

1. Push this repository to GitHub/GitLab.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Set **Root Directory** to `app` (that's where `package.json` lives).
4. Accept the defaults (framework preset: Next.js) and deploy. No environment
   variables or secrets are required — everything runs client-side.

CLI alternative: `npm i -g vercel && cd app && vercel --prod`

---

## The experience

- **Intro screen** — “Open My Heart” gate with a beating heart glyph; the
  finished heart is previewed statically behind it (no black canvas).
- **Heart animation** — phrases spawn outside-in along the parametric heart
  curve, float up from below with a light-flash, then settle. Progress bar at
  the top during formation.
- **Shimmer** — after completion, random phrases glimmer continuously
  (exactly like the original), plus a one-time light sweep across the heart.
- **Click the heart** — spark burst + gentle heartbeat pulse surprise.
- **Love letter** — your recipient/message/signature appear elegantly beneath
  the heart once it completes.
- **Completion card** — “Make another version”, Save as PNG, copy romantic
  message, copy share link.

### Control dock (all fully functional)

Play/Pause · Replay · Ambient sound (Web-Audio-generated pad, off by default,
user-initiated) · Fullscreen · Settings drawer with:

| Control | What it does |
|---|---|
| Animation speed slider | 0.25×–3× live tempo of spawn + shimmer |
| Heart size slider | 50%–160% — relayouts the heart (debounced) |
| Glow intensity slider | ambient bloom + halo strength |
| Particles toggle | floating background hearts |
| Phrase animation toggle | instant placement vs. floating entrance |
| Visual style | Classic / Neon / Soft (bloom, flash & shimmer tuning) |
| Color palette | Crimson (original), Rose Gold, Midnight Ruby, Ember |
| Reset defaults | restores every setting |

### Personalization panel

Recipient name, signature, love message (with character limits), per-language
on/off chips for all 20 languages, custom phrases (up to 12, validated, with
error states), share-link copying (`?h=` encoded settings) and native Web
Share where available. Everything persists to `localStorage`.

---

## Architecture

```
app/
├── src/
│   ├── engine/               # animation core — framework-agnostic
│   │   ├── layout.ts         # HeartAnimationEngine (geometry half):
│   │   │                   #   parametric heart x=16sin³t, y=13cost−… ,
│   │   │                   #   scanline spans, greedy phrase packing,
│   │   │                   #   wine→crimson→blood radial color grading,
│   │   │                   #   outside-in angular spawn ordering
│   │   └── renderer.ts       # runtime half: rAF loop, 3-pass layered draw
│   │                   #   (shadow/halo/main), lift+flash entrance, shimmer,
│   │                   #   completion sweep, sparks, PNG export
│   ├── config/               # centralized data & types
│   │   ├── phrases.ts        # the 20 original languages (add more here)
│   │   ├── palettes.ts       # color themes (Crimson = exact love.py colors)
│   │   ├── defaults.ts       # ANIM/LIFT/GAP/SIZES/DURATION ported constants
│   │   └── types.ts          # shared TypeScript interfaces
│   ├── lib/                  # rng (seeded, mirrors random.Random(11)),
│   │                   # color math (mix/dim/hx ports), share-link codec
│   ├── context/SettingsProvider.tsx  # global settings, persistence, reset
│   ├── hooks/                # media query, resize, debounce, fullscreen,
│   │                   # clipboard, Web-Audio ambient pad
│   └── components/
│       ├── Experience.tsx    # phase orchestration (intro→animating→complete)
│       ├── HeartCanvas.tsx   # mounts the renderer, syncs settings
│       ├── IntroScreen.tsx · AnimationControls.tsx · CustomizationPanel.tsx
│       ├── LoveLetter.tsx · CompletionScreen.tsx · AmbientBackground.tsx
│       └── ui/               # GlassCard, Slider, Toggle (Uiverse-inspired)
```

Design references honored: **ReactBits** (pointer-parallax ambient glow,
starfield, floating hearts, springy state transitions), **Uiverse** (glass
dock, glowing sliders, spring toggles, conic-gradient palette swatches),
**Dribbble** (serif/sans pairing, dark cinematic composition, generous
negative space).

## Accessibility & performance

- `prefers-reduced-motion`: shimmer/particles/pulse disabled, still frames used.
- Keyboard: Tab through all controls, Space toggles play/pause, Esc closes
  dialogs, focus-visible rings everywhere, labeled icon buttons, ARIA
  roles/progress on dialogs & progressbar.
- One `requestAnimationFrame` loop, zero React re-renders per frame; DPR-aware
  canvas (capped at 2.5×); text metrics cached; layout debounced; loop pauses
  when the tab is hidden; listeners/timers/AudioContext cleaned up on unmount.
- Responsive: full-viewport heart scales to any window; bottom-sheet
  customization + compact dock on mobile; safe-area insets respected.

## Extending

- **New language**: add one entry to `src/config/phrases.ts`.
- **New theme**: add a `Palette` object to `src/config/palettes.ts`.
- **New visual style**: extend `VisualStyleId` + `STYLE_PARAMS`.
- **New heart shape**: swap `heartPoint()` in `layout.ts` — packing, coloring
  and animation all consume whatever polygon you give them.

## Original source

`love.py` (repo root) is kept untouched as reference. Its constants map 1:1:
`BG/wine/crimson/blood/FLASH → palettes.ts`, `DURATION/ANIM/LIFT/GAP/SIZES →
defaults.ts`, `rng = Random(11) → lib/rng.ts (seed 11)`.
