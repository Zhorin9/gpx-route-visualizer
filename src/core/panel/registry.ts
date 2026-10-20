import type { ComponentType } from 'react'
import type { TabKey } from '../../types'

// Extra sections a feature adds to a tab of the side panel, after the tab's own content.
export interface PanelSection {
  id: string
  // Name of the section where a tab lets the user switch between them (Eksport: Obraz / Wideo).
  label?: string
  tab: TabKey
  order: number
  Component: ComponentType
}

const sections: PanelSection[] = []

export function registerPanelSection(section: PanelSection): void {
  const i = sections.findIndex((s) => s.id === section.id)
  if (i >= 0) sections.splice(i, 1)
  sections.push(section)
  sections.sort((a, b) => a.order - b.order)
}

export function panelSections(tab: TabKey): readonly PanelSection[] {
  return sections.filter((s) => s.tab === tab)
}
