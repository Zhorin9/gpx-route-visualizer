import { formatDistance } from '../../../../core/units'
import { formatNumber } from '../../../../utils/format'
import type { ProfileChart } from '../chart'
import type { ProfileOverlay } from '.'
import { text } from './items'

function halfwayLabel(totalKm: number) {
  const half = totalKm / 2
  return half >= 10 ? formatNumber(Math.round(half), 0) : formatNumber(half, 1)
}

const centred = (chart: ProfileChart, value: string, size: number) => chart.width / 2 - chart.measure(value, size) / 2

export const distance: ProfileOverlay = {
  isOn: (settings) => settings.showDistance && settings.layout !== 'overlay',
  band: 'below',
  build: (chart, _labels, settings) => {
    const size = chart.labelSize * 0.85
    const y = chart.height - chart.labelSize
    const end = formatDistance(chart.totalKm, chart.units, 1)
    const items = [text('d0', formatDistance(0, chart.units, 0), 0, y, size, 0.8), text('d1', end, chart.width - chart.measure(end, size), y, size, 0.8)]
    if (!settings.grid) return items
    const mid = halfwayLabel(chart.totalKm)
    return [...items, text('dm', mid, centred(chart, mid, size), y, size, 0.8)]
  },
}
