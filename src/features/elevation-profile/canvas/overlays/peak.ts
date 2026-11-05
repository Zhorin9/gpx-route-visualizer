import { formatHeight } from '../../../../core/units'
import type { ProfileOverlay } from '.'
import { firstAndLastDrawn, labelOverPoint, pointDot } from './items'

function highestCol(values: Float32Array, from: number) {
  return values.reduce((best, v, i) => (v > values[best] ? i : best), from)
}

export const peak: ProfileOverlay = {
  isOn: (settings) => settings.peak,
  band: 'above',
  build: (chart, labels) => {
    const drawn = firstAndLastDrawn(chart.values)
    if (!drawn) return []
    const col = highestCol(chart.values, drawn[0])
    return [...labelOverPoint(chart, labels, 'peak', formatHeight(chart.values[col], chart.units), col, chart.labelSize * 0.85), pointDot(chart, 'peakDot', col, 6)]
  },
}
