import { useAppStore } from '../../store/useAppStore'
import type { RouteStyle, RouteTransform } from '../../types'
import { useWorldView } from './providers'

// What the camera shows: the frame point (x, y) of the static view, brought to the focus point
// (the middle of the route's area) and enlarged `zoom` times. Null = the static view.
export interface CameraView {
  x: number
  y: number
  zoom: number
  focusX: number
  focusY: number
}

// The route transform followed by the camera, as one transform for the route group.
export function composeView(t: RouteTransform, view: CameraView | null): RouteTransform {
  if (!view) return t
  const { zoom: z } = view
  return {
    x: z * (t.x - view.x) + view.focusX,
    y: z * (t.y - view.y) + view.focusY,
    scaleX: z * t.scaleX,
    scaleY: z * t.scaleY,
    rotation: t.rotation,
  }
}

// Where everything pinned to the route (the line, places, km marks, the vehicle) is drawn.
// Without a camera this is the route transform itself, so the frame looks as it always did.
export function useViewTransform(): RouteTransform {
  const transform = useAppStore((s) => s.routeTransform)
  return composeView(transform, useWorldView())
}

// Widths that stay the same on screen however close the camera comes.
export function steadyStyle(style: RouteStyle, zoom: number): RouteStyle {
  if (zoom === 1) return style
  return {
    ...style,
    coreWidth: style.coreWidth / zoom,
    glowWidth: style.glowWidth / zoom,
    glowBlur: style.glowBlur / zoom,
    remainingWidth: style.remainingWidth / zoom,
  }
}
