import { registerCanvasElement } from '../../core/canvas/registry'
import { registerPanelSection } from '../../core/panel/registry'
import { provideRouteColoring } from '../../core/route/providers'
import { IconPalette } from '../../components/icons'
import { useHasRoute } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import ColorLegendNode from './canvas/ColorLegendNode'
import ColorLegendEditor, { ColorPage } from './panel/DataColorEditor'
import { LEGEND_KIND } from './types'
import { useActiveDataColor, useDataColoring } from './useDataColoring'

function useLegendAvailable() {
  const legend = useAppStore((s) => s.dataColor.legend)
  const active = useActiveDataColor()
  return useHasRoute() && legend && active != null
}

export function registerDataColor() {
  provideRouteColoring(useDataColoring)
  registerCanvasElement({
    kind: LEGEND_KIND,
    label: 'Legenda kolorów',
    meta: 'skala',
    icon: <IconPalette />,
    order: 30,
    useIsAvailable: useLegendAvailable,
    Node: ColorLegendNode,
    Editor: ColorLegendEditor,
    tab: 'route',
    subTab: 'color',
  })
  registerPanelSection({ id: 'color', label: 'Kolor', tab: 'route', order: 10, Component: ColorPage })
}
