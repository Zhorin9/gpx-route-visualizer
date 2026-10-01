import { IDENTITY_TRANSFORM, STYLE_PRESETS } from '../defaults'
import { trackDays } from '../derived'
import type { RouteSlice, SliceContext } from '../types'

export function createRouteSlice({ get, commit }: SliceContext): RouteSlice {
  return {
    updateRouteStyle: (patch) =>
      commit(`routeStyle:${Object.keys(patch).join()}`, (s) => ({ routeStyle: { ...s.routeStyle, ...patch } })),
    applyStylePreset: (preset) =>
      commit(`preset:${preset}`, (s) => ({ routeStyle: { ...s.routeStyle, ...STYLE_PRESETS[preset] } })),
    setRouteTransform: (transform) => commit('route:transform', { routeTransform: transform }),
    resetRouteTransform: () => commit('route:reset', { routeTransform: IDENTITY_TRANSFORM }),
    setRange: (range) => commit('range', { range }),
    setProgress: (value) => commit('progress', { progress: value }),

    selectDay: (dayIndex) => {
      const day = trackDays(get().track)[dayIndex]
      if (!day) return
      commit('range:day', (s) => ({
        range: { start: day.startIdx, end: day.endIdx },
        // Keep a custom label, just swap its number ("DZIEŃ 1" → "DZIEŃ 3").
        statsContent: { ...s.statsContent, dayLabel: s.statsContent.dayLabel.replace(/\d+/, String(dayIndex + 1)) },
      }))
    },
  }
}
