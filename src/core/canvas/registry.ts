import type { ComponentType, ReactNode } from 'react'
import type { AnimationTrackId } from '../animation/layers'
import type { ElementKind, PanelTab } from '../../types'

export interface CanvasElementDefinition {
  kind: ElementKind
  // Shown in the "Elementy na grafice" list and the per-format layout summary.
  label: string
  meta: string
  icon: ReactNode
  // Drawing order on the overlay layer; lower is drawn first.
  order: number
  useIsAvailable: () => boolean
  // For an element the user can hide: what puts it back, while it is hidden.
  useShowAgain?: () => (() => void) | null
  // Wraps itself in a DraggableElement.
  Node: ComponentType
  Editor: ComponentType
  // Opens when the element is picked on the frame; Teksty when not set.
  tab?: PanelTab
  subTab?: string
  // 'stats' when not set.
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
