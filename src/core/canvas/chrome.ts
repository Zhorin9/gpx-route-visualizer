import type { ComponentType, ReactNode } from 'react'
import type { PanelTab, TabKey } from '../../types'

// Colour of the editor's own marks on the canvas (selection, handles, empty slots); never exported.
export const CHROME_ACCENT = '#b68235'

export const SELECTION_OUTLINE = { strokeWidth: 2.5, strokeScaleEnabled: false, dash: [8, 5], cornerRadius: 4, listening: false }

// HTML under the frame, never exported.
const below: ComponentType[] = []

export function addCanvasControls(component: ComponentType) {
  if (!below.includes(component)) below.push(component)
}

export function canvasControls(): readonly ComponentType[] {
  return below
}

// HTML under the stage, sized to the preview; files get their own copy through the frame source.
const under: ComponentType<{ previewScale: number }>[] = []

export function addStageUnderlay(component: ComponentType<{ previewScale: number }>) {
  if (!under.includes(component)) under.push(component)
}

export function stageUnderlays(): readonly ComponentType<{ previewScale: number }>[] {
  return under
}

// Shown instead of the frame (Podróż → a large map); it gets the frame, small, as a live preview.
export interface Workspace {
  tab: PanelTab
  page: string
  Component: ComponentType<{ preview: (box: { width: number; height: number }) => ReactNode }>
}

const workspaces: Workspace[] = []

export function addWorkspace(workspace: Workspace) {
  if (!workspaces.some((w) => w.tab === workspace.tab && w.page === workspace.page)) workspaces.push(workspace)
}

export function workspaceFor(s: { activeTab: PanelTab; subTabs: Partial<Record<TabKey, string>> }): Workspace | undefined {
  return workspaces.find((w) => w.tab === s.activeTab && w.page === s.subTabs[s.activeTab])
}
