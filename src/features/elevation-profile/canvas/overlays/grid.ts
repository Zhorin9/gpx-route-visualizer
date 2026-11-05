import { formatNumber } from '../../../../utils/format'
import { heightIn, heightUnit } from '../../../../core/units'
import { niceStep } from '../../../../utils/math'
import type { ProfileOverlay } from '.'
import { text } from './items'

export const grid: ProfileOverlay = {
  isOn: (settings) => settings.grid,
  build: (chart) => {
    const factor = heightIn(1, chart.units)
    const step = niceStep(((chart.high - chart.low) * factor) / 3)
    const size = chart.labelSize * 0.7
    const items = []
    for (let v = Math.ceil((chart.low * factor) / step) * step; v < chart.high * factor; v += step) {
      const y = chart.y(v / factor)
      items.push({ kind: 'line' as const, key: `g${v}`, points: [0, y, chart.width, y], width: 1, opacity: 0.25 })
      items.push(text(`gl${v}`, `${formatNumber(v || 0)} ${heightUnit(chart.units)}`, 4, y - size - 2, size, 0.7))
    }
    return items
  },
}
