import { dataSeries } from '../../core/data/sources'
import { useRouteHead } from '../../core/route/providers'
import { useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { posAtDistance } from '../../utils/geometry'
import { elevationGain } from '../../utils/gpx'
import { memoOne } from '../../utils/memo'
import { detectClimbs, type Climb } from './model/climbs'
import { sampleByDistance, type ProfileSamples } from './model/profile'
import type { GpxTrack, RouteDay, RouteRange } from '../../types'

export interface ProfileData {
  samples: ProfileSamples
  climbs: Climb[]
  gainM: number
  range: RouteRange
  cumKm: Float64Array
}

const profileData = memoOne(
  (track: GpxTrack, cumKm: Float64Array, range: RouteRange, days: RouteDay[], columns: number): ProfileData => {
    const ele = dataSeries(track, cumKm, 'elevation')
    const hiddenDays = days.filter((d) => !d.visible)
    const hidden = hiddenDays.length ? (i: number) => hiddenDays.some((d) => i >= d.startIdx && i <= d.endIdx) : undefined
    return {
      samples: sampleByDistance(ele, cumKm, range.start, range.end, columns, hidden),
      climbs: detectClimbs(ele, cumKm, range.start, range.end),
      // The same figure as the stats header, so the two never disagree.
      gainM: elevationGain(track.points, range.start, range.end),
      range,
      cumKm,
    }
  },
)

export function useProfileData(columns: number): ProfileData | null {
  const track = useAppStore((s) => s.track)
  const range = useAppStore((s) => s.range)
  const days = useAppStore((s) => s.routeDays)
  const cumKm = useTrackCumKm()
  if (!track || !cumKm || range.end <= range.start) return null
  return profileData(track, cumKm, range, days, columns)
}

// Track position of the marker: the animation head while it plays, otherwise the panel slider.
export function useProfileMarkerPos(): number | null {
  const marker = useAppStore((s) => s.profile.marker)
  const markerAt = useAppStore((s) => s.profile.markerAt)
  const range = useAppStore((s) => s.range)
  const cumKm = useTrackCumKm()
  const head = useRouteHead()
  if (!cumKm || range.end <= range.start) return null
  if (head != null) return head
  if (!marker) return null
  const km = cumKm[range.start] + (cumKm[range.end] - cumKm[range.start]) * markerAt
  return posAtDistance(cumKm, range.start, range.end, km)
}
