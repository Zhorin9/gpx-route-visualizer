import { formatGain } from '../../../../core/units'
import type { ProfileOverlay } from '.'
import { text } from './items'

const GAP = 12

export const totalGain: ProfileOverlay = {
  isOn: (settings) => settings.showTotal,
  band: 'above',
  build: (chart, labels) => {
    const value = `↑ ${formatGain(chart.data.gainM, chart.units)}`
    labels.reserve(0, chart.measure(value) + GAP)
    return [text('total', value, 0, 0, chart.labelSize)]
  },
}
