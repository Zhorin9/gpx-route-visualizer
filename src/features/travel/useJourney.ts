import { useAppStore } from '../../store/useAppStore'
import { memoOne } from '../../utils/memo'
import { journeyOf } from './model/journey'
import type { TrackPart } from '../../types'

const NO_PARTS: TrackPart[] = []
const journeyFor = memoOne(journeyOf)

export function useJourney() {
  const parts = useAppStore((s) => s.routeSource?.parts ?? NO_PARTS)
  const draft = useAppStore((s) => s.draftStop)
  return journeyFor(parts, draft)
}
