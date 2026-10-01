import { useAppStore } from '../store/useAppStore'
import { useTrackCumKm } from '../store/selectors'
import { formatClock, formatNumber } from '../utils/format'

// Human-readable description of a point index — "12,4 km · 09:35" — for range sliders.
export default function useRouteRange() {
  const track = useAppStore((s) => s.track)
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
