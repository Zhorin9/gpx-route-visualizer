// GPS data is noisy point to point; everything coloured or charted is averaged over a
// stretch of road (or time) first. Points are not evenly spaced, so windows are measured
// in metres or seconds, never in point counts.

// Mean of `values` within ±halfWindow of each point along `axis` (cumulative km or ms).
// NaN values are skipped; a point with no valid neighbour stays NaN.
export function windowMean(values: ArrayLike<number>, axis: ArrayLike<number>, halfWindow: number): Float32Array {
  const n = values.length
  const out = new Float32Array(n)
  let lo = 0
  let hi = 0
  let sum = 0
  let count = 0
  for (let i = 0; i < n; i++) {
    while (hi < n && axis[hi] <= axis[i] + halfWindow) {
      if (!Number.isNaN(values[hi])) {
        sum += values[hi]
        count++
      }
      hi++
    }
    while (axis[lo] < axis[i] - halfWindow) {
      if (!Number.isNaN(values[lo])) {
        sum -= values[lo]
        count--
      }
      lo++
    }
    out[i] = count > 0 ? sum / count : NaN
  }
  return out
}

// Change of `values` per unit of `axis`, measured across ±halfWindow so single noisy
// points don't produce spikes. NaN where the window has no length.
export function windowSlope(values: ArrayLike<number>, axis: ArrayLike<number>, halfWindow: number): Float32Array {
  const n = values.length
  const out = new Float32Array(n)
  let lo = 0
  let hi = 0
  for (let i = 0; i < n; i++) {
    while (lo < i && axis[lo] < axis[i] - halfWindow) lo++
    while (hi < n - 1 && axis[hi] < axis[i] + halfWindow) hi++
    // Keep the window on both sides when the track allows it.
    const a = lo > 0 && axis[i] - axis[lo] < halfWindow ? lo - 1 : lo
    const span = axis[hi] - axis[a]
    out[i] = span > 0 ? (values[hi] - values[a]) / span : NaN
  }
  return out
}

// Value at the given percentile (0-100) of the finite values, for colour ranges that a
// single GPS glitch can't stretch.
export function percentile(values: ArrayLike<number>, p: number, from = 0, to = values.length - 1): number {
  const sorted: number[] = []
  for (let i = from; i <= to; i++) if (Number.isFinite(values[i])) sorted.push(values[i])
  if (!sorted.length) return NaN
  sorted.sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
  return sorted[idx]
}
