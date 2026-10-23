import { defaultTitlePlace } from '../../utils/aspects'
import { parseGpxText } from '../../utils/gpx'
import { DAY_COLORS, DEFAULT_STATS_CONTENT, IDENTITY_TRANSFORM, makeTitle, nextId } from '../defaults'
import { joinTrack } from '../derived'
import type { RouteSource, RouteStyle, TrackPart } from '../../types'
import type { RouteSourceSlice, SliceContext } from '../types'

// Keys are never reused, so a file brought back by undo can't pick up another file's points.
let lastSourceKey = 0
export const newSourceKey = () => `gpx-${++lastSourceKey}`

// Colours for a new list of parts. A part on its own is drawn in the route's style, so it brings
// its colour and line into it. With more, each part has its own colour: the one that used to stand
// alone takes over the route's, a new one (no colour yet) gets the first free one.
export function settleParts(before: TrackPart[], parts: TrackPart[], style: RouteStyle): { parts: TrackPart[]; routeStyle: RouteStyle } {
  if (parts.length === 1) return { parts, routeStyle: { ...style, color: parts[0].color || style.color, dashed: parts[0].dashed } }
  const alone = before.length === 1 ? before[0].id : null
  const kept = parts.map((p) => (p.id === alone ? { ...p, color: style.color, dashed: style.dashed } : p))
  const used = new Set(kept.map((p) => p.color.toLowerCase()))
  return {
    routeStyle: style,
    parts: kept.map((p) => {
      if (p.color) return p
      const color = DAY_COLORS.find((c) => !used.has(c)) ?? DAY_COLORS[used.size % DAY_COLORS.length]
      used.add(color)
      return { ...p, color }
    }),
  }
}

export function createRouteSourceSlice({ set, get, commit }: SliceContext): RouteSourceSlice {
  return {
    trackCache: {},
    gpxError: '',

    loadGpxFile: async (file, append = false) => {
      let parsed
      try {
        parsed = parseGpxText(await file.text())
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'nie jest plikiem GPX'
        set({ gpxError: `Plik „${file.name}” ${reason}. Sprawdź, czy to eksport GPX z zegarka lub aplikacji.` })
        return
      }
      const sourceKey = newSourceKey()
      const fileName = file.name.replace(/\.gpx$/i, '')
      set((s) => ({ trackCache: { ...s.trackCache, [sourceKey]: parsed.points }, gpxError: '' }))

      const s = get()
      const source = s.routeSource
      if (append && source) {
        // Another day: the file is joined to the track and keeps its own slice and colour.
        const part: TrackPart = { id: nextId(source.parts), name: parsed.name ?? fileName, color: '', dashed: false, visible: true, sourceKey }
        const routeSource: RouteSource = { ...source, parts: settleParts(source.parts, [...source.parts, part], s.routeStyle).parts }
        const joined = joinTrack(routeSource, get().trackCache)
        commit('route:append', {
          routeSource,
          range: { start: 0, end: (joined?.track.points.length ?? 1) - 1 },
          progress: 100,
        })
        return
      }

      // A new route: places and hand-made layout belonged to the previous one. Undo brings
      // them back together with the previous file, which stays in the cache.
      // The track name becomes the title, replacing the previous track's one.
      const name = (parsed.name ?? fileName).trim()
      const first: TrackPart = { id: 1, name: name || 'Dzień 1', color: s.routeStyle.color, dashed: s.routeStyle.dashed, visible: true, sourceKey }
      commit('route:load', (s) => ({
        texts: [
          ...s.texts.filter((t) => t.role !== 'title'),
          ...(name ? [makeTitle(nextId(s.texts), name, s.titleStyle, defaultTitlePlace(s.aspectKey))] : []),
        ],
        routeSource: { name: parsed.name, parts: [first] },
        range: { start: 0, end: parsed.points.length - 1 },
        progress: 100,
        waypoints: [],
        routeTransform: IDENTITY_TRANSFORM,
        sourceLayout: s.sourceLayout && { ...s.sourceLayout, route: IDENTITY_TRANSFORM },
        layoutOverrides: Object.fromEntries(Object.entries(s.layoutOverrides).map(([k, o]) => [k, { ...o, route: undefined }])),
        statsContent: { ...s.statsContent, overrides: DEFAULT_STATS_CONTENT.overrides },
        selection: s.selection?.kind === 'waypoint' ? null : s.selection,
      }))
    },

    updatePart: (id, patch) =>
      commit(`route:part:${id}:${Object.keys(patch).join()}`, (s) =>
        s.routeSource ? { routeSource: { ...s.routeSource, parts: s.routeSource.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) } } : {},
      ),

    removePart: (id) => {
      const s = get()
      const joined = joinTrack(s.routeSource, s.trackCache)
      const day = joined?.parts.find((d) => d.id === id)
      if (!s.routeSource || !joined || !day || joined.parts.length < 2) return
      const length = day.endIdx - day.startIdx + 1
      const shift = (i: number) => (i > day.endIdx ? i - length : i)
      const settled = settleParts(s.routeSource.parts, s.routeSource.parts.filter((d) => d.id !== id), s.routeStyle)
      const points = joined.track.points.length - length
      const waypoints = s.waypoints.filter((w) => w.trackPos < day.startIdx || w.trackPos > day.endIdx).map((w) => ({ ...w, trackPos: shift(w.trackPos) }))
      commit('route:remove', {
        routeSource: { ...s.routeSource, parts: settled.parts },
        // Back to one part: the route is drawn in that part's colour.
        routeStyle: settled.routeStyle,
        range: { start: 0, end: points - 1 },
        progress: 100,
        waypoints,
        selection: s.selection?.kind === 'waypoint' && !waypoints.some((w) => w.id === (s.selection as { id: number }).id) ? null : s.selection,
      })
    },
  }
}
