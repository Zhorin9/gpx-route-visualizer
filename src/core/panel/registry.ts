import type { ComponentType } from 'react'
import type { ProjectMode, TabKey } from '../../types'
import type { TKey } from '../../i18n'

// Follows the tab's own pages, in `order`.
export interface PanelSection {
  id: string
  label: TKey
  tab: TabKey
  // The project modes it shows in; every mode when unset.
  modes?: ProjectMode[]
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

export function panelSections(tab: TabKey, mode: ProjectMode | null): readonly PanelSection[] {
  return sections.filter((s) => s.tab === tab && (!s.modes || !mode || s.modes.includes(mode)))
}
