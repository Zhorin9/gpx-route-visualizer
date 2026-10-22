import { canvasElement } from '../../core/canvas/registry'
import type { SliceContext, UiSlice } from '../types'
import type { TabKey } from '../../types'

let nextToastId = 1

export function createUiSlice({ set }: SliceContext): UiSlice {
  return {
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

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSubTab: (tab, page) => set((s) => ({ activeTab: tab, subTabs: { ...s.subTabs, [tab]: page } })),
    setPreviewBackdrop: (value) => set({ previewBackdrop: value }),
    // Picking something on the canvas brings up its settings: photos live in the first tab, texts in
    // Napisy, registered elements where they say (Trasa → Statystyki). A waypoint has settings in both
    // Trasa (Linia) and Napisy, so it stays in whichever of the two is open.
    select: (selection) =>
      set((s) => {
        if (!selection) return { selection: null }
        let tab: TabKey = 'texts'
        let page: string | undefined
        if (selection.kind === 'slot') tab = 'media'
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
