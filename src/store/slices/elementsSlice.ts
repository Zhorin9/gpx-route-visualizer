import { ASPECTS } from '../../utils/aspects'
import { makeText, makeWaypoint, nextId } from '../defaults'
import type { ElementsSlice, SliceContext } from '../types'

// Derived from the list rather than a module counter, so ids stay unique after undo.
export function createElementsSlice({ get, commit }: SliceContext): ElementsSlice {
  const slice: ElementsSlice = {
    addText: () => {
      const s = get()
      const { w, h } = ASPECTS[s.aspectKey]
      const base = makeText(nextId(s.texts), w, h)
      const node = { ...base, x: base.x + Math.min(s.activeSlide, s.slides.length - 1) * w }
      commit('text:add', {
        texts: [...s.texts, node],
        selection: { kind: 'text', id: node.id },
        activeTab: 'texts',
      })
      return node.id
    },
    updateText: (id, patch) =>
      commit(`text:${id}:${Object.keys(patch).join()}`, (s) => ({
        texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    deleteText: (id) => {
      commit('text:delete', (s) => ({
        texts: s.texts.filter((t) => t.id !== id),
        selection: s.selection?.kind === 'text' && s.selection.id === id ? null : s.selection,
      }))
      get().showToast('Usunięto tekst', 'undo')
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
    updateWaypoint: (id, patch) =>
      commit(`waypoint:${id}:${Object.keys(patch).join()}`, (s) => ({
        waypoints: s.waypoints.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      })),
    deleteWaypoint: (id) => {
      commit('waypoint:delete', (s) => ({
        waypoints: s.waypoints.filter((w) => w.id !== id),
        selection: s.selection?.kind === 'waypoint' && s.selection.id === id ? null : s.selection,
      }))
      get().showToast('Usunięto miejscowość', 'undo')
    },

    applyGlobalFont: (family) => {
      commit('globalFont', (s) => ({
        statsStyle: { ...s.statsStyle, fontFamily: family },
        titleStyle: { ...s.titleStyle, fontFamily: family },
        texts: s.texts.map((t) => ({ ...t, fontFamily: family })),
        waypoints: s.waypoints.map((w) => ({ ...w, fontFamily: family })),
      }))
      get().showToast('Zmieniono czcionkę wszędzie', 'undo')
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
