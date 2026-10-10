/**
 * Deterministic PRNG that mirrors Python's `random.Random(11)` usage in
 * love.py: uniform(), choice() and shuffle(). A fixed seed keeps the heart
 * layout stable across replays, resizes and share links.
 */

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed || 1);
  }

  /** rng.random() */
  random(): number {
    return this.next();
  }

  /** rng.uniform(a, b) */
  uniform(a: number, b: number): number {
    return a + (b - a) * this.next();
  }

  /** rng.choice(seq) */
  choice<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** rng.shuffle(list) — Fisher-Yates, in place. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
