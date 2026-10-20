import { columnsArrangement, gridArrangement, heroArrangement, rowArrangement, type StatsArrangementStrategy } from './arrangements'
import type { StatsArrangement } from '../../../types'

// Panel order; the first one is the fallback for unknown ids (old saved data).
export const STATS_ARRANGEMENTS: readonly StatsArrangementStrategy[] = [columnsArrangement, rowArrangement, gridArrangement, heroArrangement]

export function arrangementFor(id: StatsArrangement): StatsArrangementStrategy {
  return STATS_ARRANGEMENTS.find((a) => a.id === id) ?? STATS_ARRANGEMENTS[0]
}
