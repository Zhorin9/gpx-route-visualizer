import { useTranslation } from 'react-i18next'
import { useCountHead } from '../../core/animation/layers'
import { rangeStats, selectRouteParts, selectTrack } from '../../store/derived'
import { useDayBreaks } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { buildChips } from './model/definitions'
import type { StatChip } from '../../types'

export function useStatsChips(): StatChip[] {
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const breaks = useDayBreaks()
  const parts = useAppStore(selectRouteParts)
  const content = useAppStore((s) => s.statsContent)
  // While the line is drawn, the figures count up with it.
  const head = useCountHead()
  // Captions are drawn in the current language.
  useTranslation()
  const end = head != null ? Math.max(range.start, Math.floor(head)) : range.end
  const stats = rangeStats(track, end === range.end ? range : { start: range.start, end }, breaks, parts)
  return stats ? buildChips({ stats, content }) : []
}
