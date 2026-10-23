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

// A per-point series read at each sample; NaN where the chart is hidden.
export function sampleAt(series: ArrayLike<number>, samples: ProfileSamples): Float32Array {
  return samples.positions.map((p, i) => (Number.isFinite(samples.values[i]) ? series[Math.round(p)] : NaN))
}

// Mean over ±radius samples, skipping hidden ones; hidden samples stay hidden.
export function smoothSamples(samples: ProfileSamples, radius: number): ProfileSamples {
  if (radius < 1) return samples
  const { values } = samples
  const out = new Float32Array(values.length)
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      out[i] = NaN
      continue
    }
    let sum = 0
    let n = 0
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      if (!Number.isFinite(values[j])) continue
      sum += values[j]
      n++
    }
    out[i] = sum / n
    min = Math.min(min, out[i])
    max = Math.max(max, out[i])
  }
  return { values: out, positions: samples.positions, min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 }
}

// Runs of consecutive samples that pass `keep`.
export function sampleRuns(count: number, keep: (i: number) => boolean): [number, number][] {
  const out: [number, number][] = []
  let start = -1
  for (let i = 0; i <= count; i++) {
    const ok = i < count && keep(i)
    if (ok && start < 0) start = i
    if (!ok && start >= 0) {
      out.push([start, i - 1])
      start = -1
    }
  }
  return out
}
