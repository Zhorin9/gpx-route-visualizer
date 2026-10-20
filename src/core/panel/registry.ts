import type { ComponentType } from 'react'
import type { TabKey } from '../../types'

// A sub-tab a feature adds to a tab of the side panel (Trasa → Profil, Eksport → Wideo).
// The tab's own pages come first; registered ones follow in `order`.
export interface PanelSection {
  id: string
  label: string
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
