import type { Units } from '../../../core/units'
import { clamp } from '../../../utils/math'
import { distanceFraction } from '../model/profile'
import type { ProfileSettings } from '../types'
import type { ProfileData } from '../useProfile'
import { xAt, yAt, type ChartArea } from './chartPainters'
import { reservesBand } from './overlays'

const MIN_SPAN_M = 60

interface ChartInput {
  data: ProfileData
  settings: ProfileSettings
  width: number
  height: number
  colors: string | string[]
  units: Units
  measure: (text: string, size: number) => number
}

function heightScale({ min, max }: ProfileData['samples'], settings: ProfileSettings) {
  const span = Math.max(MIN_SPAN_M, max - min)
  const fromZero = settings.scale === 'zero'
  const floor = fromZero ? Math.min(0, min) : min - span * 0.08
  const high = fromZero ? Math.max(max * 1.1, floor + MIN_SPAN_M) : floor + span * 1.1
  const stretchedFloor = high - (high - floor) / settings.exaggeration
  return { low: stretchedFloor, high }
}

function chartArea(settings: ProfileSettings, width: number, height: number, labelSize: number): ChartArea {
  const top = reservesBand('above', settings) ? labelSize * 1.7 : 6
  const flush = settings.layout === 'overlay' ? 0 : 4
  const bottom = reservesBand('below', settings) ? labelSize * 1.6 : flush
  return { left: 0, top, width, height: Math.max(10, height - top - bottom) }
}

export type ProfileChart = ReturnType<typeof profileChart>

export function profileChart({ data, settings, width, height, colors, units, measure }: ChartInput) {
  const { values } = data.samples
  const { cumKm, range } = data
  const count = values.length
  const labelSize = clamp(Math.round(height * 0.1), 16, 28)
  const area = chartArea(settings, width, height, labelSize)
  const { low, high } = heightScale(data.samples, settings)
  const totalKm = cumKm[range.end] - cumKm[range.start]
  const colAtTrack = (pos: number) => distanceFraction(cumKm, range.start, range.end, pos) * (count - 1)
  return {
    data,
    values,
    count,
    width,
    height,
    area,
    low,
    high,
    labelSize,
    totalKm,
    climbCols: data.climbs.map((c): [number, number] => [Math.round(colAtTrack(c.startIdx)), Math.round(colAtTrack(c.endIdx))]),
    units,
    measure: (text: string, size = labelSize) => measure(text, size),
    x: (col: number) => xAt(area, count, col),
    y: (value: number) => yAt(area, low, high, value),
    colAtKm: (km: number) => (km / totalKm) * (count - 1),
    colAtTrack,
    colorAt: (col: number) => (typeof colors === 'string' ? colors : colors[col]),
  }
}

export const chartBottom = (chart: ProfileChart) => chart.area.top + chart.area.height
