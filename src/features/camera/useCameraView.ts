import type { CameraView } from '../../core/route/view'
import { selectRouteParts, selectTrack } from '../../store/derived'
import { useDayBreaks, useProjectedTrack, useRouteBox, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { applyTransform, pointAt } from '../../utils/geometry'
import { useAnimationTime } from '../animation/hooks'
import { headFor } from '../animation/model/pacing'
import { tripSchedule } from '../animation/model/schedule'
import { clipProgress } from '../animation/model/timeline'
import { cameraFor } from './model/camera'

// What the camera shows at the current moment of the animation; null in the static view,
// while the editor shows no animation, and in a carousel, where the route crosses slide borders.
export function useCameraView(): CameraView | null {
  const settings = useAppStore((s) => s.camera)
  const animation = useAppStore((s) => s.animation)
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
  return cameraFor(settings.mode).viewAt({
    progress: clipProgress(animation.clips.route, t),
    headAt: (p) => applyTransform(pointAt(projected, headFor(animation.pacing, p, ctx)), transform),
    focus: { x: boxW / 2, y: boxH / 2 },
    duration: animation.clips.route.duration,
    settings,
  })
}
