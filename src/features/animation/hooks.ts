import { useShallow } from 'zustand/react/shallow'
import { STATIC_LAYER, type AnimationTrackId, type LayerState } from '../../core/animation/layers'
import { useDayBreaks, useHasPhotos, useHasRoute, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { headFor } from './model/pacing'
import { tripSchedule } from './model/schedule'
import { clamp01 } from '../../utils/math'
import { clipProgress, layerAt, photoAt, typedCount } from './model/timeline'
import { usePlayback } from './playback'
import { selectRouteParts, selectTrack } from '../../store/derived'

function useHeadAt(): (t: number) => number | null {
  const settings = useAppStore((s) => s.animation)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const cumKm = useTrackCumKm()
  const breaks = useDayBreaks()
  const schedule = tripSchedule(useAppStore(selectRouteParts))
  return (t) => (!track || !cumKm || range.end <= range.start ? null : headFor(settings.pacing, clipProgress(settings.clips.route, t), { track, cumKm, range, breaks, schedule }))
}

function useAtPreviewTime<T>(animated: boolean, at: (t: number) => T, still: T): T {
  return usePlayback(useShallow((s) => (animated && s.previewing ? at(s.t) : still)))
}

export function useAnimationHead(): number | null {
  const enabled = useAppStore((s) => s.animation.enabled)
  return useAtPreviewTime(enabled, useHeadAt(), null)
}

export function useAnimatedLayer(track: AnimationTrackId): LayerState {
  const settings = useAppStore((s) => s.animation)
  return useAtPreviewTime(settings.enabled, (t) => layerAt(settings, track, t), STATIC_LAYER)
}

// Only a collage animates its photos; next to a route they stay put.
export function useAnimatedPhoto(order: number, count: number): LayerState {
  const settings = useAppStore((s) => s.animation)
  const collage = useAppStore((s) => s.mode === 'collage')
  return useAtPreviewTime(settings.enabled && collage, (t) => photoAt(settings, order, count, t), STATIC_LAYER)
}

export function useTypedText(length: number, cps: number): number {
  const enabled = useAppStore((s) => s.animation.enabled)
  const clip = useAppStore((s) => s.animation.clips.header)
  return useAtPreviewTime(enabled, (t) => typedCount(clip, t, cps, length), length)
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
  const settings = useAppStore((s) => s.animation)
  const range = useAppStore((s) => s.range)
  const headAt = useHeadAt()
  return useAtPreviewTime(
    settings.enabled,
    (t) => {
      const head = headAt(t)
      if (head == null) return STATIC_LAYER
      if (!settings.syncWaypoints) return layerAt(settings, 'waypoints', t)
      const fade = Math.max(1, (range.end - range.start) * POINT_FADE_SHARE)
      // Places too near the end start earlier, so they are whole when the line stops.
      const opacity = clamp01((head - Math.min(trackPos, range.end - fade)) / fade)
      return opacity >= 1 ? STATIC_LAYER : { opacity, offsetY: 0 }
    },
    STATIC_LAYER,
  )
}

export function useCountingHead(): number | null {
  const head = useAnimationHead()
  const count = useAppStore((s) => s.animation.countStats)
  return count ? head : null
}

export function useAnimationGhost(): boolean {
  const previewing = usePlayback((s) => s.previewing)
  return useAppStore((s) => s.animation.enabled && s.animation.ghost) && previewing
}
