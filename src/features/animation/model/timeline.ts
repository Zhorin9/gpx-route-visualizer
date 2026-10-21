import { STATIC_LAYER, type AnimationTrackId, type LayerState } from '../../../core/animation/layers'
import type { AnimationSettings, Entrance, TrackClip } from '../types'

export const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)
const easeOut = (p: number) => 1 - (1 - p) ** 3

const SLIDE_PX = 40
export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

// Whole length of the animation: the last bar to end, plus the still frames.
export function totalDuration(settings: Pick<AnimationSettings, 'clips' | 'endHold'>): number {
  return Math.max(...Object.values(settings.clips).map((c) => c.start + c.duration)) + settings.endHold
}

// 0 before the bar, 1 after it.
export function clipProgress(clip: TrackClip, t: number): number {
  if (clip.duration <= 0) return t >= clip.start ? 1 : 0
  return clamp01((t - clip.start) / clip.duration)
}

export function entranceState(entrance: Entrance, p: number): LayerState {
  if (p >= 1) return STATIC_LAYER
  const e = easeOut(p)
  return { opacity: e, offsetY: entrance === 'slide' ? (1 - e) * SLIDE_PX : 0 }
}

// The header and stats appear over their whole bar; the route's own bar is about drawing.
export function layerAt(settings: AnimationSettings, track: AnimationTrackId, t: number): LayerState {
  if (track === 'route') return STATIC_LAYER
  return entranceState(settings.entrance, clipProgress(settings.clips[track], t))
}
