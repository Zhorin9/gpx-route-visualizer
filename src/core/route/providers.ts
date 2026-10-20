import type { ComponentType } from 'react'
import type { RouteColoring } from './coloring'
import type { RouteGeometry } from './geometry'

// Extension points of the route. Features plug in here at start-up, so the route
// itself never imports them (animation, colour by data).

type Hook<T> = () => T

let headHook: Hook<number | null> = () => null
let coloringHook: Hook<RouteColoring | null> = () => null
const decorations: ComponentType<{ geometry: RouteGeometry }>[] = []

// Fractional track index the route is drawn up to, or null for the static view.
export function provideRouteHead(hook: Hook<number | null>) {
  headHook = hook
}

// A colouring that replaces the route colour, or null to keep it.
export function provideRouteColoring(hook: Hook<RouteColoring | null>) {
  coloringHook = hook
}

// Drawn inside the route group, above the line (e.g. the glowing head of the animation).
export function addRouteDecoration(component: ComponentType<{ geometry: RouteGeometry }>) {
  if (!decorations.includes(component)) decorations.push(component)
}

export const useRouteHead = () => headHook()
export const useProvidedColoring = () => coloringHook()
export const routeDecorations = (): readonly ComponentType<{ geometry: RouteGeometry }>[] => decorations
