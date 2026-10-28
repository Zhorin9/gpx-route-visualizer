import type { ComponentType, ReactNode } from 'react'
import type { PanelTab, TabKey } from '../../types'

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

// Drawn under the stage in the editor (HTML, e.g. a live map); files get their own copy through
// the frame source. Sized to the preview.
const under: ComponentType<{ previewScale: number }>[] = []

export function addStageUnderlay(component: ComponentType<{ previewScale: number }>) {
  if (!under.includes(component)) under.push(component)
}

export function stageUnderlays(): readonly ComponentType<{ previewScale: number }>[] {
  return under
}

// A workspace a tab shows in the middle of the editor instead of the frame (Podróż → a large map).
// It gets the frame itself, small, to show as a live preview.
export interface Workspace {
  tab: PanelTab
  page: string
  Component: ComponentType<{ preview: (box: { width: number; height: number }) => ReactNode }>
}

const workspaces: Workspace[] = []

export function addWorkspace(workspace: Workspace) {
  if (!workspaces.some((w) => w.tab === workspace.tab && w.page === workspace.page)) workspaces.push(workspace)
}

// The workspace of the open page; a page left unchosen never has one.
export function workspaceFor(s: { activeTab: PanelTab; subTabs: Partial<Record<TabKey, string>> }): Workspace | undefined {
  return workspaces.find((w) => w.tab === s.activeTab && w.page === s.subTabs[s.activeTab])
}
