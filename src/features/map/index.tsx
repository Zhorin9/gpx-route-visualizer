import { registerBackgroundKind } from '../../core/background/registry'
import { addStageUnderlay } from '../../core/canvas/chrome'
import { registerCanvasElement } from '../../core/canvas/registry'
import { provideFrameUnderlay } from '../../core/export/frameSource'
import { IconMapPin } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { selectSeed } from '../../store/derived'
import i18n from '../../i18n'
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
  registerBackgroundKind({ kind: 'map', label: 'map.label', select: () => useAppStore.getState().showMapBackground(), Panel: MapPanel })
  addStageUnderlay(MapUnderlay)
  registerCanvasElement({
    kind: MAP_CREDIT_KIND,
    label: 'map.credit',
    meta: 'map.creditMeta',
    icon: <IconMapPin />,
    order: 90,
    useIsAvailable: useMapShown,
    Node: MapCreditNode,
    Editor: MapCreditFields,
    tab: 'style',
    subTab: 'background',
  })

  let lastUnderlay: { key: string; refs: unknown[]; image: HTMLCanvasElement } | null = null
  provideFrameUnderlay(async (width, height, scale) => {
    const scene = currentMapScene()
    const state = useAppStore.getState()
    if (state.collage.bgKind !== 'map' || !scene) return null
    const key = JSON.stringify([scene, width, height, scale, state.aspectKey, selectSeed(state)])
    const refs = [state.routeSource, state.trackCache, state.slides, state.sketchLayers]
    if (lastUnderlay?.key === key && lastUnderlay.refs.every((r, i) => r === refs[i])) return lastUnderlay.image
    const image = await renderUnderlay(state, scene, width, height, scale)
    if (image) lastUnderlay = { key, refs, image }
    return image
  })
}

// Files redraw the map at their own resolution; if it can't load, saving without it needs the person's consent.
async function renderUnderlay(state: AppState, scene: MapScene, width: number, height: number, scale: number) {
  const finish = (map: HTMLCanvasElement) => finishMap(map, scene.settings, FORMATS[state.aspectKey].w, scale, !mapIsSeeThrough(scene.settings), selectSeed(state))
  if (scene.settings.kind === 'sketch') return finish(await renderSketchImage(state, scene, scale))
  try {
    return finish(await renderMapImage(scene, width, height, scale))
  } catch {
    if (window.confirm(i18n.t('map.saveWithoutMap'))) return null
    throw new Error(i18n.t('map.loadFailed'))
  }
}
