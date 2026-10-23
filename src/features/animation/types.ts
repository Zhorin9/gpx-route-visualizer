import type { AnimationTrackId } from '../../core/animation/layers'
import type { VehicleId } from '../../types'

export type PacingId = 'constant' | 'eased' | 'bySpeed'
export type Entrance = 'fade' | 'slide'

// One bar of the timeline, in seconds.
export interface TrackClip {
  start: number
  duration: number
}

export interface AnimationSettings {
  // Off by default: no playback bar, settings locked, no video export.
  enabled: boolean
  pacing: PacingId
  clips: Record<AnimationTrackId, TrackClip>
  entrance: Entrance
  // Still frames after everything has appeared.
  endHold: number
  // Places and km marks pop up as the line reaches them, instead of following their bar.
  syncWaypoints: boolean
  // Figures in the stats header count up with the line.
  countStats: boolean
  // The rest of the line stays visible, faint, ahead of the drawing.
  ghost: boolean
  headDot: boolean
  // Marker at the head of the line; a part of the route may choose its own.
  vehicle: VehicleId
  headSize: number
  loop: boolean
}

export const DEFAULT_ANIMATION: AnimationSettings = {
  enabled: false,
  pacing: 'eased',
  clips: {
    header: { start: 0, duration: 0.8 },
    route: { start: 0.4, duration: 6 },
    waypoints: { start: 0.4, duration: 6 },
    stats: { start: 0.8, duration: 1 },
  },
  entrance: 'fade',
  endHold: 1.5,
  syncWaypoints: true,
  countStats: true,
  ghost: true,
  headDot: true,
  vehicle: 'dot',
  headSize: 9,
  loop: true,
}

export const TRACK_LABELS: Record<AnimationTrackId, string> = {
  route: 'Trasa',
  header: 'Nagłówek',
  waypoints: 'Punkty',
  stats: 'Statystyki',
}

export const TRACK_ORDER: AnimationTrackId[] = ['route', 'header', 'waypoints', 'stats']

export const MAX_DURATION_S = 60
