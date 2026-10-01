import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import MediaTab from './MediaTab'
import StatsTab from './StatsTab'
import RangeTab from './RangeTab'
import StyleTab from './StyleTab'
import TextsTab from './TextsTab'
import PlacesTab from './PlacesTab'
import ExportTab from './ExportTab'
import { useAppStore } from '../../store/useAppStore'
import { IconImage, IconBarChart, IconSliders, IconDroplet, IconType, IconMapPin, IconDownload, IconUndo, IconRedo } from '../icons'
import Button from '../ui/Button'
import type { TabKey } from '../../types'

const TABS: TabDef<TabKey>[] = [
  { key: 'media', label: 'Media', icon: <IconImage /> },
  { key: 'range', label: 'Zakres', icon: <IconSliders /> },
  { key: 'style', label: 'Styl trasy', shortLabel: 'Styl', icon: <IconDroplet /> },
  { key: 'stats', label: 'Nagłówek ze statystykami', shortLabel: 'Liczby', icon: <IconBarChart /> },
  { key: 'texts', label: 'Teksty', icon: <IconType /> },
  { key: 'places', label: 'Miejsca', icon: <IconMapPin /> },
  { key: 'export', label: 'Eksport', icon: <IconDownload /> },
]

const PANELS: Record<TabKey, () => React.JSX.Element> = {
  media: MediaTab,
  range: RangeTab,
  style: StyleTab,
  stats: StatsTab,
  texts: TextsTab,
  places: PlacesTab,
  export: ExportTab,
}

export default function ControlPanel() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const canUndo = useAppStore((s) => s.past.length > 0)
  const canRedo = useAppStore((s) => s.future.length > 0)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)

  const Panel = PANELS[activeTab]
  const activeDef = TABS.find((t) => t.key === activeTab)!

  return (
    <aside className="panel">
      <div className="panel-header">
        <span className="brand-dot" aria-hidden="true" />
        <h1>GPX Route Visualizer</h1>
        <Button size="icon" variant="ghost" title="Cofnij (Ctrl+Z)" aria-label="Cofnij" onClick={undo} disabled={!canUndo}>
          <IconUndo />
        </Button>
        <Button size="icon" variant="ghost" title="Ponów (Ctrl+Shift+Z)" aria-label="Ponów" onClick={redo} disabled={!canRedo}>
          <IconRedo />
        </Button>
      </div>
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="tab-panel" role="tabpanel" id={tabPanelId(activeTab)} aria-labelledby={tabId(activeTab)} key={activeTab}>
        <h2 className="tab-title">{activeDef.label}</h2>
        <Panel />
      </div>
    </aside>
  )
}
