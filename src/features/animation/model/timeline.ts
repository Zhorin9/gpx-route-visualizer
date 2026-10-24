import { STATIC_LAYER, type AnimationTrackId, type LayerState } from '../../../core/animation/layers'
import { tracksFor, type AnimationSettings, type Entrance, type TrackClip } from '../types'
import type { ProjectMode } from '../../../types'

export const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)
const easeOut = (p: number) => 1 - (1 - p) ** 3

const SLIDE_PX = 40
export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

// Whole length of the animation: the last of the mode's bars to end, plus the still frames.
export function totalDuration(settings: Pick<AnimationSettings, 'clips' | 'endHold'>, tracks: AnimationTrackId[] = tracksFor(null)): number {
  return Math.max(...tracks.map((track) => settings.clips[track]).map((c) => c.start + c.duration)) + settings.endHold
}

export const selectDuration = (s: { animation: AnimationSettings; mode: ProjectMode | null }) => totalDuration(s.animation, tracksFor(s.mode))

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

// Photos share the photos bar: each takes half of it to appear (all of it when alone), and
// they start evenly spread, so the last one ends with the bar.
export function photoAt(settings: AnimationSettings, order: number, count: number, t: number): LayerState {
  const { start, duration } = settings.clips.photos
  const each = count > 1 ? duration / 2 : duration
  const step = count > 1 ? (duration - each) / (count - 1) : 0
  return entranceState(settings.entrance, clipProgress({ start: start + order * step, duration: each }, t))
}
