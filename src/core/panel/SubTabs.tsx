import type { ComponentType } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { panelSections } from './registry'
import type { TabKey } from '../../types'

export interface OwnPage {
  id: string
  label: string
  Component: ComponentType
}

// A tab split into pages: its own ones first, then those features registered for it.
// The open page is remembered per tab, so leaving and coming back keeps it.
export default function SubTabs({ tab, own }: { tab: TabKey; own: OwnPage[] }) {
  const pages: OwnPage[] = [...own, ...panelSections(tab)]
  const chosen = useAppStore((s) => s.subTabs[tab])
  const setSubTab = useAppStore((s) => s.setSubTab)
  const active = pages.find((p) => p.id === chosen) ?? pages[0]
  if (!active) return null

  return (
    <>
      {pages.length > 1 && (
        <div className="subtabs" role="tablist" aria-label="Podzakładki">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={page.id === active.id}
              className={page.id === active.id ? 'subtab active' : 'subtab'}
              onClick={() => setSubTab(tab, page.id)}
            >
              {page.label}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" aria-label={active.label}>
        <active.Component />
      </div>
    </>
  )
}
