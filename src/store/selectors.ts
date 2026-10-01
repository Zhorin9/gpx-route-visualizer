import { formatDuration, formatElevation, formatKm } from '../utils/format'
import { projectTrack, rangeStats, routeLines, trackCumKm, trackDays } from './derived'
import { useAppStore } from './useAppStore'
import type { StatChip } from '../types'

export function useProjectedTrack() {
  const track = useAppStore((s) => s.track)
  const aspectKey = useAppStore((s) => s.aspectKey)
  return projectTrack(track, aspectKey)
}

export function useTrackCumKm() {
  return trackCumKm(useAppStore((s) => s.track))
}

export function useTrackDays() {
  return trackDays(useAppStore((s) => s.track))
}

export function useRouteLines() {
  const projected = useProjectedTrack()
  const cum = useTrackCumKm()
  const range = useAppStore((s) => s.range)
  const progress = useAppStore((s) => s.progress)
  return routeLines(projected, cum, range, progress)
}

export function useRangeStats() {
  const track = useAppStore((s) => s.track)
  const range = useAppStore((s) => s.range)
  return rangeStats(track, range)
}

export function useStatsChips(): StatChip[] {
  const stats = useRangeStats()
  const content = useAppStore((s) => s.statsContent)
  if (!stats) return []
  const { visible, overrides } = content
  const chips: (StatChip | null)[] = [
    visible.day && content.dayLabel ? { key: 'day', text: content.dayLabel } : null,
    visible.distance ? { key: 'distance', text: overrides.distance || formatKm(stats.distanceKm, content.distancePrecision) } : null,
    visible.elevation
      ? { key: 'elevation', text: overrides.elevation || formatElevation(stats.elevationGainM, content.elevationRoundTo) }
      : null,
    visible.time && (overrides.time || stats.durationMs > 0)
      ? { key: 'time', text: overrides.time || formatDuration(stats.durationMs) }
      : null,
  ]
  return chips.filter((c): c is StatChip => c !== null)
}

export function useHasRoute() {
  return useAppStore((s) => s.track !== null)
}
