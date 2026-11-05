import type { ProfileSettings } from '../../types'
import type { ProfileChart } from '../chart'
import { createLabelPlacer, type LabelPlacer } from '../labelPlacer'
import type { SceneItem } from '../scene'
import { climbLabels } from './climbLabels'
import { distance } from './distance'
import { grid } from './grid'
import { kmTicks } from './kmTicks'
import { minMax } from './minMax'
import { peak } from './peak'
import { startFinish } from './startFinish'
import { totalGain } from './totalGain'

export interface ProfileOverlay {
  isOn: (settings: ProfileSettings) => boolean
  band?: 'above' | 'below'
  build: (chart: ProfileChart, labels: LabelPlacer, settings: ProfileSettings) => SceneItem[]
}

const PLACED_FIRST_TO_LAST: ProfileOverlay[] = [grid, kmTicks, totalGain, minMax, peak, startFinish, climbLabels, distance]

export const reservesBand = (band: ProfileOverlay['band'], settings: ProfileSettings) => PLACED_FIRST_TO_LAST.some((o) => o.band === band && o.isOn(settings))

export function buildOverlays(chart: ProfileChart, settings: ProfileSettings): SceneItem[] {
  const labels = createLabelPlacer()
  return PLACED_FIRST_TO_LAST.filter((o) => o.isOn(settings)).flatMap((o) => o.build(chart, labels, settings))
}
