import { clamp } from '../../../../utils/math'
import type { ProfileChart } from '../chart'
import { chartBottom } from '../chart'
import type { LabelPlacer } from '../labelPlacer'
import type { SceneItem } from '../scene'

const LABEL_MARGIN = 8

export const text = (key: string, value: string, x: number, y: number, size: number, opacity?: number): SceneItem => ({ kind: 'text', key, text: value, x, y, size, opacity })

export const pointDot = (chart: ProfileChart, key: string, col: number, radius: number): SceneItem => ({
  kind: 'dot',
  key,
  x: chart.x(col),
  y: Math.min(chartBottom(chart), chart.y(chart.values[col])),
  radius,
  fill: chart.colorAt(col),
})

export function labelOverPoint(chart: ProfileChart, labels: LabelPlacer, key: string, value: string, col: number, size: number): SceneItem[] {
  const width = chart.measure(value, size)
  const x = clamp(chart.x(col) - width / 2, 0, chart.width - width)
  if (!labels.isFree(x, width)) return []
  labels.reserve(x - LABEL_MARGIN, x + width + LABEL_MARGIN)
  const overPoint = chart.y(chart.values[col]) - size - 10
  const aboveChart = chart.area.top - size * 0.9
  return [text(key, value, x, Math.max(0, Math.min(overPoint, aboveChart)), size)]
}

export function firstAndLastDrawn(values: Float32Array): [number, number] | null {
  const first = values.findIndex(Number.isFinite)
  if (first < 0) return null
  return [first, values.length - 1 - [...values].reverse().findIndex(Number.isFinite)]
}
