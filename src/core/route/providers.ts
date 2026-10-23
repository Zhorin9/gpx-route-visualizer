import type { ComponentType } from 'react'
import type { RouteColoring } from './coloring'
import type { RouteGeometry } from './geometry'
import type { CameraView } from './view'

// Extension points of the route. Features plug in here at start-up, so the route
// itself never imports them (animation, colour by data, camera).

type Hook<T> = () => T

let headHook: Hook<number | null> = () => null
let coloringHook: Hook<RouteColoring | null> = () => null
let viewHook: Hook<CameraView | null> = () => null
const decorations: ComponentType<{ geometry: RouteGeometry }>[] = []

// Fractional track index the route is drawn up to, or null for the static view.
export function provideRouteHead(hook: Hook<number | null>) {
  headHook = hook
}

// A colouring that replaces the route colour, or null to keep it.
export function provideRouteColoring(hook: Hook<RouteColoring | null>) {
  coloringHook = hook
}

// What the camera shows right now, or null for the static view.
export function provideWorldView(hook: Hook<CameraView | null>) {
  viewHook = hook
}

// Drawn inside the route group, above the line (e.g. the glowing head of the animation).
export function addRouteDecoration(component: ComponentType<{ geometry: RouteGeometry }>) {
  if (!decorations.includes(component)) decorations.push(component)
}

export const useRouteHead = () => headHook()
export const useProvidedColoring = () => coloringHook()
export const useWorldView = () => viewHook()
export const routeDecorations = (): readonly ComponentType<{ geometry: RouteGeometry }>[] => decorations
