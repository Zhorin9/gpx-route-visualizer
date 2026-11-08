import Tabs, { type TabDef } from '../Tabs'
import { tabId, tabPanelId } from '../tabIds'
import BackgroundTab from './BackgroundTab'
import MediaTab from './MediaTab'
import RouteTab from './RouteTab'
import ElementsTab from './ElementsTab'
import TemplatesPage from './TemplatesPage'
import ColorsPage from './ColorsPage'
import WrapperSection from './WrapperSection'
import SlideStylePage from './SlideStylePage'
import SubTabs, { type OwnPage } from '../../core/panel/SubTabs'
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

function StylePanel() {
  const series = useAppStore((s) => s.slides.length > 1 && s.carouselKind === 'slides')
  const own: OwnPage[] = [
    { id: 'presets', label: 'controlPanel.templates', Component: TemplatesPage },
    { id: 'colors', label: 'controlPanel.colors', Component: ColorsPage },
    { id: 'background', label: 'controlPanel.background', Component: BackgroundTab },
    { id: 'wrapper', label: 'controlPanel.wrapper', Component: WrapperSection },
    ...(series ? [{ id: 'slide', label: 'controlPanel.thisSlide', Component: SlideStylePage } as const] : []),
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
