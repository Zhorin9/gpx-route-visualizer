export interface ProfileSamples {
  // Evenly spaced along the distance of the range; NaN where the route is hidden (a hidden day).
  values: Float32Array
  // Track index each sample was taken at (fractional).
  positions: Float32Array
  min: number
  max: number
}

// Resamples a series by distance into `count` evenly spaced values: the chart's x axis is
// distance, whatever the spacing of the GPS points.
export function sampleByDistance(
  values: ArrayLike<number>,
  cumKm: ArrayLike<number>,
  from: number,
  to: number,
  count: number,
  hidden?: (index: number) => boolean,
): ProfileSamples {
  const out = new Float32Array(count)
  const positions = new Float32Array(count)
  const startKm = cumKm[from]
  const span = cumKm[to] - startKm
  let min = Infinity
  let max = -Infinity
  let i = from
  for (let c = 0; c < count; c++) {
    const target = startKm + (count === 1 ? 0 : (span * c) / (count - 1))
    while (i < to && cumKm[i + 1] < target) i++
    const next = Math.min(i + 1, to)
    const segment = cumKm[next] - cumKm[i]
    const t = segment > 0 ? Math.max(0, Math.min(1, (target - cumKm[i]) / segment)) : 0
    positions[c] = i + (next - i) * t
    if (hidden?.(t < 0.5 ? i : next)) {
      out[c] = NaN
      continue
    }
    const v = values[i] + (values[next] - values[i]) * t
    out[c] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  return { values: out, positions, min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 }
}

// Fraction (0-1) of the range's distance at a track position.
export function distanceFraction(cumKm: ArrayLike<number>, from: number, to: number, pos: number): number {
  const span = cumKm[to] - cumKm[from]
  if (span <= 0) return 0
  const i = Math.max(from, Math.min(to - 1, Math.floor(pos)))
  const km = cumKm[i] + (cumKm[i + 1] - cumKm[i]) * (pos - i)
  return Math.max(0, Math.min(1, (km - cumKm[from]) / span))
}
