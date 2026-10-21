import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_COLLAGE, DEFAULT_ROUTE_STYLE, DEFAULT_STATS_STYLE, STAT_ORDER } from './defaults'
import { createAnimationSlice } from '../features/animation/store'
import { createDataColorSlice } from '../features/data-color/store'
import { createProfileSlice } from '../features/elevation-profile/store'
import { INITIAL_DOCUMENT } from './document'
import { createHistory } from './history'
import { createElementsSlice } from './slices/elementsSlice'
import { createMediaSlice } from './slices/mediaSlice'
import { createRouteSlice } from './slices/routeSlice'
import { createRouteSourceSlice } from './slices/routeSourceSlice'
import { createStatsSlice } from './slices/statsSlice'
import { createTemplatesSlice } from './slices/templatesSlice'
import { createUiSlice } from './slices/uiSlice'
import type { AppState, SetState } from './types'
import type { StatKey, StyleTemplate } from '../types'

// Rule: persist the user's look & feel preferences, never the per-route
// content (track, texts, places, overrides) or transient UI state.
// The stats header's rotation is part of one design's layout, not a look to carry over:
// a remembered 90° would turn the header of every route loaded afterwards.
type PersistedState = Pick<AppState, 'aspectKey' | 'previewBackdrop' | 'showSafeZones' | 'dimOpacity' | 'routeStyle' | 'titleStyle' | 'customTemplates'> & {
  statsStyle: Omit<AppState['statsStyle'], 'rotation'>
  statsContent: Omit<AppState['statsContent'], 'overrides'>
}

const STORE_VERSION = 4

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

function withoutRotation(style: AppState['statsStyle']): PersistedState['statsStyle'] {
  const { rotation: _rotation, ...rest } = style
  return rest
}

// Saved before a stat existed: keep the user's order and add the newcomers at the end.
export function completeOrder(order: StatKey[] | undefined): StatKey[] {
  const known = (order ?? []).filter((k) => STAT_ORDER.includes(k))
  return [...new Set([...known, ...STAT_ORDER])]
}

type LegacyTemplate = Omit<StyleTemplate, 'fonts' | 'gradient'> & { fontFamily?: string; bgColor?: string }

// v2 templates had one font and a flat background colour, and the stats header was always one row.
function migrateV2(old: Partial<PersistedState>): Partial<PersistedState> {
  const templates = (old.customTemplates ?? []) as (StyleTemplate | LegacyTemplate)[]
  return {
    ...old,
    statsStyle: old.statsStyle && { ...old.statsStyle, arrangement: 'row' },
    customTemplates: templates.map((t): StyleTemplate => {
      if ('fonts' in t && t.fonts) return t
      const { fontFamily = DEFAULT_STATS_STYLE.fontFamily, bgColor = DEFAULT_COLLAGE.bgColor, ...rest } = t as LegacyTemplate
      return {
        ...rest,
        fonts: { title: fontFamily, data: fontFamily, note: fontFamily },
        statsStyle: { arrangement: 'row', ...rest.statsStyle },
        gradient: { ...DEFAULT_COLLAGE.gradient, from: bgColor, to: bgColor, grain: 0 },
      }
    }),
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
        ...createRouteSourceSlice(ctx),
        ...createRouteSlice(ctx),
        ...createStatsSlice(ctx),
        ...createElementsSlice(ctx),
        ...createTemplatesSlice(ctx),
        ...createProfileSlice(ctx),
        ...createDataColorSlice(ctx),
        ...createAnimationSlice(ctx),
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
        statsStyle: withoutRotation(s.statsStyle),
        titleStyle: s.titleStyle,
        customTemplates: s.customTemplates,
        statsContent: {
          dayLabel: s.statsContent.dayLabel,
          visible: s.statsContent.visible,
          order: s.statsContent.order,
          units: s.statsContent.units,
          distancePrecision: s.statsContent.distancePrecision,
          elevationRoundTo: s.statsContent.elevationRoundTo,
        },
      }),
      migrate: (persisted, version) => {
        const state = version < 2 ? migrateV0((persisted ?? {}) as Record<string, unknown>) : ((persisted ?? {}) as Partial<PersistedState>)
        const v3 = version < 3 ? migrateV2(state) : state
        // v3 still saved the rotation; drop it so the header starts level again.
        return (version < 4 && v3.statsStyle ? { ...v3, statsStyle: withoutRotation(v3.statsStyle as AppState['statsStyle']) } : v3) as PersistedState
      },
      // Default shallow merge would drop style fields added after the data was saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>
        return {
          ...current,
          ...p,
          routeStyle: { ...current.routeStyle, ...p.routeStyle },
          statsStyle: { ...current.statsStyle, ...p.statsStyle },
          titleStyle: { ...current.titleStyle, ...p.titleStyle },
          statsContent: {
            ...current.statsContent,
            ...p.statsContent,
            visible: { ...current.statsContent.visible, ...p.statsContent?.visible },
            order: completeOrder(p.statsContent?.order),
            overrides: current.statsContent.overrides,
          },
        }
      },
    },
  ),
)
