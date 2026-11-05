import { STATIC_LAYER, type AnimationTrackId, type LayerState } from '../../core/animation/layers'
import { useDayBreaks, useHasPhotos, useHasRoute, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { headFor } from './model/pacing'
import { tripSchedule } from './model/schedule'
import { clamp01 } from '../../utils/math'
import { clipProgress, layerAt, photoAt } from './model/timeline'
import { usePlayback } from './playback'
import { selectRouteParts, selectTrack } from '../../store/derived'

export function useAnimationTime(): number | null {
  const enabled = useAppStore((s) => s.animation.enabled)
  const t = usePlayback((s) => (s.previewing ? s.t : null))
  return enabled ? t : null
}

export function useAnimationHead(): number | null {
  const t = useAnimationTime()
  const settings = useAppStore((s) => s.animation)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const cumKm = useTrackCumKm()
  const breaks = useDayBreaks()
  const schedule = tripSchedule(useAppStore(selectRouteParts))
  if (t == null || !track || !cumKm || range.end <= range.start) return null
  const p = clipProgress(settings.clips.route, t)
  return headFor(settings.pacing, p, { track, cumKm, range, breaks, schedule })
}

export function useAnimatedLayer(track: AnimationTrackId): LayerState {
  const t = useAnimationTime()
  const settings = useAppStore((s) => s.animation)
  return t == null ? STATIC_LAYER : layerAt(settings, track, t)
}

// Only a collage animates its photos; next to a route they stay put.
export function useAnimatedPhoto(order: number, count: number): LayerState {
  const t = useAnimationTime()
  const settings = useAppStore((s) => s.animation)
  const collage = useAppStore((s) => s.mode === 'collage')
  return t == null || !collage ? STATIC_LAYER : photoAt(settings, order, count, t)
}

export function useCanAnimate(): boolean {
  const hasRoute = useHasRoute()
  const hasPhotos = useHasPhotos()
  const collage = useAppStore((s) => s.mode === 'collage')
  return collage ? hasPhotos : hasRoute
}

// Share of the visible range a place takes to fade in once the line has reached it.
const POINT_FADE_SHARE = 0.03

export function useAnimatedPoint(trackPos: number): LayerState {
  const head = useAnimationHead()
  const sync = useAppStore((s) => s.animation.syncWaypoints)
  const range = useAppStore((s) => s.range)
  const layer = useAnimatedLayer('waypoints')
  if (head == null) return STATIC_LAYER
  if (!sync) return layer
  const fade = Math.max(1, (range.end - range.start) * POINT_FADE_SHARE)
  // Places too near the end start earlier, so they are whole when the line stops.
  const opacity = clamp01((head - Math.min(trackPos, range.end - fade)) / fade)
  return opacity >= 1 ? STATIC_LAYER : { opacity, offsetY: 0 }
}

export function useCountingHead(): number | null {
  const head = useAnimationHead()
  const count = useAppStore((s) => s.animation.countStats)
  return count ? head : null
}

export function useAnimationGhost(): boolean {
  const animating = useAnimationTime() != null
  const ghost = useAppStore((s) => s.animation.ghost)
  return animating && ghost
}
