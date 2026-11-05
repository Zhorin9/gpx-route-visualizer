import { formatGain } from '../../../../core/units'
import type { ProfileOverlay } from '.'
import { labelOverPoint } from './items'

const MAX_CLIMB_LABELS = 3

export const climbLabels: ProfileOverlay = {
  isOn: (settings) => settings.climbLabels && settings.highlightClimbs,
  band: 'above',
  build: (chart, labels) =>
    chart.data.climbs
      .map((climb, i) => ({ climb, summit: chart.climbCols[i][1] }))
      .sort((a, b) => b.climb.gainM - a.climb.gainM)
      .slice(0, MAX_CLIMB_LABELS)
      .flatMap(({ climb, summit }) => labelOverPoint(chart, labels, `climb${climb.startIdx}`, formatGain(climb.gainM, chart.units, 5), summit, chart.labelSize * 0.85)),
}
