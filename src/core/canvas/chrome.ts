import type { ComponentType } from 'react'

// Controls shown under the frame (HTML, never exported), e.g. the animation playback bar.
const below: ComponentType[] = []

export function addCanvasControls(component: ComponentType) {
  if (!below.includes(component)) below.push(component)
}

export function canvasControls(): readonly ComponentType[] {
  return below
}
