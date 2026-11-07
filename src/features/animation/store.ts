import type { AnimationTrackId } from '../../core/animation/layers'
import type { SliceContext } from '../../store/types'
import { MAX_DURATION_S, type AnimationSettings, type TrackClip } from './types'
import { clamp } from '../../utils/math'

export interface AnimationSlice {
  updateAnimation: (patch: Partial<Omit<AnimationSettings, 'clips'>>) => void
  setClip: (track: AnimationTrackId, clip: TrackClip) => void
  // Places that follow the line keep pace with it.
  setDrawDuration: (seconds: number) => void
}

const fit = (clip: TrackClip): TrackClip => {
  const start = clamp(clip.start, 0, MAX_DURATION_S - 0.1)
  return { start, duration: clamp(clip.duration, 0, MAX_DURATION_S - start) }
}

// Places that follow the line keep pace with it.
export function withRouteClip(animation: AnimationSettings, patch: Partial<TrackClip>): AnimationSettings {
  const { route, waypoints } = animation.clips
  const next = fit({ ...route, ...patch })
  const followsRoute = waypoints.start === route.start && waypoints.duration === route.duration
  return { ...animation, clips: { ...animation.clips, route: next, ...(followsRoute ? { waypoints: next } : null) } }
}

export function createAnimationSlice({ commit }: SliceContext): AnimationSlice {
  return {
    updateAnimation: (patch) => commit(`animation:${Object.keys(patch).join()}`, (s) => ({ animation: { ...s.animation, ...patch } })),
    setClip: (track, clip) =>
      commit(`animation:clip:${track}`, (s) => ({ animation: { ...s.animation, clips: { ...s.animation.clips, [track]: fit(clip) } } })),
    setDrawDuration: (seconds) => commit('animation:draw', (s) => ({ animation: withRouteClip(s.animation, { duration: seconds }) })),
  }
}
