export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const clamp01 = (value: number) => clamp(value, 0, 1)

// mulberry32: the same numbers for the same seed, so drawn wear and tremble repeat exactly.
export function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function niceStep(rough: number) {
  const power = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 5, 10].map((m) => m * power).find((step) => step >= rough) ?? power * 10
}
