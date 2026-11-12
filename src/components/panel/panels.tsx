import MediaTab from './MediaTab'
import RouteTab from './RouteTab'
import ElementsTab from './ElementsTab'
import StylePanel from './StylePanel'
import SubTabs from '../../core/panel/SubTabs'
import type { PanelTab } from '../../types'

export const PANELS: Record<PanelTab, () => React.JSX.Element | null> = {
  route: RouteTab,
  media: MediaTab,
  texts: ElementsTab,
  style: () => <StylePanel />,
  // Animation and camera are features; they fill the tab through the panel registry.
  animation: () => <SubTabs tab="animation" own={[]} />,
}
