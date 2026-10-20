/** Deterministic PRNG (mulberry32) so the sandbox looks the same twice. */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    chance: (p: number) => next() < p,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: readonly T[]): T[] => {
      const out = arr.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    /** Roughly normal around mean with the given spread, clamped. */
    normal: (mean: number, spread: number, min: number, max: number) => {
      const u = (next() + next() + next() + next() - 2) / 2
      return Math.max(min, Math.min(max, mean + u * spread * 2))
    },
  }
}
export type Rng = ReturnType<typeof createRng>
