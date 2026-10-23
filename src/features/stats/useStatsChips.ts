import { useCountHead } from '../../core/animation/layers'
import { rangeStats, selectRouteParts, selectTrack } from '../../store/derived'
import { useDayBreaks, useRangeStats } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { buildChips } from './model/definitions'
import type { StatChip } from '../../types'

export function useStatsChips(): StatChip[] {
  const full = useRangeStats()
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const breaks = useDayBreaks()
  const parts = useAppStore(selectRouteParts)
  const content = useAppStore((s) => s.statsContent)
  // While the line is drawn, the figures count up with it.
  const head = useCountHead()
  const stats = head != null && full ? rangeStats(track, { start: range.start, end: Math.max(range.start, Math.floor(head)) }, breaks, parts) : full
  return stats ? buildChips({ stats, content }) : []
}
