import { formatDuration, formatElevation, formatKm } from '../../../utils/format'
import type { RangeStats, StatChip, StatKey, StatsContent } from '../../../types'

// Only what a stat needs to produce its chip: no access to the rest of the store.
export interface StatsContext {
  stats: RangeStats
  content: StatsContent
}

export interface StatDefinition {
  key: StatKey
  // Name in the panel list.
  label: string
  // Null when there is nothing to show (no data, no label).
  chip: (ctx: StatsContext) => StatChip | null
}

type OverridableKey = keyof StatsContent['overrides']

interface NumericStat {
  key: OverridableKey
  label: string
  // Null = the track has no data for it.
  compute: (stats: RangeStats) => number | null
  format: (value: number, content: StatsContent) => string
}

// A figure from the track, unless the user typed their own value.
function numericStat({ key, label, compute, format }: NumericStat): StatDefinition {
  return {
    key,
    label,
    chip: ({ stats, content }) => {
      const override = content.overrides[key]
      const value = compute(stats)
      if (!override && value == null) return null
      const text = override || format(value as number, content)
      return { key, label, text, value: text }
    },
  }
}

const day: StatDefinition = {
  key: 'day',
  label: 'Etykieta dnia',
  chip: ({ content }) =>
    content.dayLabel
      ? { key: 'day', text: content.dayLabel, label: 'Dzień', value: content.dayLabel.replace(/^\s*dzie[ńn]\s*/i, '') || content.dayLabel }
      : null,
}

const distance = numericStat({
  key: 'distance',
  label: 'Dystans',
  compute: (s) => s.distanceKm,
  format: (km, c) => formatKm(km, c.distancePrecision),
})

const elevation = numericStat({
  key: 'elevation',
  label: 'Wznios',
  compute: (s) => s.elevationGainM,
  format: (m, c) => formatElevation(m, c.elevationRoundTo),
})

const time = numericStat({
  key: 'time',
  label: 'Czas',
  compute: (s) => (s.durationMs > 0 ? s.durationMs : null),
  format: (ms) => formatDuration(ms),
})

export const STAT_DEFINITIONS: readonly StatDefinition[] = [day, distance, elevation, time]

export function statDefinition(key: StatKey): StatDefinition | undefined {
  return STAT_DEFINITIONS.find((d) => d.key === key)
}

// Visible chips in display order.
export function buildChips(ctx: StatsContext): StatChip[] {
  return STAT_DEFINITIONS.filter((d) => ctx.content.visible[d.key])
    .map((d) => d.chip(ctx))
    .filter((c): c is StatChip => c !== null)
}
