import type { Map as MapLibreMap, MapOptions } from 'maplibre-gl'
// Built by Vite with its imports: MapLibre would look for its worker next to its own (bundled) file.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { mapCamera } from './model/placement'
import { buildStyle, mapFilter, type StyleJson } from './model/styles'
import type { MercatorFit } from '../../utils/gpx'
import type { RouteTransform } from '../../types'
import type { MapSettings } from './types'

// MapLibre is large; it loads the first time a map is shown, not with the app.
let library: Promise<typeof import('maplibre-gl')> | null = null
export const loadMapLibre = () =>
  (library ??= Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]).then(([lib]) => {
    lib.setWorkerUrl(workerUrl)
    return lib
  }))

export type MapStyleInput = Exclude<MapOptions['style'], string | undefined>
export const asStyle = (style: StyleJson) => style as unknown as MapStyleInput

// Everything a frame's map depends on: the preview publishes it, files are rendered from it.
export interface MapScene {
  settings: MapSettings
  fit: MercatorFit | null
  // The route's transform composed with the camera, so the map lies under the route as drawn.
  transform: RouteTransform
}

let scene: MapScene | null = null

export function publishMapScene(value: MapScene | null) {
  scene = value
}

export const currentMapScene = () => scene

// Resolves once the map has drawn everything for its view; after a long wait it goes on with
// what is there, so a slow network can't hang an export.
export function settled(map: MapLibreMap, timeoutMs = 20_000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    map.once('idle', () => {
      clearTimeout(timer)
      resolve(true)
    })
    map.triggerRepaint()
  })
}

// The hidden map files are drawn with: one instance, reused frame after frame so tiles loaded
// once stay in its cache.
let hidden: { map: MapLibreMap; container: HTMLDivElement; styleKey: string } | null = null

// A wide ribbon at 2× would pass the WebGL canvas limit, so it is drawn in strips.
const MAX_STRIP_PX = 4096

async function hiddenMap(scale: number) {
  if (!hidden) {
    const { Map } = await loadMapLibre()
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none'
    document.body.appendChild(container)
    const map = new Map({
      container,
      style: { version: 8, sources: {}, layers: [] },
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      pixelRatio: scale,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })
    hidden = { map, container, styleKey: '' }
  }
  if (hidden.map.getPixelRatio() !== scale) hidden.map.setPixelRatio(scale)
  return hidden
}

export const styleKey = (s: MapSettings) => JSON.stringify([s.styleId, s.palette, s.labels, s.hillshade])

// The map of a whole ribbon (`width` × `height` frame pixels) at `scale`, as the scene says,
// dimmed, tinted and blurred as set. Throws when the map can't be loaded at all.
export async function renderMapImage(scene: MapScene, width: number, height: number, scale: number): Promise<HTMLCanvasElement> {
  const h = await hiddenMap(scale)
  const key = styleKey(scene.settings)
  if (h.styleKey !== key) {
    h.map.setStyle(asStyle(await buildStyle(scene.settings)))
    h.styleKey = key
  }
  const out = document.createElement('canvas')
  out.width = Math.round(width * scale)
  out.height = Math.round(height * scale)
  const ctx = out.getContext('2d')
  if (!ctx) return out
  ctx.filter = mapFilter(scene.settings, scale)
  const strip = Math.floor(MAX_STRIP_PX / scale)
  for (let x = 0; x < width; x += strip) {
    const w = Math.min(strip, width - x)
    h.container.style.width = `${w}px`
    h.container.style.height = `${height}px`
    h.map.resize()
    h.map.jumpTo(mapCamera(scene.fit, scene.transform, { x: x + w / 2, y: height / 2 }))
    await settled(h.map)
    ctx.drawImage(h.map.getCanvas(), Math.round(x * scale), 0, Math.round(w * scale), out.height)
  }
  ctx.filter = 'none'
  const { dim } = scene.settings
  if (dim !== 0) {
    ctx.fillStyle = dim > 0 ? `rgba(0,0,0,${dim})` : `rgba(255,255,255,${-dim})`
    ctx.fillRect(0, 0, out.width, out.height)
  }
  return out
}
