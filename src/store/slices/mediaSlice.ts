import { ASPECTS } from '../../utils/aspects'
import { parseGpxText } from '../../utils/gpx'
import { loadBackgroundImage } from '../../utils/image'
import { DEFAULT_BG_ADJUST, DEFAULT_STATS_CONTENT, IDENTITY_TRANSFORM } from '../defaults'
import type { MediaSlice, SliceContext } from '../types'

export function createMediaSlice({ set, get, commit, resetHistory }: SliceContext): MediaSlice {
  return {
    track: null,
    gpxError: '',
    background: null,
    backgroundError: '',

    loadGpxFile: async (file) => {
      try {
        const track = parseGpxText(await file.text())
        // Waypoints and history are anchored to the previous track — start clean.
        set((s) => ({
          track,
          gpxError: '',
          range: { start: 0, end: track.points.length - 1 },
          progress: 100,
          waypoints: [],
          routeTransform: IDENTITY_TRANSFORM,
          statsContent: { ...s.statsContent, overrides: DEFAULT_STATS_CONTENT.overrides },
          selection: s.selection?.kind === 'waypoint' ? null : s.selection,
        }))
        resetHistory()
      } catch (err) {
        set({ gpxError: err instanceof Error ? err.message : 'Nie udało się odczytać pliku GPX' })
      }
    },

    loadBackgroundFile: async (file) => {
      try {
        const background = await loadBackgroundImage(file)
        set({ background, backgroundError: '', bgAdjust: DEFAULT_BG_ADJUST })
      } catch {
        set({ backgroundError: 'Nie udało się wczytać zdjęcia' })
      }
    },

    removeBackground: () => set({ background: null, backgroundError: '' }),

    // Width is the same for every aspect, only height changes — scale vertical
    // positions so texts don't end up off-canvas.
    setAspectKey: (key) => {
      const prev = get().aspectKey
      if (prev === key) return
      const ratio = ASPECTS[key].h / ASPECTS[prev].h
      commit('aspect', (s) => ({
        aspectKey: key,
        texts: s.texts.map((t) => ({ ...t, y: t.y * ratio })),
        statsLayout: { ...s.statsLayout, y: s.statsLayout.y == null ? null : s.statsLayout.y * ratio },
        routeTransform: { ...s.routeTransform, y: s.routeTransform.y * ratio },
        bgAdjust: DEFAULT_BG_ADJUST,
      }))
    },

    updateBgAdjust: (patch) => commit(`bg:${Object.keys(patch).join()}`, (s) => ({ bgAdjust: { ...s.bgAdjust, ...patch } })),
    resetBgAdjust: () => commit('bg:reset', { bgAdjust: DEFAULT_BG_ADJUST }),
    setDimOpacity: (value) => commit('dim', { dimOpacity: value }),
  }
}
