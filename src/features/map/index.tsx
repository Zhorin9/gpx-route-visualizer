import { registerBackgroundKind } from '../../core/background/registry'
import { addStageUnderlay } from '../../core/canvas/chrome'
import { registerCanvasElement } from '../../core/canvas/registry'
import { provideFrameUnderlay } from '../../core/export/frameSource'
import { IconMapPin } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import MapCreditNode from './canvas/MapCreditNode'
import MapUnderlay from './canvas/MapUnderlay'
import { currentMapScene, renderMapImage } from './maplibre'
import { BUILT_IN_STYLES, registerMapStyle } from './model/styles'
import MapPanel, { MapCreditFields } from './panel/MapPanel'
import { MAP_CREDIT_KIND } from './types'
import './map.css'

const useMapShown = () => useAppStore((s) => s.collage.bgKind === 'map')

export function registerMap() {
  for (const style of BUILT_IN_STYLES) registerMapStyle(style)
  registerBackgroundKind({ kind: 'map', label: 'Mapa', select: () => useAppStore.getState().showMapBackground(), Panel: MapPanel })
  addStageUnderlay(MapUnderlay)
  registerCanvasElement({
    kind: MAP_CREDIT_KIND,
    label: 'Źródło mapy',
    meta: 'wymagane',
    icon: <IconMapPin />,
    order: 90,
    useIsAvailable: useMapShown,
    Node: MapCreditNode,
    Editor: MapCreditFields,
    tab: 'background',
  })

  // Files get the map drawn again at their own resolution, fully loaded, under the frame.
  // When it can't be loaded at all, the file is saved without it only if the person agrees.
  provideFrameUnderlay(async (width, height, scale) => {
    const scene = currentMapScene()
    if (useAppStore.getState().collage.bgKind !== 'map' || !scene) return null
    try {
      return await renderMapImage(scene, width, height, scale)
    } catch {
      if (window.confirm('Mapa się nie wczytała (brak połączenia?). Zapisać grafikę bez mapy?')) return null
      throw new Error('Mapa się nie wczytała. Sprawdź połączenie i spróbuj ponownie.')
    }
  })
}
