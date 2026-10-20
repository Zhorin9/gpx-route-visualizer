import { useRangeStats } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { buildChips } from './model/definitions'
import type { StatChip } from '../../types'

export function useStatsChips(): StatChip[] {
  const stats = useRangeStats()
  const content = useAppStore((s) => s.statsContent)
  return stats ? buildChips({ stats, content }) : []
}
