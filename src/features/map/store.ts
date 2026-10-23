import { collageTone, withContrast } from '../../store/slices/mediaSlice'
import { toneOf, type Tone } from '../../utils/color'
import type { SliceContext } from '../../store/types'
import { mapStyle } from './model/styles'
import type { MapSettings } from './types'

export interface MapSlice {
  updateMap: (patch: Partial<MapSettings>) => void
  // Makes the map the background, with text and route in contrast to it.
  showMapBackground: () => void
}

// Light or dark, as the map will look: its palette or style, unless dimmed or lightened a lot.
export function mapTone(map: MapSettings): Tone {
  if (map.dim >= 0.35) return 'dark'
  if (map.dim <= -0.35) return 'light'
  const style = mapStyle(map.styleId)
  return map.palette && typeof style.url === 'string' ? toneOf(map.palette.land) : style.tone
}

export function createMapSlice({ commit }: SliceContext): MapSlice {
  return {
    updateMap: (patch) =>
      commit(`map:${Object.keys(patch).join()}`, (s) => {
        const map = { ...s.map, ...patch }
        return { map, ...(s.collage.bgKind === 'map' ? withContrast(s, s.collage, mapTone(s.map), mapTone(map)) : null) }
      }),
    showMapBackground: () => commit('background', (s) => withContrast(s, { ...s.collage, bgKind: 'map' }, collageTone(s.collage), mapTone(s.map))),
  }
}
