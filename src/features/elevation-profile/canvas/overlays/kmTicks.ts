import { distanceToKm } from '../../../../core/units'
import { chartBottom } from '../chart'
import type { SceneItem } from '../scene'
import type { ProfileOverlay } from '.'

const TICK_EVERY = 10
const TICK_LENGTH = 10

export const kmTicks: ProfileOverlay = {
  isOn: (settings) => settings.kmTicks,
  build: (chart) => {
    const step = distanceToKm(TICK_EVERY, chart.units)
    const bottom = chartBottom(chart)
    const items: SceneItem[] = []
    for (let km = step; km < chart.totalKm - step * 0.3; km += step) {
      const x = chart.x(chart.colAtKm(km))
      items.push({ kind: 'line', key: `t${km}`, points: [x, bottom, x, bottom - TICK_LENGTH], width: 2, opacity: 0.7 })
    }
    return items
  },
}
