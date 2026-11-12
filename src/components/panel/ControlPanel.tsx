import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import { PANELS } from './panels'
import PhonePanel from './PhonePanel'
import useMediaQuery, { SHEET_QUERY } from '../../hooks/useMediaQuery'
import { useAppStore } from '../../store/useAppStore'
import { IconImage, IconRoute, IconType, IconPalette, IconPlay } from '../icons'
import { useTranslation } from 'react-i18next'
import type { PanelTab, ProjectMode } from '../../types'
import type { TKey } from '../../i18n'

type PanelTabDef = TabDef<PanelTab> & { label: TKey }

const TABS: PanelTabDef[] = [
  { key: 'route', label: 'controlPanel.map', icon: <IconRoute /> },
  { key: 'media', label: 'controlPanel.photos', icon: <IconImage /> },
  { key: 'texts', label: 'controlPanel.texts', icon: <IconType /> },
  { key: 'style', label: 'controlPanel.style', icon: <IconPalette /> },
  { key: 'animation', label: 'controlPanel.animation', icon: <IconPlay /> },
]

const MODE_TABS: Record<ProjectMode, PanelTabDef[]> = {
  map: TABS,
  collage: TABS.filter((t) => t.key !== 'route'),
}

function SidePanel() {
  const { t } = useTranslation()
  const tabs = MODE_TABS[useAppStore((s) => s.mode ?? 'map')]
  // Picking something whose settings live in a tab a collage lacks opens its first tab instead.
  const activeTab = useAppStore((s) => tabs.find((t) => t.key === s.activeTab)?.key ?? tabs[0].key)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const Panel = PANELS[activeTab]

  return (
    <aside className="panel">
      <h1 className="visually-hidden">Tripcard</h1>
      <Tabs tabs={tabs.map((tab) => ({ ...tab, label: t(tab.label) }))} active={activeTab} onChange={setActiveTab} />

      <div className="tab-panel" role="tabpanel" id={tabPanelId(activeTab)} aria-labelledby={tabId(activeTab)} key={activeTab}>
        <Panel />
      </div>
    </aside>
  )
}

export default function ControlPanel() {
  return useMediaQuery(SHEET_QUERY) ? <PhonePanel /> : <SidePanel />
}
