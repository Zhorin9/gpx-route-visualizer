import type { CameraView } from '../../core/route/view'
import { selectRouteParts, selectTrack } from '../../store/derived'
import { useDayBreaks, useProjectedTrack, useRouteBox, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { applyTransform, pointAt, posAtDistance } from '../../utils/geometry'
import { memoOne } from '../../utils/memo'
import { clamp01 } from '../../utils/math'
import { useAnimationTime } from '../animation/hooks'
import { headFor } from '../animation/model/pacing'
import { tripSchedule } from '../animation/model/schedule'
import { clipProgress, selectDuration } from '../animation/model/timeline'
import type { RouteRange, RouteTransform } from '../../types'
import { cameraFor, type Bounds } from './model/camera'

const boundsOf = memoOne((projected: ArrayLike<number>, range: RouteRange, transform: RouteTransform): Bounds => {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (let i = range.start; i <= range.end; i++) {
    const p = applyTransform(pointAt(projected, i), transform)
    b.minX = Math.min(b.minX, p.x)
    b.minY = Math.min(b.minY, p.y)
    b.maxX = Math.max(b.maxX, p.x)
    b.maxY = Math.max(b.maxY, p.y)
  }
  return b
})

function kmAt(cumKm: Float64Array, pos: number): number {
  const i = Math.floor(pos)
  return i + 1 < cumKm.length ? cumKm[i] + (cumKm[i + 1] - cumKm[i]) * (pos - i) : cumKm[i]
}

// Also null in a carousel, where the route crosses slide borders.
export function useCameraView(): CameraView | null {
  const settings = useAppStore((s) => s.camera)
  const animation = useAppStore((s) => s.animation)
  const total = useAppStore(selectDuration)
  const carousel = useAppStore((s) => s.slides.length > 1)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const transform = useAppStore((s) => s.routeTransform)
  const t = useAnimationTime()
  const projected = useProjectedTrack()
  const cumKm = useTrackCumKm()
  const breaks = useDayBreaks()
  const [boxW, boxH] = useRouteBox()
  const schedule = tripSchedule(useAppStore(selectRouteParts))
  if (settings.mode === 'static' || t == null || carousel || !track || !projected || !cumKm || range.end <= range.start) return null

  const ctx = { track, cumKm, range, breaks, schedule }
  const clip = animation.clips.route
  const progress = clipProgress(clip, t)
  const from = cumKm[range.start]
  const length = cumKm[range.end] - from || 1
  const end = clip.start + clip.duration
  return cameraFor(settings.mode).viewAt({
    progress,
    headAt: (p) => applyTransform(pointAt(projected, headFor(animation.pacing, p, ctx)), transform),
    pathAt: (share) => applyTransform(pointAt(projected, posAtDistance(cumKm, range.start, range.end, from + length * share)), transform),
    headShare: (kmAt(cumKm, headFor(animation.pacing, progress, ctx)) - from) / length,
    bounds: boundsOf(projected, range, transform),
    area: { width: boxW, height: boxH },
    entering: clip.start > 0 ? clamp01(t / clip.start) : 1,
    leaving: total > end ? clamp01((t - end) / (total - end)) : 0,
    duration: clip.duration,
    settings,
  })
}
