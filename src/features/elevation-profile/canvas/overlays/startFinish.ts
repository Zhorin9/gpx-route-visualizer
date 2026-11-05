import type { ProfileOverlay } from '.'
import { firstAndLastDrawn, pointDot } from './items'

export const startFinish: ProfileOverlay = {
  isOn: (settings) => settings.startFinish,
  build: (chart) => {
    const drawn = firstAndLastDrawn(chart.values)
    if (!drawn) return []
    return [pointDot(chart, 'start', drawn[0], 5), pointDot(chart, 'finish', drawn[1], 5)]
  },
}
