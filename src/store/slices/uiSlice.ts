import { canvasElement } from '../../core/canvas/registry'
import { INITIAL_DOCUMENT } from '../document'
import { MODE_LABELS } from '../../utils/modeChange'
import type { SliceContext, UiSlice } from '../types'
import type { PanelTab } from '../../types'

let nextToastId = 1

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
      get().showToast(`Projekt zmieniony na ${MODE_LABELS[mode]}. Zdjęcia i teksty zachowane.`, 'undo')
    },
    activeTab: 'media',
    subTabs: {},
    // 'checkerboard' or a hex color
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
    setActiveTab: (tab) => set({ activeTab: tab, centerView: 'map' }),
    setCenterView: (view) => set({ centerView: view }),
    setSubTab: (tab, page) => set((s) => ({ subTabs: { ...s.subTabs, [tab]: page }, centerView: 'map' })),
    setPreviewBackdrop: (value) => set({ previewBackdrop: value }),
    // Picking something on the canvas brings up its settings: texts in Napisy, registered elements
    // where they say (Trasa → Statystyki). A waypoint has settings in both Trasa (Linia) and Napisy, so
    // it stays in whichever of the two is open. A photo is mostly grabbed to move it in its slot, so
    // the open tab stays.
    select: (selection) =>
      set((s) => {
        if (!selection) return { selection: null }
        let tab: PanelTab = 'texts'
        let page: string | undefined
        if (selection.kind === 'slot') tab = s.activeTab
        else if (selection.kind === 'waypoint') {
          tab = s.activeTab === 'texts' ? 'texts' : 'route'
          if (tab === 'route') page = 'line'
        } else if (selection.kind === 'element') {
          const def = canvasElement(selection.element)
          tab = def?.tab ?? 'texts'
          page = def?.subTab
        }
        return {
          selection,
          addingWaypoint: false,
          activeTab: tab,
          ...(page ? { subTabs: { ...s.subTabs, [tab]: page } } : null),
          ...(selection.kind === 'slot' ? { activeSlide: selection.slide } : null),
        }
      }),
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
