import { registerCanvasElement } from '../../core/canvas/registry'
import { registerPanelSection } from '../../core/panel/registry'
import { IconBarChart } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import StatsHeaderNode, { STATS_KIND } from './canvas/StatsHeaderNode'
import StatsEditor from './panel/StatsEditor'

export function registerStats() {
  registerCanvasElement({
    kind: STATS_KIND,
    label: 'stats.label',
    meta: 'stats.meta',
    icon: <IconBarChart />,
    order: 10,
    useIsAvailable: useHasRoute,
    Node: StatsHeaderNode,
    Editor: StatsEditor,
    tab: 'route',
    subTab: 'stats',
  })
  registerPanelSection({ id: 'stats', label: 'stats.section', tab: 'route', order: 30, Component: StatsEditor })
}
