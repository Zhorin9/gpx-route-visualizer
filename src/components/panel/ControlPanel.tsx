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
import { IconDroplet, IconImage, IconRoute, IconType, IconPalette, IconDownload, IconPlane } from '../icons'
import type { TabKey } from '../../types'

const TABS: TabDef<TabKey>[] = [
  { key: 'background', label: 'Tło', icon: <IconDroplet /> },
  { key: 'media', label: 'Zdjęcia i układ', shortLabel: 'Zdjęcia', icon: <IconImage /> },
  { key: 'travel', label: 'Podróż', icon: <IconPlane /> },
  { key: 'route', label: 'Trasa', icon: <IconRoute /> },
  { key: 'texts', label: 'Napisy', icon: <IconType /> },
  { key: 'style', label: 'Styl', icon: <IconPalette /> },
  { key: 'export', label: 'Eksport', icon: <IconDownload /> },
]

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
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const Panel = PANELS[activeTab]

  return (
    <aside className="panel">
      <div className="panel-header">
        <h1>GPX Route Visualizer</h1>
      </div>
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="tab-panel" role="tabpanel" id={tabPanelId(activeTab)} aria-labelledby={tabId(activeTab)} key={activeTab}>
        <Panel />
      </div>
    </aside>
  )
}
