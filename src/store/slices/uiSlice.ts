import { canvasElement } from '../../core/canvas/registry'
import { INITIAL_DOCUMENT } from '../document'
import { MODE_LABELS } from '../../utils/modeChange'
import i18n from '../../i18n'
import type { SliceContext, UiSlice } from '../types'
import type { PanelTab, Selection } from '../../types'

let nextToastId = 1

function settingsTabFor(selection: Selection, openTab: PanelTab): { tab: PanelTab; page?: string } {
  const listedInTexts = selection.kind === 'waypoint' || selection.kind === 'element'
  if (selection.kind === 'slot') return { tab: openTab }
  if (listedInTexts && openTab === 'texts') return { tab: 'texts' }
  if (selection.kind === 'waypoint') return { tab: 'route', page: 'line' }
  if (selection.kind === 'element') {
    const def = canvasElement(selection.element)
    return { tab: def?.tab ?? 'texts', page: def?.subTab }
  }
  return { tab: 'texts' }
}

export function createUiSlice({ set, get, commit }: SliceContext): UiSlice {
  return {
    // A collage starts from its photos, a map project from Mapa (on its first page unless asked otherwise).
    startProject: (mode, page) =>
      set({ mode, activeTab: mode === 'collage' ? 'media' : 'route', subTabs: page ? { route: page } : {}, centerView: 'map' }),
    // Photos, texts and the look always stay; a collage drops the route, its places and a map background.
    changeMode: (mode) => {
      const s = get()
      if (!s.mode || s.mode === mode) return
      const dropRoute =
        mode === 'collage'
          ? {
              routeSource: INITIAL_DOCUMENT.routeSource,
              range: INITIAL_DOCUMENT.range,
              progress: INITIAL_DOCUMENT.progress,
              routeTransform: INITIAL_DOCUMENT.routeTransform,
              waypoints: [],
              collage: s.collage.bgKind === 'map' ? { ...s.collage, bgKind: 'gradient' as const } : s.collage,
            }
          : null
      commit('mode', { mode, ...dropRoute })
      set({ activeTab: mode === 'collage' ? 'media' : 'route', centerView: 'map', selection: null, addingWaypoint: false, routeEditable: false })
      get().showToast(i18n.t('uiSlice.modeChanged', { mode: i18n.t(MODE_LABELS[mode]) }), 'undo')
    },
    activeTab: 'media',
    subTabs: {},
    previewBackdrop: 'checkerboard',
    selection: null,
    addingWaypoint: false,
    routeEditable: false,
    showSafeZones: true,
    previewLayoutKey: null,
    activeSlide: 0,
    photoRequest: null,
    toast: null,
    fontsVersion: 0,
    exporting: false,
    centerView: 'map',

    // A page with its own workspace (Mapa → Przystanki → the map) opens on it; the frame is one click away.
    // Leaving the templates, or reaching for the frame, keeps a previewed template.
    setActiveTab: (tab) => {
      get().keepPreview()
      set({ activeTab: tab, centerView: 'map' })
    },
    setCenterView: (view) => set({ centerView: view }),
    setSubTab: (tab, page) => {
      get().keepPreview()
      set((s) => ({ subTabs: { ...s.subTabs, [tab]: page }, centerView: 'map' }))
    },
    setPreviewBackdrop: (value) => set({ previewBackdrop: value }),
    select: (selection) => {
      get().keepPreview()
      set((s) => {
        if (!selection) return { selection: null }
        const { tab, page } = settingsTabFor(selection, s.activeTab)
        return {
          selection,
          addingWaypoint: false,
          activeTab: tab,
          ...(page ? { subTabs: { ...s.subTabs, [tab]: page } } : null),
          ...(selection.kind === 'slot' ? { activeSlide: selection.slide } : null),
        }
      })
    },
    setAddingWaypoint: (value) => set({ addingWaypoint: value, ...(value ? { selection: null, routeEditable: false } : {}) }),
    setRouteEditable: (value) => set({ routeEditable: value, ...(value ? { addingWaypoint: false } : {}) }),
    setShowSafeZones: (value) => set({ showSafeZones: value }),
    setPreviewLayout: (key) => set({ previewLayoutKey: key }),
    setActiveSlide: (index) => set({ activeSlide: index }),
    requestPhoto: (target) => set({ photoRequest: target }),
    showToast: (message, action, error) => set({ toast: { id: nextToastId++, message, action, error } }),
    setExporting: (value) => set({ exporting: value }),
    dismissToast: () => set({ toast: null }),
    bumpFontsVersion: () => set((s) => ({ fontsVersion: s.fontsVersion + 1 })),
  }
}
