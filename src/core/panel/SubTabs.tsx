import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { panelSections } from './registry'
import type { TabKey } from '../../types'
import type { TKey } from '../../i18n'

export interface OwnPage {
  id: string
  label: TKey
  Component: ComponentType
}

// The open page is remembered per tab, so leaving and coming back keeps it.
// `first`: the page that leads and opens by default.
export default function SubTabs({ tab, own, first }: { tab: TabKey; own: OwnPage[]; first?: string }) {
  const { t } = useTranslation()
  const mode = useAppStore((s) => s.mode)
  const pages: OwnPage[] = [...own, ...panelSections(tab, mode)].sort((a, b) => Number(b.id === first) - Number(a.id === first))
  const chosen = useAppStore((s) => s.subTabs[tab])
  const setSubTab = useAppStore((s) => s.setSubTab)
  const active = pages.find((p) => p.id === chosen) ?? pages[0]
  if (!active) return null

  return (
    <>
      {pages.length > 1 && (
        <div className="subtabs" role="tablist" aria-label={t('subTabs.label')}>
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={page.id === active.id}
              className={page.id === active.id ? 'subtab active' : 'subtab'}
              onClick={() => setSubTab(tab, page.id)}
            >
              {t(page.label)}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" aria-label={t(active.label)}>
        <active.Component />
      </div>
    </>
  )
}
