import { useAppStore } from '../store/useAppStore'
import { useTrackCumKm } from '../store/selectors'
import { formatClock, formatNumber } from '../utils/format'
import { selectTrack } from '../store/derived'

export default function useRouteRange() {
  const track = useAppStore(selectTrack)
  const cum = useTrackCumKm()

  const lastIndex = track ? track.points.length - 1 : 0

  function describe(index: number): string {
    if (!track || !cum) return ''
    const km = `${formatNumber(cum[index] ?? 0, 1)} km`
    const time = track.points[index]?.time
    return time != null ? `${km} · ${formatClock(time)}` : km
  }

  return { lastIndex, describe }
}
