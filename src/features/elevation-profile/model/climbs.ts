export interface Climb {
  startIdx: number
  endIdx: number
  gainM: number
  lengthKm: number
  // Average gradient in percent.
  avgGrade: number
}

export interface ClimbThresholds {
  minGainM: number
  minGradePct: number
}

export const DEFAULT_CLIMB_THRESHOLDS: ClimbThresholds = { minGainM: 30, minGradePct: 3 }

// A climb survives a dip of this much (or a tenth of what it has gained so far, if more):
// a short descent in the middle of a pass doesn't split it in two.
const DIP_TOLERANCE_M = 10
const DIP_SHARE = 0.1
// A climb starts where the road actually tilts up: a long gentle approach is cut off.
const LEAD_KM = 0.3
const LEAD_GRADE_PCT = 2

function trimApproach(ele: ArrayLike<number>, cumKm: ArrayLike<number>, start: number, peak: number): number {
  let s = start
  let j = start
  while (s < peak) {
    while (j < peak && cumKm[j] - cumKm[s] < LEAD_KM) j++
    const km = cumKm[j] - cumKm[s]
    if (km <= 0 || (ele[j] - ele[s]) / (km * 10) >= LEAD_GRADE_PCT) break
    s++
  }
  return s
}

// Climbs in [from, to] of a smoothed elevation series, low point to summit.
export function detectClimbs(
  ele: ArrayLike<number>,
  cumKm: ArrayLike<number>,
  from: number,
  to: number,
  { minGainM, minGradePct }: ClimbThresholds = DEFAULT_CLIMB_THRESHOLDS,
): Climb[] {
  const climbs: Climb[] = []
  const finish = (low: number, peak: number) => {
    const start = trimApproach(ele, cumKm, low, peak)
    const gainM = ele[peak] - ele[start]
    const lengthKm = cumKm[peak] - cumKm[start]
    if (lengthKm <= 0) return
    const avgGrade = gainM / (lengthKm * 10)
    if (gainM >= minGainM && avgGrade >= minGradePct) climbs.push({ startIdx: start, endIdx: peak, gainM, lengthKm, avgGrade })
  }

  let low = from
  let start = -1
  let peak = -1
  for (let i = from; i <= to; i++) {
    const e = ele[i]
    if (!Number.isFinite(e)) continue
    if (start < 0) {
      if (e <= ele[low]) low = i
      else if (e - ele[low] >= DIP_TOLERANCE_M) {
        start = low
        peak = i
      }
      continue
    }
    if (e >= ele[peak]) {
      peak = i
    } else if (ele[peak] - e >= Math.max(DIP_TOLERANCE_M, (ele[peak] - ele[start]) * DIP_SHARE)) {
      finish(start, peak)
      start = -1
      low = i
    }
  }
  if (start >= 0) finish(start, peak)
  return climbs
}
