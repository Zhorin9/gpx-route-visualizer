import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import BackgroundTab from './BackgroundTab'
import MediaTab from './MediaTab'
import RouteTab from './RouteTab'
import ElementsTab from './ElementsTab'
import TemplatesTab from './TemplatesTab'
import { SlideStylePage } from './SlidePanel'
import SubTabs from '../../core/panel/SubTabs'
import { useAppStore } from '../../store/useAppStore'
import { IconImage, IconRoute, IconType, IconPalette, IconPlay } from '../icons'
import type { PanelTab, ProjectMode } from '../../types'

const TABS: TabDef<PanelTab>[] = [
  { key: 'route', label: 'Mapa', icon: <IconRoute /> },
  { key: 'media', label: 'Zdjęcia', icon: <IconImage /> },
  { key: 'texts', label: 'Teksty', icon: <IconType /> },
  { key: 'style', label: 'Styl', icon: <IconPalette /> },
  { key: 'animation', label: 'Animacja', icon: <IconPlay /> },
]

// A collage has no route or map.
const MODE_TABS: Record<ProjectMode, TabDef<PanelTab>[]> = {
  map: TABS,
  collage: TABS.filter((t) => t.key !== 'route'),
}

// The project's presets and background; in a series also the selected slide's own.
function StylePanel() {
  const series = useAppStore((s) => s.slides.length > 1 && s.carouselKind === 'slides')
  const own = [
    { id: 'presets', label: 'Presety', Component: TemplatesTab },
    { id: 'background', label: 'Tło', Component: BackgroundTab },
    ...(series ? [{ id: 'slide', label: 'Ten slajd', Component: SlideStylePage }] : []),
  ]
  return <SubTabs tab="style" own={own} />
}

// Animation and camera are features; they fill the tab through the panel registry.
const AnimationPanel = () => <SubTabs tab="animation" own={[]} />

const PANELS: Record<PanelTab, () => React.JSX.Element | null> = {
  route: RouteTab,
  media: MediaTab,
  texts: ElementsTab,
  style: StylePanel,
  animation: AnimationPanel,
}

export default function ControlPanel() {
  const tabs = MODE_TABS[useAppStore((s) => s.mode ?? 'map')]
  // Picking something whose settings live in a tab a collage lacks opens its first tab instead.
  const activeTab = useAppStore((s) => tabs.find((t) => t.key === s.activeTab)?.key ?? tabs[0].key)
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
