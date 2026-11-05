// Static view until the animation feature plugs the real hooks in, so nothing on the frame imports it.

export type AnimationTrackId = 'route' | 'header' | 'waypoints' | 'stats' | 'photos'

export interface LayerState {
  opacity: number
  // Slide-in offset, in stage pixels.
  offsetY: number
}

export const STATIC_LAYER: LayerState = { opacity: 1, offsetY: 0 }

interface AnimationHooks {
  layer: (track: AnimationTrackId) => LayerState
  point: (trackPos: number) => LayerState
  photo: (order: number, count: number) => LayerState
  // null: the whole range.
  countHead: () => number | null
  // The part of the route not drawn yet is shown as a ghost, whatever the route style says.
  ghost: () => boolean
}

let hooks: AnimationHooks = {
  layer: () => STATIC_LAYER,
  point: () => STATIC_LAYER,
  photo: () => STATIC_LAYER,
  countHead: () => null,
  ghost: () => false,
}

export function provideAnimation(value: AnimationHooks) {
  hooks = value
}

export const useLayerAnimation = (track: AnimationTrackId) => hooks.layer(track)
export const usePointAnimation = (trackPos: number) => hooks.point(trackPos)
export const usePhotoAnimation = (order: number, count: number) => hooks.photo(order, count)
export const useCountHead = () => hooks.countHead()
export const useForcedGhost = () => hooks.ghost()
