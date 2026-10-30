import { describe, expect, it, vi } from 'vitest'
import { applyTransform, pointAt } from '../../utils/geometry'
import { fitMercator, mercatorX, mercatorY, projectWithFit } from '../../utils/gpx'
import { mapCamera, type MapCamera } from './model/placement'
import { BUILT_IN_STYLES, buildStyle, paletteFrom, registerMapStyle, type StyleJson } from './model/styles'
import type { GpxPoint, RouteTransform } from '../../types'

const at = (lat: number, lon: number): GpxPoint => ({ lat, lon, ele: 0, time: null })
const GDANSK = at(54.352, 18.6466)
const ISTANBUL = at(41.0082, 28.9784)
const TROMSO = at(69.6496, 18.956)

// Where MapLibre draws a place: offset from the centre in world pixels, turned by the bearing
// (a positive bearing turns the map anticlockwise), around the middle of a w × h map.
function onMap(p: GpxPoint, cam: MapCamera, w: number, h: number) {
  const world = 512 * 2 ** cam.zoom
  const dx = (mercatorX(p.lon) - mercatorX(cam.center[0])) * world
  const dy = (mercatorY(p.lat) - mercatorY(cam.center[1])) * world
  const rad = (-cam.bearing * Math.PI) / 180
  return { x: w / 2 + dx * Math.cos(rad) - dy * Math.sin(rad), y: h / 2 + dx * Math.sin(rad) + dy * Math.cos(rad) }
}

describe('map under the route', () => {
  const route = [GDANSK, ISTANBUL, TROMSO]
  const fit = fitMercator(route, 1080, 1920)
  const flat = projectWithFit(route, fit)
  const transforms: RouteTransform[] = [
    { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    { x: 120, y: -80, scaleX: 1.6, scaleY: 1.6, rotation: 25 },
    { x: 900, y: 300, scaleX: 0.7, scaleY: 0.7, rotation: -110 },
  ]

  it('puts every place of the route on the same pixel of the map, also turned and scaled', () => {
    for (const t of transforms) {
      for (const pixel of [1, 0.4, 2]) {
        const cam = mapCamera(fit, t, { x: 540, y: 960 }, pixel)
        route.forEach((p, i) => {
          const line = applyTransform(pointAt(flat, i), t)
          const map = onMap(p, cam, 1080 * pixel, 1920 * pixel)
          expect(Math.abs(map.x - line.x * pixel)).toBeLessThan(1)
          expect(Math.abs(map.y - line.y * pixel)).toBeLessThan(1)
        })
      }
    }
  })

  it('centres each tile of a wide ribbon on its own middle', () => {
    const t = transforms[1]
    const cam = mapCamera(fit, t, { x: 1620, y: 960 })
    const line = applyTransform(pointAt(flat, 1), t)
    const map = onMap(ISTANBUL, cam, 1080, 1920)
    expect(Math.abs(map.x + 1080 - line.x)).toBeLessThan(1)
    expect(Math.abs(map.y - line.y)).toBeLessThan(1)
  })
})

describe('map style', () => {
  const base: StyleJson = {
    version: 8,
    sources: { openmaptiles: {}, ne2_shaded: {} },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
      { id: 'relief', type: 'raster', source: 'ne2_shaded' },
      { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#00f' } },
      { id: 'road', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': ['get', 'c'] } },
      { id: 'poi', type: 'symbol', 'source-layer': 'poi', layout: { 'icon-image': 'x', 'text-field': '{name}' } },
      { id: 'city', type: 'symbol', 'source-layer': 'place', layout: { 'text-field': '{name}' }, paint: { 'text-color': '#000' } },
      { id: 'shield', type: 'symbol', 'source-layer': 'transportation_name', layout: { 'text-field': ['to-string', ['get', 'ref']] } },
    ],
  }
  const palette = paletteFrom({ from: '#123a63', to: '#123a63' }, '#e4f0ff')

  it('repaints an OpenMapTiles style in the template palette and drops what the palette cannot colour', async () => {
    BUILT_IN_STYLES.forEach(registerMapStyle)
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify(base)))
    const style = await buildStyle({ styleId: 'positron', palette, labels: true, hillshade: true })
    const byId = Object.fromEntries(style.layers.map((l) => [l.id, l]))
    expect(byId.background.paint?.['background-color']).toBe('#123a63')
    expect(byId.water.paint?.['fill-color']).toBe(palette.water)
    expect(byId.road.paint?.['line-color']).toBe(palette.road)
    expect(byId.city.paint?.['text-color']).toBe('#e4f0ff')
    // Names in Polish where the tiles have them; road numbers as they are.
    expect(byId.city.layout?.['text-field']).toEqual(['coalesce', ['get', 'name:pl'], ['get', 'name:latin'], ['get', 'name']])
    expect(byId.shield.layout?.['text-field']).toEqual(['to-string', ['get', 'ref']])
    expect(byId.relief).toBeUndefined()
    expect(byId.poi).toBeUndefined()
    // Terrain shading sits under the water.
    expect(style.layers.map((l) => l.id).indexOf('terrain-shade')).toBe(style.layers.map((l) => l.id).indexOf('water') - 1)
    const plain = await buildStyle({ styleId: 'positron', palette: null, labels: false, hillshade: false })
    expect(plain.layers.some((l) => l.type === 'symbol')).toBe(false)
    expect(plain.layers.find((l) => l.id === 'road')?.paint?.['line-color']).toEqual(['get', 'c'])
    // The style is fetched once and repainted from the same copy.
    expect(fetch).toHaveBeenCalledTimes(1)
    fetch.mockRestore()
  })
})

describe('map background in the document', () => {
  it('turns text dark on a light map and takes the preset colours when a template is applied', async () => {
    const { useAppStore } = await import('../../store/useAppStore')
    const { BUILT_IN_TEMPLATES } = await import('../../utils/templates')
    BUILT_IN_STYLES.forEach(registerMapStyle)
    const get = () => useAppStore.getState()
    get().showMapBackground()
    expect(get().collage.bgKind).toBe('map')
    expect(get().statsStyle.color).toBe('#2d2b2b')

    const topo = BUILT_IN_TEMPLATES.find((t) => t.id === 'topo')!
    get().applyTemplate(topo, { fonts: false, route: false, frame: false, colors: true, layout: false, points: false })
    expect(get().collage.bgKind).toBe('map')
    expect(get().map.palette?.land).toBe('#e9e4d3')
    expect(get().map.hillshade).toBe(true)
    get().undo()
    expect(get().map.palette).toBeNull()
  })
})
