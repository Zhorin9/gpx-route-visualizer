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
    previewLayoutKey: null,
    activeSlide: 0,
    photoRequest: null,
    toast: null,
    fontsVersion: 0,
    exporting: false,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setPreviewBackdrop: (value) => set({ previewBackdrop: value }),
    // Picking something on the canvas brings up its settings: photos live in the first tab, the rest in Napisy.
    // A waypoint has settings in both Trasa and Napisy, so it stays in whichever of the two is open.
    select: (selection) =>
      set((s) =>
        selection
          ? {
              selection,
              addingWaypoint: false,
              activeTab:
                selection.kind === 'slot'
                  ? 'media'
                  : selection.kind === 'waypoint' && (s.activeTab === 'texts' || s.activeTab === 'route')
                    ? s.activeTab
                    : selection.kind === 'waypoint'
                      ? 'route'
                      : 'texts',
              ...(selection.kind === 'slot' ? { activeSlide: selection.slide } : null),
            }
          : { selection: null },
      ),
    setAddingWaypoint: (value) => set({ addingWaypoint: value, ...(value ? { selection: null, routeEditable: false } : {}) }),
    setRouteEditable: (value) => set({ routeEditable: value, ...(value ? { addingWaypoint: false } : {}) }),
    setShowSafeZones: (value) => set({ showSafeZones: value }),
    setPreviewLayout: (key) => set({ previewLayoutKey: key }),
    setActiveSlide: (index) => set({ activeSlide: index }),
    requestPhoto: (target) => set({ photoRequest: target }),
    showToast: (message, undoable = false) => set({ toast: { id: nextToastId++, message, undoable } }),
    setExporting: (value) => set({ exporting: value }),
    dismissToast: () => set({ toast: null }),
    bumpFontsVersion: () => set((s) => ({ fontsVersion: s.fontsVersion + 1 })),
  }
}
