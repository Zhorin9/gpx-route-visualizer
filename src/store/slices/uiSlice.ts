import type { SliceContext, UiSlice } from '../types'

let nextToastId = 1

export function createUiSlice({ set }: SliceContext): UiSlice {
  return {
    activeTab: 'media',
    // 'checkerboard' or a hex color
    previewBackdrop: 'checkerboard',
    selection: null,
    addingWaypoint: false,
    routeEditable: false,
    showSafeZones: true,
    toast: null,
    fontsVersion: 0,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setPreviewBackdrop: (value) => set({ previewBackdrop: value }),
    // Picking something on the canvas brings up its settings.
    select: (selection) =>
      set(
        selection
          ? { selection, addingWaypoint: false, activeTab: selection.kind === 'text' ? 'texts' : 'places' }
          : { selection: null },
      ),
    setAddingWaypoint: (value) => set({ addingWaypoint: value, ...(value ? { selection: null, routeEditable: false } : {}) }),
    setRouteEditable: (value) => set({ routeEditable: value, ...(value ? { addingWaypoint: false } : {}) }),
    setShowSafeZones: (value) => set({ showSafeZones: value }),
    showToast: (message, undoable = false) => set({ toast: { id: nextToastId++, message, undoable } }),
    dismissToast: () => set({ toast: null }),
    bumpFontsVersion: () => set((s) => ({ fontsVersion: s.fontsVersion + 1 })),
  }
}
