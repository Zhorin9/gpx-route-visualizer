import type {
  AspectKey,
  CarouselKind,
  FormatLayout,
  FormatOverrides,
  CollageStyle,
  GradientStyle,
  LayoutKey,
  Photo,
  Slide,
  SlotAssignment,
  GpxTrack,
  Offset,
  KmInterval,
  RouteDay,
  RouteRange,
  RouteStyle,
  RouteTransform,
  Selection,
  StatKey,
  StatsContent,
  StatsLayout,
  StatsStyle,
  StylePreset,
  StyleTemplate,
  TemplateParts,
  TabKey,
  TextNode,
  TitleStyle,
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
  titleStyle: TitleStyle
  statsContent: StatsContent
  statsLayout: StatsLayout
  texts: TextNode[]
  waypoints: Waypoint[]
  slides: Slide[]
  collage: CollageStyle
  carouselKind: CarouselKind
  kmInterval: KmInterval
  // Reference layout in the source format while another format is open.
  sourceLayout: FormatLayout | null
  layoutOverrides: Partial<Record<AspectKey, FormatOverrides>>
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
  // Layout under the pointer in the picker — previewed on the frame before it's applied.
  previewLayoutKey: LayoutKey | null
  // Slide that layout picks and new elements go to (clamped on read, since undo can drop slides).
  activeSlide: number
  // Slot waiting for a photo: the canvas asks, a file picker answers.
  photoRequest: { slide: number; index: number } | null
  toast: Toast | null
  // Bumped whenever a web font finishes loading, so text gets re-measured.
  fontsVersion: number
  // Files are rendered format by format; the canvas is covered meanwhile.
  exporting: boolean
  setExporting: (value: boolean) => void
  setActiveTab: (tab: TabKey) => void
  setPreviewBackdrop: (value: string) => void
  select: (selection: Selection | null) => void
  setAddingWaypoint: (value: boolean) => void
  setRouteEditable: (value: boolean) => void
  setShowSafeZones: (value: boolean) => void
  setPreviewLayout: (key: LayoutKey | null) => void
  setActiveSlide: (index: number) => void
  requestPhoto: (target: { slide: number; index: number } | null) => void
  showToast: (message: string, undoable?: boolean) => void
  dismissToast: () => void
  bumpFontsVersion: () => void
}

export interface MediaSlice {
  track: GpxTrack | null
  gpxError: string
  photos: Photo[]
  photoError: string
  // Empty for a single file; with several, one entry per GPX file joined into `track`.
  routeDays: RouteDay[]
  loadGpxFile: (file: File, append?: boolean) => Promise<void>
  updateDay: (id: number, patch: Partial<Pick<RouteDay, "color" | "dashed" | "visible">>) => void
  removeDay: (id: number) => void
  setAspectKey: (key: AspectKey) => void
  resetFormatLayout: () => void
  // Adds photos to the library; with a target they replace that slot, otherwise they fill empty slots in order.
  loadPhotoFiles: (files: File[], target?: { slide: number; index: number }) => Promise<void>
  assignPhoto: (slide: number, index: number, photoId: number) => void
  // Puts a library photo in the selected slot, else the first empty one.
  placePhoto: (photoId: number) => void
  // Drops a photo from the library and empties every slot that showed it.
  removePhoto: (photoId: number) => void
  clearSlot: (slide: number, index: number) => void
  updateSlot: (slide: number, index: number, patch: Partial<Omit<SlotAssignment, 'photoId'>>) => void
  resetSlotCrop: (slide: number, index: number) => void
  setLayout: (slide: number, key: LayoutKey) => void
  setCarousel: (on: boolean) => void
  setCarouselKind: (kind: CarouselKind) => void
  setSlideCount: (count: number) => void
  addSlide: () => void
  removeSlide: (index: number) => void
  updateCollage: (patch: Partial<Omit<CollageStyle, 'frame'>>) => void
  updateFrame: (patch: Partial<CollageStyle['frame']>) => void
  updateBackground: (patch: Partial<Pick<CollageStyle, 'bgKind' | 'bgColor' | 'autoContrast'>> & { gradient?: Partial<GradientStyle> }) => void
  addCaption: (slide: number, index: number) => void
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
  setKmInterval: (value: KmInterval) => void
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

export interface TemplatesSlice {
  customTemplates: StyleTemplate[]
  applyTemplate: (template: StyleTemplate, parts: TemplateParts) => void
  saveTemplate: (name: string) => void
  deleteTemplate: (id: string) => void
}

export interface HistorySlice {
  past: DocumentState[]
  future: DocumentState[]
  undo: () => void
  redo: () => void
}

export type AppState = DocumentState & UiSlice & MediaSlice & RouteSlice & StatsSlice & ElementsSlice & TemplatesSlice & HistorySlice

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
