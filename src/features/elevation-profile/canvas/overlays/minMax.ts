import { formatHeight } from '../../../../core/units'
import { chartBottom } from '../chart'
import type { ProfileOverlay } from '.'
import { text } from './items'

const GAP = 12

export const minMax: ProfileOverlay = {
  isOn: (settings) => settings.showMinMax,
  band: 'above',
  build: (chart, labels) => {
    const { min, max } = chart.data.samples
    const highest = `max ${formatHeight(max, chart.units)}`
    const lowest = `min ${formatHeight(min, chart.units)}`
    const highestX = chart.width - chart.measure(highest)
    const lowestSize = chart.labelSize * 0.8
    labels.reserve(highestX - GAP, chart.width)
    return [
      text('max', highest, highestX, 0, chart.labelSize, 0.85),
      text('min', lowest, chart.width - chart.measure(lowest, lowestSize), chartBottom(chart) - lowestSize - 4, lowestSize, 0.75),
    ]
  },
}
