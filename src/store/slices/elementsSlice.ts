import { FORMATS } from '../../core/formats/registry'
import i18n from '../../i18n'
import { makeText, makeWaypoint, nextId } from '../defaults'
import { TEXT_KINDS } from '../textKinds'
import { selectTrack } from '../derived'
import { routeCaptions } from '../../utils/routeCaptions'

// Large, as on the board, the distance larger still; each stands off its point to its own side.
const END_CAPTIONS = [
  { dx: 30, dy: 40, fontSize: 40 },
  { dx: 40, dy: -60, fontSize: 40 },
]
const DISTANCE_CAPTION = { dx: -200, dy: -40, fontSize: 52 }
import type { ElementsSlice, SliceContext } from '../types'


// Derived from the list rather than a module counter, so ids stay unique after undo.
export function createElementsSlice({ get, commit }: SliceContext): ElementsSlice {
  const slice: ElementsSlice = {
    addText: (kind = 'text') => {
      const s = get()
      const { w, h } = FORMATS[s.aspectKey]
      const base = makeText(nextId(s.texts), w, h)
      const shown = { ...base, x: base.x + Math.min(s.activeSlide, s.slides.length - 1) * w }
      const node = { ...shown, ...TEXT_KINDS[kind](s.statsStyle.color, shown) }
      commit('text:add', {
        texts: [...s.texts, node],
        selection: { kind: 'text', id: node.id },
        activeTab: 'texts',
      })
      return node.id
    },
    setIconFinish: (iconFinish) => commit('iconFinish', { iconFinish }),
    updateMapSticker: (patch) => commit('mapSticker', (s) => ({ mapSticker: { ...s.mapSticker, ...patch } })),
    setKicker: (patch) => commit('kicker', (s) => ({ kicker: { ...s.kicker, ...patch } })),
    setStamp: (stamp) => commit('stamp', { stamp, ...(stamp ? null : { selection: null }) }),
    updatePhotoLook: (patch) => commit('photoLook', (s) => ({ photoLook: { ...s.photoLook, ...patch } })),
    updateSticker: (patch) => commit('sticker', (s) => (s.sticker ? { sticker: { ...s.sticker, ...patch } } : {})),
    updateText: (id, patch) =>
      commit(`text:${id}:${Object.keys(patch).join()}`, (s) => ({
        texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    deleteText: (id) => {
      commit('text:delete', (s) => ({
        texts: s.texts.filter((t) => t.id !== id),
        selection: s.selection?.kind === 'text' && s.selection.id === id ? null : s.selection,
      }))
      get().showToast(i18n.t('elementsSlice.textDeleted'), 'undo')
    },

    addWaypoint: (trackPos) => {
      const s = get()
      const node = makeWaypoint(nextId(s.waypoints), trackPos)
      commit('waypoint:add', {
        waypoints: [...s.waypoints, node],
        selection: { kind: 'waypoint', id: node.id },
        addingWaypoint: false,
        activeTab: s.activeTab === 'texts' ? 'texts' : 'route',
      })
      return node.id
    },
    addRouteCaptions: () => {
      const s = get()
      const points = selectTrack(s)?.points
      if (!points) return
      const first = nextId(s.waypoints)
      const captions = routeCaptions(points, s.range, s.statsContent.units)
      const added = captions.map(({ trackPos, text }, i) => ({
        ...makeWaypoint(first + i, trackPos),
        text,
        ...(i === captions.length - 1 ? DISTANCE_CAPTION : END_CAPTIONS[i]),
      }))
      commit('waypoint:captions', { waypoints: [...s.waypoints, ...added] })
    },
    updateWaypoint: (id, patch) =>
      commit(`waypoint:${id}:${Object.keys(patch).join()}`, (s) => ({
        waypoints: s.waypoints.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      })),
    updatePointStyle: (patch) => commit(`points:${Object.keys(patch).join()}`, (s) => ({ pointStyle: { ...s.pointStyle, ...patch } })),
    deleteWaypoint: (id) => {
      commit('waypoint:delete', (s) => ({
        waypoints: s.waypoints.filter((w) => w.id !== id),
        selection: s.selection?.kind === 'waypoint' && s.selection.id === id ? null : s.selection,
      }))
      get().showToast(i18n.t('elementsSlice.waypointDeleted'), 'undo')
    },

    applyGlobalFont: (family) => {
      commit('globalFont', (s) => ({
        statsStyle: { ...s.statsStyle, fontFamily: family },
        titleStyle: { ...s.titleStyle, fontFamily: family },
        texts: s.texts.map((t) => ({ ...t, fontFamily: family })),
        waypoints: s.waypoints.map((w) => ({ ...w, fontFamily: family })),
      }))
      get().showToast(i18n.t('elementsSlice.fontChanged'), 'undo')
    },

    setPlacement: (kind, placement) => commit(`element:move:${kind}`, (s) => ({ placements: { ...s.placements, [kind]: placement } })),

    deleteSelection: () => {
      const sel = get().selection
      if (!sel) return
      if (sel.kind === 'text') slice.deleteText(sel.id)
      else if (sel.kind === 'waypoint') slice.deleteWaypoint(sel.id)
    },

    nudgeSelection: (dx, dy) => {
      const s = get()
      const sel = s.selection
      if (!sel) return
      if (sel.kind === 'text') {
        commit(`nudge:text:${sel.id}`, {
          texts: s.texts.map((t) => (t.id === sel.id ? { ...t, x: t.x + dx, y: t.y + dy } : t)),
        })
      } else if (sel.kind === 'waypoint') {
        commit(`nudge:waypoint:${sel.id}`, {
          waypoints: s.waypoints.map((w) => (w.id === sel.id ? { ...w, dx: w.dx + dx, dy: w.dy + dy } : w)),
        })
      }
    },
  }
  return slice
}
