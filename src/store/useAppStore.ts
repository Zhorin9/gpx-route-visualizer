import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_BG_ADJUST,
  DEFAULT_ROUTE_STYLE,
  DEFAULT_STATS_CONTENT,
  DEFAULT_STATS_LAYOUT,
  DEFAULT_STATS_STYLE,
  IDENTITY_TRANSFORM,
} from './defaults'
import { createHistory } from './history'
import { createElementsSlice } from './slices/elementsSlice'
import { createMediaSlice } from './slices/mediaSlice'
import { createRouteSlice } from './slices/routeSlice'
import { createStatsSlice } from './slices/statsSlice'
import { createUiSlice } from './slices/uiSlice'
import type { AppState, DocumentState, SetState } from './types'

const INITIAL_DOCUMENT: DocumentState = {
  aspectKey: '9:16',
  routeStyle: DEFAULT_ROUTE_STYLE,
  routeTransform: IDENTITY_TRANSFORM,
  range: { start: 0, end: 0 },
  progress: 100,
  statsStyle: DEFAULT_STATS_STYLE,
  statsContent: DEFAULT_STATS_CONTENT,
  statsLayout: DEFAULT_STATS_LAYOUT,
  texts: [],
  waypoints: [],
  bgAdjust: DEFAULT_BG_ADJUST,
  dimOpacity: 0,
}

// Rule: persist the user's look & feel preferences, never the per-route
// content (track, texts, places, overrides) or transient UI state.
type PersistedState = Pick<AppState, 'aspectKey' | 'previewBackdrop' | 'showSafeZones' | 'dimOpacity' | 'routeStyle' | 'statsStyle'> & {
  statsContent: Omit<AppState['statsContent'], 'overrides'>
}

const STORE_VERSION = 2

// v0 kept every style field flat on the root.
function migrateV0(old: Record<string, unknown>): Partial<PersistedState> {
  const pick = <T>(key: string, fallback: T): T => (old[key] as T | undefined) ?? fallback
  return {
    aspectKey: pick('aspectKey', INITIAL_DOCUMENT.aspectKey),
    previewBackdrop: pick('previewBackdrop', 'checkerboard'),
    dimOpacity: pick('dimOpacity', 0),
    routeStyle: {
      ...DEFAULT_ROUTE_STYLE,
      color: pick('neonColor', DEFAULT_ROUTE_STYLE.color),
      coreWidth: pick('coreWidth', DEFAULT_ROUTE_STYLE.coreWidth),
      glowEnabled: pick('glowEnabled', DEFAULT_ROUTE_STYLE.glowEnabled),
      glowWidth: pick('glowWidth', DEFAULT_ROUTE_STYLE.glowWidth),
      glowBlur: pick('glowBlur', DEFAULT_ROUTE_STYLE.glowBlur),
      remainingVisible: pick('remainingVisible', DEFAULT_ROUTE_STYLE.remainingVisible),
      remainingDashed: pick('remainingDashed', DEFAULT_ROUTE_STYLE.remainingDashed),
      remainingOpacity: pick('remainingOpacity', DEFAULT_ROUTE_STYLE.remainingOpacity),
      shape: pick('routeShape', DEFAULT_ROUTE_STYLE.shape),
      schematicSimplify: pick('schematicDetail', DEFAULT_ROUTE_STYLE.schematicSimplify),
    },
    statsStyle: {
      ...DEFAULT_STATS_STYLE,
      fontFamily: pick('statsFontFamily', DEFAULT_STATS_STYLE.fontFamily),
      color: pick('statsColor', DEFAULT_STATS_STYLE.color),
      fontSize: pick('statsFontSize', DEFAULT_STATS_STYLE.fontSize),
      spacing: pick('statsSpacing', DEFAULT_STATS_STYLE.spacing),
    },
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (rawSet, get) => {
      const set = rawSet as SetState
      const history = createHistory(set, get)
      const ctx = { set, get, commit: history.commit, resetHistory: history.resetHistory }
      return {
        ...INITIAL_DOCUMENT,
        ...createUiSlice(ctx),
        ...createMediaSlice(ctx),
        ...createRouteSlice(ctx),
        ...createStatsSlice(ctx),
        ...createElementsSlice(ctx),
        ...history.slice,
      }
    },
    {
      name: 'gpxVisualizer.store',
      version: STORE_VERSION,
      partialize: (s): PersistedState => ({
        aspectKey: s.aspectKey,
        previewBackdrop: s.previewBackdrop,
        showSafeZones: s.showSafeZones,
        dimOpacity: s.dimOpacity,
        routeStyle: s.routeStyle,
        statsStyle: s.statsStyle,
        statsContent: {
          dayLabel: s.statsContent.dayLabel,
          visible: s.statsContent.visible,
          distancePrecision: s.statsContent.distancePrecision,
          elevationRoundTo: s.statsContent.elevationRoundTo,
        },
      }),
      migrate: (persisted, version) =>
        version < STORE_VERSION ? migrateV0((persisted ?? {}) as Record<string, unknown>) : (persisted as PersistedState),
      // Default shallow merge would drop style fields added after the data was saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>
        return {
          ...current,
          ...p,
          routeStyle: { ...current.routeStyle, ...p.routeStyle },
          statsStyle: { ...current.statsStyle, ...p.statsStyle },
          statsContent: {
            ...current.statsContent,
            ...p.statsContent,
            visible: { ...current.statsContent.visible, ...p.statsContent?.visible },
            overrides: current.statsContent.overrides,
          },
        }
      },
    },
  ),
)
