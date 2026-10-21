import { STATIC_LAYER, type AnimationTrackId, type LayerState } from '../../core/animation/layers'
import { useDayBreaks, useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { pacingFor } from './model/pacing'
import { clamp01, clipProgress, layerAt } from './model/timeline'
import { usePlayback } from './playback'
import { selectTrack } from '../../store/derived'

// Seconds into the animation, or null while the editor shows the static view.
export function useAnimationTime(): number | null {
  const enabled = useAppStore((s) => s.animation.enabled)
  const t = usePlayback((s) => (s.previewing ? s.t : null))
  return enabled ? t : null
}

// Fractional track index the line has reached, or null in the static view.
export function useAnimationHead(): number | null {
  const t = useAnimationTime()
  const settings = useAppStore((s) => s.animation)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const cumKm = useTrackCumKm()
  const breaks = useDayBreaks()
  if (t == null || !track || !cumKm || range.end <= range.start) return null
  const p = clipProgress(settings.clips.route, t)
  return pacingFor(settings.pacing).headAt(p, { track, cumKm, range, breaks })
}

export function useAnimatedLayer(track: AnimationTrackId): LayerState {
  const t = useAnimationTime()
  const settings = useAppStore((s) => s.animation)
  return t == null ? STATIC_LAYER : layerAt(settings, track, t)
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
  const opacity = clamp01((head - trackPos) / fade)
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
