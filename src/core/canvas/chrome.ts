import type { ComponentType } from 'react'

// Colour of the editor's own marks on the canvas (selection, handles, empty slots); never exported.
export const CHROME_ACCENT = '#b68235'

// Controls shown under the frame (HTML, never exported), e.g. the animation playback bar.
const below: ComponentType[] = []

export function addCanvasControls(component: ComponentType) {
  if (!below.includes(component)) below.push(component)
}

export function canvasControls(): readonly ComponentType[] {
  return below
}
