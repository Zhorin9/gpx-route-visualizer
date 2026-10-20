import { DEFAULT_STATS_LAYOUT } from '../defaults'
import type { SliceContext, StatsSlice } from '../types'

export function createStatsSlice({ commit }: SliceContext): StatsSlice {
  return {
    updateStatsStyle: (patch) =>
      commit(`statsStyle:${Object.keys(patch).join()}`, (s) => ({ statsStyle: { ...s.statsStyle, ...patch } })),
    updateStatsContent: (patch) =>
      commit(`statsContent:${Object.keys(patch).join()}`, (s) => ({ statsContent: { ...s.statsContent, ...patch } })),
    setStatVisible: (key, visible) =>
      commit(`statVisible:${key}`, (s) => ({
        statsContent: { ...s.statsContent, visible: { ...s.statsContent.visible, [key]: visible } },
      })),
    moveStat: (key, toIndex) =>
      commit(`statOrder:${key}`, (s) => {
        const order = s.statsContent.order.filter((k) => k !== key)
        order.splice(Math.max(0, Math.min(order.length, toIndex)), 0, key)
        return { statsContent: { ...s.statsContent, order } }
      }),
    setStatOverride: (key, value) =>
      commit(`statOverride:${key}`, (s) => ({
        statsContent: { ...s.statsContent, overrides: { ...s.statsContent.overrides, [key]: value } },
      })),
    setChipOffset: (key, offset) =>
      commit(`stats:chip:${key}`, (s) => ({
        statsLayout: { ...s.statsLayout, chipOffsets: { ...s.statsLayout.chipOffsets, [key]: offset } },
      })),
    resetStatsLayout: () =>
      commit('stats:reset', (s) => ({ statsLayout: DEFAULT_STATS_LAYOUT, placements: { ...s.placements, stats: { x: null, y: null } } })),
  }
}
