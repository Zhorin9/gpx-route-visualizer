import type { AnimationTrackId } from '../../core/animation/layers'
import type { ProjectMode, VehicleId } from '../../types'
import type { TKey } from '../../i18n'

export type PacingId = 'constant' | 'eased' | 'bySpeed'
export type Entrance = 'fade' | 'slide'
// How the car is drawn; other vehicles have their illustration (art) or their outline (side).
export type MarkerLook = 'art' | 'flat' | 'sketch' | 'badge' | 'camper' | 'classic' | 'side'
// style: the template's text colour; route: the leg's line; otherwise a #rrggbb of its own.
export type MarkerColor = 'style' | 'route' | (string & {})

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
  countStats: boolean
  // The rest of the line stays visible, faint, ahead of the drawing.
  ghost: boolean
  headDot: boolean
  vehicle: VehicleId
  // Unset in documents saved before it existed: art. Read through markerOf, which knows the old values.
  vehicleLook?: MarkerLook
  // Unset: style.
  vehicleColor?: MarkerColor
  // Unset: 1; 0.6–1.6.
  vehicleScale?: number
  // Unset: only the illustration has one.
  vehicleShadow?: boolean
  // Unset: the marker turns with the route.
  vehicleUpright?: boolean
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
    photos: { start: 0.4, duration: 3 },
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

export const TRACK_LABELS: Record<AnimationTrackId, TKey> = {
  route: 'animation.tracks.route',
  header: 'animation.tracks.header',
  waypoints: 'animation.tracks.waypoints',
  stats: 'animation.tracks.stats',
  photos: 'animation.tracks.photos',
}

// A collage has no route: its photos come in one by one under the header.
export const tracksFor = (mode: ProjectMode | null): AnimationTrackId[] =>
  mode === 'collage' ? ['photos', 'header'] : ['route', 'header', 'waypoints', 'stats']

export const MAX_DURATION_S = 60
