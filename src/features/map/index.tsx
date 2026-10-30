import { registerBackgroundKind } from '../../core/background/registry'
import { addStageUnderlay } from '../../core/canvas/chrome'
import { registerCanvasElement } from '../../core/canvas/registry'
import { provideFrameUnderlay } from '../../core/export/frameSource'
import { IconMapPin } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import MapCreditNode from './canvas/MapCreditNode'
import MapUnderlay from './canvas/MapUnderlay'
import { ensureFontLoaded } from '../../utils/fonts'
import type { AppState } from '../../store/types'
import { currentMapScene, renderMapImage, type MapScene } from './maplibre'
import { drawSketch } from './sketch/draw'
import { sketchFrame } from './sketch/frame'
import { BUILT_IN_STYLES, registerMapStyle } from './model/styles'
import MapPanel, { MapCreditFields } from './panel/MapPanel'
import { MAP_CREDIT_KIND } from './types'
import './map.css'

const useMapShown = () => useAppStore((s) => s.collage.bgKind === 'map')

// The sketch for files: the preview's own drawing, at the output's resolution.
async function renderSketchImage(state: AppState, scene: MapScene, scale: number): Promise<HTMLCanvasElement> {
  await ensureFontLoaded('Caveat')
  const frame = sketchFrame(state, scene.fit, scene.transform)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(frame.width * scale)
  canvas.height = Math.round(frame.height * scale)
  const ctx = canvas.getContext('2d')
  if (ctx) drawSketch(ctx, frame, scale)
  return canvas
}

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
    tab: 'style',
    subTab: 'background',
  })

  // Files get the map drawn again at their own resolution, fully loaded, under the frame.
  // When it can't be loaded at all, the file is saved without it only if the person agrees.
  provideFrameUnderlay(async (width, height, scale) => {
    const scene = currentMapScene()
    const state = useAppStore.getState()
    if (state.collage.bgKind !== 'map' || !scene) return null
    if (scene.settings.kind === 'sketch') return renderSketchImage(state, scene, scale)
    try {
      return await renderMapImage(scene, width, height, scale)
    } catch {
      if (window.confirm('Mapa się nie wczytała (brak połączenia?). Zapisać grafikę bez mapy?')) return null
      throw new Error('Mapa się nie wczytała. Sprawdź połączenie i spróbuj ponownie.')
    }
  })
}
