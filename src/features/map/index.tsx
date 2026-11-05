import { registerBackgroundKind } from '../../core/background/registry'
import { addStageUnderlay } from '../../core/canvas/chrome'
import { registerCanvasElement } from '../../core/canvas/registry'
import { provideFrameUnderlay } from '../../core/export/frameSource'
import { IconMapPin } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import MapCreditNode from './canvas/MapCreditNode'
import MapUnderlay from './canvas/MapUnderlay'
import { ensureFontLoaded } from '../../utils/fonts'
import { newCanvas } from '../../utils/image'
import type { AppState } from '../../store/types'
import { currentMapScene, renderMapImage, type MapScene } from './maplibre'
import { finishMap } from './model/mood'
import { FORMATS } from '../../core/formats/registry'
import { drawSketch } from './sketch/draw'
import { sketchFrame } from './sketch/frame'
import { BUILT_IN_STYLES, registerMapStyle } from './model/styles'
import MapPanel, { MapCreditFields } from './panel/MapPanel'
import { MAP_CREDIT_KIND, mapIsSeeThrough } from './types'
import './map.css'

const useMapShown = () => useAppStore((s) => s.collage.bgKind === 'map')

async function renderSketchImage(state: AppState, scene: MapScene, scale: number): Promise<HTMLCanvasElement> {
  await ensureFontLoaded('Caveat')
  const frame = sketchFrame(state, scene.fit, scene.transform)
  const { canvas, ctx } = newCanvas(Math.round(frame.width * scale), Math.round(frame.height * scale))
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

  // Files redraw the map at their own resolution; if it can't load, saving without it needs the person's consent.
  provideFrameUnderlay(async (width, height, scale) => {
    const scene = currentMapScene()
    const state = useAppStore.getState()
    if (state.collage.bgKind !== 'map' || !scene) return null
    const finish = (map: HTMLCanvasElement) => finishMap(map, scene.settings, FORMATS[state.aspectKey].w, scale, !mapIsSeeThrough(scene.settings))
    if (scene.settings.kind === 'sketch') return finish(await renderSketchImage(state, scene, scale))
    try {
      return finish(await renderMapImage(scene, width, height, scale))
    } catch {
      if (window.confirm('Mapa się nie wczytała (brak połączenia?). Zapisać grafikę bez mapy?')) return null
      throw new Error('Mapa się nie wczytała. Sprawdź połączenie i spróbuj ponownie.')
    }
  })
}
