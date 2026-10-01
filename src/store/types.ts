import type {
  AspectKey,
  BgAdjust,
  GpxTrack,
  Offset,
  RouteRange,
  RouteStyle,
  RouteTransform,
  Selection,
  StatKey,
  StatsContent,
  StatsLayout,
  StatsStyle,
  StylePreset,
  TabKey,
  TextNode,
  Waypoint,
} from '../types'

// Everything undo/redo covers — the user's composition, not UI chrome.
export interface DocumentState {
  aspectKey: AspectKey
  routeStyle: RouteStyle
  routeTransform: RouteTransform
  range: RouteRange
  progress: number
  statsStyle: StatsStyle
  statsContent: StatsContent
  statsLayout: StatsLayout
  texts: TextNode[]
  waypoints: Waypoint[]
  bgAdjust: BgAdjust
  dimOpacity: number
}

export interface Toast {
  id: number
  message: string
  undoable: boolean
}

export interface UiSlice {
  activeTab: TabKey
  previewBackdrop: string
  selection: Selection | null
  addingWaypoint: boolean
  routeEditable: boolean
  showSafeZones: boolean
  toast: Toast | null
  // Bumped whenever a web font finishes loading, so text gets re-measured.
  fontsVersion: number
  setActiveTab: (tab: TabKey) => void
  setPreviewBackdrop: (value: string) => void
  select: (selection: Selection | null) => void
  setAddingWaypoint: (value: boolean) => void
  setRouteEditable: (value: boolean) => void
  setShowSafeZones: (value: boolean) => void
  showToast: (message: string, undoable?: boolean) => void
  dismissToast: () => void
  bumpFontsVersion: () => void
}

export interface MediaSlice {
  track: GpxTrack | null
  gpxError: string
  background: HTMLCanvasElement | null
  backgroundError: string
  loadGpxFile: (file: File) => Promise<void>
  loadBackgroundFile: (file: File) => Promise<void>
  removeBackground: () => void
  setAspectKey: (key: AspectKey) => void
  updateBgAdjust: (patch: Partial<BgAdjust>) => void
  resetBgAdjust: () => void
  setDimOpacity: (value: number) => void
}

export interface RouteSlice {
  updateRouteStyle: (patch: Partial<RouteStyle>) => void
  applyStylePreset: (preset: StylePreset) => void
  setRouteTransform: (transform: RouteTransform) => void
  resetRouteTransform: () => void
  setRange: (range: RouteRange) => void
  setProgress: (value: number) => void
  selectDay: (dayIndex: number) => void
}

export interface StatsSlice {
  updateStatsStyle: (patch: Partial<StatsStyle>) => void
  updateStatsContent: (patch: Partial<Omit<StatsContent, 'visible' | 'overrides'>>) => void
  setStatVisible: (key: StatKey, visible: boolean) => void
  setStatOverride: (key: keyof StatsContent['overrides'], value: string) => void
  setStatsPosition: (x: number, y: number) => void
  setChipOffset: (key: StatKey, offset: Offset) => void
  resetStatsLayout: () => void
}

export interface ElementsSlice {
  addText: () => number
  updateText: (id: number, patch: Partial<TextNode>) => void
  deleteText: (id: number) => void
  addWaypoint: (trackPos: number) => number
  updateWaypoint: (id: number, patch: Partial<Waypoint>) => void
  deleteWaypoint: (id: number) => void
  applyGlobalFont: (family: string) => void
  deleteSelection: () => void
  nudgeSelection: (dx: number, dy: number) => void
}

export interface HistorySlice {
  past: DocumentState[]
  future: DocumentState[]
  undo: () => void
  redo: () => void
}

export type AppState = DocumentState & UiSlice & MediaSlice & RouteSlice & StatsSlice & ElementsSlice & HistorySlice

export type SetState = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void
export type GetState = () => AppState
// Records an undo step (coalescing repeats of the same `key`), then applies the update.
export type Commit = (key: string, update: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void

export interface SliceContext {
  set: SetState
  get: GetState
  commit: Commit
  resetHistory: () => void
}
