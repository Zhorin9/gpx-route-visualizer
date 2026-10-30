import { collageTone, withContrast } from '../../store/slices/mediaSlice'
import { selectTrack } from '../../store/derived'
import { toneOf, type Tone } from '../../utils/color'
import type { SliceContext } from '../../store/types'
import { mapStyle } from './model/styles'
import { sketchPalette } from './sketch/draw'
import { seedOf } from './sketch/frame'
import { fetchSketchLayers, type SketchLayers } from './sketch/tiles'
import type { MapSettings } from './types'

export interface MapSlice {
  // OSM features for the sketch by route (its seed), fetched once; null when they couldn't be.
  // Outside the history, like the routes' points.
  sketchLayers: Record<number, SketchLayers | null>
  // Fetches the current route's features unless they are there; `retry` asks again after a failure.
  loadSketchLayers: (retry?: boolean) => void
  updateMap: (patch: Partial<MapSettings>) => void
  // Makes the map the background, with text and route in contrast to it.
  showMapBackground: () => void
}

// Light or dark, as the map will look: its palette or style, unless dimmed or lightened a lot.
export function mapTone(map: MapSettings): Tone {
  if (map.kind === 'sketch') return toneOf(sketchPalette(map).paper)
  if (map.dim >= 0.35) return 'dark'
  if (map.dim <= -0.35) return 'light'
  const style = mapStyle(map.styleId)
  return map.palette && typeof style.url === 'string' ? toneOf(map.palette.land) : style.tone
}

const loading = new Set<number>()

export function createMapSlice({ set, get, commit }: SliceContext): MapSlice {
  return {
    sketchLayers: {},
    loadSketchLayers: (retry = false) => {
      const points = selectTrack(get())?.points
      if (!points) return
      const seed = seedOf(points)
      if (loading.has(seed) || (!retry && seed in get().sketchLayers)) return
      loading.add(seed)
      fetchSketchLayers(points)
        .catch(() => null)
        .then((layers) => {
          loading.delete(seed)
          set((s) => ({ sketchLayers: { ...s.sketchLayers, [seed]: layers } }))
        })
    },
    updateMap: (patch) =>
      commit(`map:${Object.keys(patch).join()}`, (s) => {
        const map = { ...s.map, ...patch }
        return { map, ...(s.collage.bgKind === 'map' ? withContrast(s, s.collage, mapTone(s.map), mapTone(map)) : null) }
      }),
    showMapBackground: () => commit('background', (s) => withContrast(s, { ...s.collage, bgKind: 'map' }, collageTone(s.collage), mapTone(s.map))),
  }
}
