import type { ComponentType, ReactNode } from 'react'
import type { AnimationTrackId } from '../animation/layers'
import type { ElementKind, TabKey } from '../../types'

// Anything that sits on the frame as one selectable, draggable block: the stats header,
// the elevation profile, the colour legend. Adding one is a registration, not an edit
// of the stage or the panel.
export interface CanvasElementDefinition {
  kind: ElementKind
  // Shown in the "Elementy na grafice" list and the per-format layout summary.
  label: string
  meta: string
  icon: ReactNode
  // Drawing order on the overlay layer; lower is drawn first.
  order: number
  // Whether the element exists right now (needs a route, switched on, ...).
  useIsAvailable: () => boolean
  // Konva content, wrapped by the element itself in a DraggableElement.
  Node: ComponentType
  // Settings shown in the side panel while the element is selected.
  Editor: ComponentType
  // Tab (and page inside it) that opens when the element is picked on the frame; Napisy when not set.
  tab?: TabKey
  subTab?: string
  // Timeline track the element appears with; 'stats' when not set.
  animationTrack?: AnimationTrackId
}

const definitions = new Map<ElementKind, CanvasElementDefinition>()
let ordered: CanvasElementDefinition[] = []

export function registerCanvasElement(def: CanvasElementDefinition): void {
  definitions.set(def.kind, def)
  ordered = [...definitions.values()].sort((a, b) => a.order - b.order)
}

export function canvasElements(): readonly CanvasElementDefinition[] {
  return ordered
}

export function canvasElement(kind: ElementKind): CanvasElementDefinition | undefined {
  return definitions.get(kind)
}
