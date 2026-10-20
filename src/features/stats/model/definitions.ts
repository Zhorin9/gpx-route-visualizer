import { formatDistance, formatGain, formatHeight, formatSpeed } from '../../../core/units'
import { formatDuration } from '../../../utils/format'
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
  // Caption above the value in the column, grid and hero arrangements.
  caption: string
  // Data the stat cannot be computed without; the panel greys it out when the file lacks it.
  requires?: 'time' | 'elevation'
  // Null when there is nothing to show (no data, no label).
  chip: (ctx: StatsContext) => StatChip | null
}

type OverridableKey = keyof StatsContent['overrides']

interface NumericStat {
  key: OverridableKey
  label: string
  caption: string
  requires?: StatDefinition['requires']
  // Null = the track has no data for it.
  compute: (stats: RangeStats) => number | null
  format: (value: number, content: StatsContent) => string
}

// A figure from the track, unless the user typed their own value.
function numericStat({ key, label, caption, requires, compute, format }: NumericStat): StatDefinition {
  return {
    key,
    label,
    caption,
    requires,
    chip: ({ stats, content }) => {
      const override = content.overrides[key]
      const value = compute(stats)
      if (!override && value == null) return null
      const text = override || format(value as number, content)
      return { key, label: caption, text, value: text }
    },
  }
}

const day: StatDefinition = {
  key: 'day',
  label: 'Etykieta dnia',
  caption: 'Dzień',
  chip: ({ content }) =>
    content.dayLabel
      ? { key: 'day', text: content.dayLabel, label: 'Dzień', value: content.dayLabel.replace(/^\s*dzie[ńn]\s*/i, '') || content.dayLabel }
      : null,
}

const distance = numericStat({
  key: 'distance',
  label: 'Dystans',
  caption: 'Dystans',
  compute: (s) => s.distanceKm,
  format: (km, c) => formatDistance(km, c.units, c.distancePrecision),
})

const elevation = numericStat({
  key: 'elevation',
  label: 'Przewyższenie',
  caption: 'Wznios',
  compute: (s) => s.elevationGainM,
  format: (m, c) => formatGain(m, c.units, c.elevationRoundTo),
})

const time = numericStat({
  key: 'time',
  label: 'Czas całkowity',
  caption: 'Czas',
  requires: 'time',
  compute: (s) => (s.durationMs > 0 ? s.durationMs : null),
  format: (ms) => formatDuration(ms),
})

const movingTime = numericStat({
  key: 'movingTime',
  label: 'Czas w ruchu',
  caption: 'W ruchu',
  requires: 'time',
  compute: (s) => (s.movingMs > 0 ? s.movingMs : null),
  format: (ms) => formatDuration(ms),
})

// Over the moving time, as sports apps do; elapsed time would count the stops.
const avgSpeed = numericStat({
  key: 'avgSpeed',
  label: 'Średnia prędkość',
  caption: 'Śr. prędkość',
  requires: 'time',
  compute: (s) => (s.movingMs > 0 ? s.distanceKm / (s.movingMs / 3_600_000) : null),
  format: (kmh, c) => formatSpeed(kmh, c.units),
})

const maxElevation = numericStat({
  key: 'maxElevation',
  label: 'Najwyższy punkt',
  caption: 'Max wys.',
  requires: 'elevation',
  compute: (s) => s.maxElevationM,
  format: (m, c) => formatHeight(m, c.units, c.elevationRoundTo),
})

export const STAT_DEFINITIONS: readonly StatDefinition[] = [day, distance, elevation, time, movingTime, avgSpeed, maxElevation]

export function statDefinition(key: StatKey): StatDefinition | undefined {
  return STAT_DEFINITIONS.find((d) => d.key === key)
}

// Visible chips in the user's order.
export function buildChips(ctx: StatsContext): StatChip[] {
  return ctx.content.order
    .filter((key) => ctx.content.visible[key])
    .map((key) => statDefinition(key)?.chip(ctx) ?? null)
    .filter((c): c is StatChip => c !== null)
}
