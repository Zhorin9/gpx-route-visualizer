import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import BackgroundTab from './BackgroundTab'
import MediaTab from './MediaTab'
import RouteTab from './RouteTab'
import ElementsTab from './ElementsTab'
import TemplatesTab from './TemplatesTab'
import ExportTab from './ExportTab'
import { useAppStore } from '../../store/useAppStore'
import { IconDroplet, IconImage, IconRoute, IconType, IconPalette, IconDownload, IconUndo, IconRedo } from '../icons'
import Button from '../ui/Button'
import type { TabKey } from '../../types'

const TABS: TabDef<TabKey>[] = [
  { key: 'background', label: 'Tło', icon: <IconDroplet /> },
  { key: 'media', label: 'Zdjęcia i układ', shortLabel: 'Zdjęcia', icon: <IconImage /> },
  { key: 'route', label: 'Trasa', icon: <IconRoute /> },
  { key: 'texts', label: 'Napisy', icon: <IconType /> },
  { key: 'style', label: 'Styl', icon: <IconPalette /> },
  { key: 'export', label: 'Eksport', icon: <IconDownload /> },
]

const PANELS: Record<TabKey, () => React.JSX.Element> = {
  background: BackgroundTab,
  media: MediaTab,
  route: RouteTab,
  texts: ElementsTab,
  style: TemplatesTab,
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

  return (
    <aside className="panel">
      <div className="panel-header">
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
        <Panel />
      </div>
    </aside>
  )
}
