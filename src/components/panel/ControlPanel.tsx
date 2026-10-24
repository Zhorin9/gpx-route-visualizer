import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import BackgroundTab from './BackgroundTab'
import MediaTab from './MediaTab'
import RouteTab from './RouteTab'
import ElementsTab from './ElementsTab'
import TemplatesTab from './TemplatesTab'
import ExportTab from './ExportTab'
import SubTabs from '../../core/panel/SubTabs'
import { useAppStore } from '../../store/useAppStore'
import { IconDroplet, IconImage, IconRoute, IconType, IconPalette, IconDownload, IconPlane, IconLayout } from '../icons'
import type { ProjectMode, TabKey } from '../../types'

const TEXTS: TabDef<TabKey> = { key: 'texts', label: 'Napisy', icon: <IconType /> }
const STYLE: TabDef<TabKey> = { key: 'style', label: 'Styl', icon: <IconPalette /> }
const EXPORT: TabDef<TabKey> = { key: 'export', label: 'Eksport', icon: <IconDownload /> }

// A collage has no route or map: photos are added in Układ, so there is no separate Zdjęcia tab.
const MODE_TABS: Record<ProjectMode, TabDef<TabKey>[]> = {
  map: [
    { key: 'background', label: 'Tło', icon: <IconDroplet /> },
    { key: 'media', label: 'Zdjęcia i układ', shortLabel: 'Zdjęcia', icon: <IconImage /> },
    { key: 'travel', label: 'Podróż', icon: <IconPlane /> },
    { key: 'route', label: 'Trasa', icon: <IconRoute /> },
    TEXTS,
    STYLE,
    EXPORT,
  ],
  collage: [{ key: 'media', label: 'Układ', icon: <IconLayout /> }, { ...TEXTS, label: 'Teksty' }, STYLE, EXPORT],
}

// The travel planner is a feature; it fills its tab through the panel registry.
const TravelTab = () => <SubTabs tab="travel" own={[]} />

const PANELS: Record<TabKey, () => React.JSX.Element | null> = {
  background: BackgroundTab,
  media: MediaTab,
  travel: TravelTab,
  route: RouteTab,
  texts: ElementsTab,
  style: TemplatesTab,
  export: ExportTab,
}

export default function ControlPanel() {
  const tabs = MODE_TABS[useAppStore((s) => s.mode ?? 'map')]
  // Picking something whose settings live in a tab a collage lacks opens its first tab instead.
  const activeTab = useAppStore((s) => (tabs.some((t) => t.key === s.activeTab) ? s.activeTab : tabs[0].key))
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const Panel = PANELS[activeTab]

  return (
    <aside className="panel">
      <div className="panel-header">
        <h1>GPX Route Visualizer</h1>
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="tab-panel" role="tabpanel" id={tabPanelId(activeTab)} aria-labelledby={tabId(activeTab)} key={activeTab}>
        <Panel />
      </div>
    </aside>
  )
}
