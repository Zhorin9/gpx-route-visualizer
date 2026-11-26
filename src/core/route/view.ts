import { useAppStore } from '../../store/useAppStore'
import type { RouteStyle, RouteTransform } from '../../types'
import { rotate } from '../../utils/geometry'
import { useWorldView } from './providers'

// What the camera shows: the frame point (x, y) of the static view, brought to the focus point
// (the middle of the route's area), enlarged `zoom` times and turned `rotation` degrees about it. Null = the static view.
export interface CameraView {
  x: number
  y: number
  zoom: number
  focusX: number
  focusY: number
  rotation?: number
}

export function composeView(t: RouteTransform, view: CameraView | null): RouteTransform {
  if (!view) return t
  const { zoom: z, rotation = 0 } = view
  const at = rotate(z * (t.x - view.x), z * (t.y - view.y), rotation)
  return {
    x: at.x + view.focusX,
    y: at.y + view.focusY,
    scaleX: z * t.scaleX,
    scaleY: z * t.scaleY,
    rotation: t.rotation + rotation,
  }
}

// Without a camera this is the route transform itself.
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
    echo: style.echo && { ...style.echo, dx: style.echo.dx / zoom, dy: style.echo.dy / zoom },
    casing: style.casing && { ...style.casing, width: style.casing.width / zoom, dx: style.casing.dx / zoom, dy: style.casing.dy / zoom },
  }
}

const MIN_ROUTE_SCALE = 0.05
const MAX_ROUTE_SCALE = 60

export function zoomedAround(t: RouteTransform, at: { x: number; y: number }, factor: number): RouteTransform {
  const scale = Math.abs(t.scaleX)
  const k = Math.min(MAX_ROUTE_SCALE, Math.max(MIN_ROUTE_SCALE, scale * factor)) / scale
  return { ...t, x: at.x + k * (t.x - at.x), y: at.y + k * (t.y - at.y), scaleX: t.scaleX * k, scaleY: t.scaleY * k }
}
