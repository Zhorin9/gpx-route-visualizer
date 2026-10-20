import { registerCanvasElement } from '../../core/canvas/registry'
import { registerPanelSection } from '../../core/panel/registry'
import { IconBarChart } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import StatsHeaderNode, { STATS_KIND } from './canvas/StatsHeaderNode'
import StatsEditor, { StatsSection } from './panel/StatsEditor'

export function registerStats() {
  registerCanvasElement({
    kind: STATS_KIND,
    label: 'Nagłówek ze statystykami',
    meta: 'liczby',
    icon: <IconBarChart />,
    order: 10,
    useIsAvailable: useHasRoute,
    Node: StatsHeaderNode,
    Editor: StatsEditor,
    tab: 'data',
  })
  registerPanelSection({ id: 'stats', tab: 'data', order: 10, Component: StatsSection })
}
