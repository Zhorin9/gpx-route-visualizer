import type { AnimationTrackId } from '../../core/animation/layers'
import type { SliceContext } from '../../store/types'
import { MAX_DURATION_S, type AnimationSettings, type TrackClip } from './types'

export interface AnimationSlice {
  updateAnimation: (patch: Partial<Omit<AnimationSettings, 'clips'>>) => void
  setClip: (track: AnimationTrackId, clip: TrackClip) => void
  // Drawing time of the line; places that follow the line keep pace with it.
  setDrawDuration: (seconds: number) => void
}

const fit = (clip: TrackClip): TrackClip => {
  const start = Math.max(0, Math.min(MAX_DURATION_S - 0.1, clip.start))
  return { start, duration: Math.max(0, Math.min(MAX_DURATION_S - start, clip.duration)) }
}

export function createAnimationSlice({ commit }: SliceContext): AnimationSlice {
  return {
    updateAnimation: (patch) => commit(`animation:${Object.keys(patch).join()}`, (s) => ({ animation: { ...s.animation, ...patch } })),
    setClip: (track, clip) =>
      commit(`animation:clip:${track}`, (s) => ({ animation: { ...s.animation, clips: { ...s.animation.clips, [track]: fit(clip) } } })),
    setDrawDuration: (seconds) =>
      commit('animation:draw', (s) => {
        const { route, waypoints } = s.animation.clips
        const next = fit({ ...route, duration: seconds })
        const followsRoute = waypoints.start === route.start && waypoints.duration === route.duration
        return {
          animation: {
            ...s.animation,
            clips: { ...s.animation.clips, route: next, ...(followsRoute ? { waypoints: next } : null) },
          },
        }
      }),
  }
}
