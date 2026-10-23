import type {
  AspectKey,
  CarouselKind,
  FormatLayout,
  FormatOverrides,
  CollageStyle,
  ElementKind,
  ElementPlacement,
  GradientStyle,
  LayoutKey,
  Photo,
  Slide,
  SlotAssignment,
  GpxPoint,
  Offset,
  KmInterval,
  RouteSource,
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
  TrackPart,
  TitleStyle,
  Waypoint,
  PointStyle,
} from '../types'

import type { AnimationSlice } from '../features/animation/store'
import type { AnimationSettings } from '../features/animation/types'
import type { CameraSlice } from '../features/camera/store'
import type { CameraSettings } from '../features/camera/model/camera'
import type { MapSlice } from '../features/map/store'
import type { MapSettings } from '../features/map/types'
import type { DataColorSlice } from '../features/data-color/store'
import type { DataColorSettings } from '../features/data-color/types'
import type { ProfileSlice } from '../features/elevation-profile/store'
import type { ProfileSettings } from '../features/elevation-profile/types'
import type { TravelSlice } from '../features/travel/store'

// Everything undo/redo covers — the user's composition, not UI chrome.
export interface DocumentState {
  aspectKey: AspectKey
  routeStyle: RouteStyle
  // The GPX files the route is made of; the track itself is derived from it.
  routeSource: RouteSource | null
  routeTransform: RouteTransform
  range: RouteRange
  progress: number
  statsStyle: StatsStyle
  titleStyle: TitleStyle
  statsContent: StatsContent
  statsLayout: StatsLayout
  // Where each registered canvas element (stats header, elevation profile, ...) sits in this format.
  placements: Record<ElementKind, ElementPlacement>
  texts: TextNode[]
  waypoints: Waypoint[]
  // How photos pinned to places look.
  pointStyle: PointStyle
  slides: Slide[]
  // Slides after the first while a format without a carousel is open; they come back with one.
  parkedSlides: Slide[]
  collage: CollageStyle
  carouselKind: CarouselKind
  kmInterval: KmInterval
  // Reference layout in the source format while another format is open.
  sourceLayout: FormatLayout | null
  layoutOverrides: Partial<Record<AspectKey, FormatOverrides>>
  dimOpacity: number
  profile: ProfileSettings
  dataColor: DataColorSettings
  animation: AnimationSettings
  camera: CameraSettings
  // The map background: its style and look.
  map: MapSettings
}

// undo and redo are the history's own; anything else brings its handler.
export type ToastAction = 'undo' | 'redo' | { label: string; run: () => void }

export interface Toast {
  id: number
  message: string
  action?: ToastAction
  error?: boolean
}

export interface UiSlice {
  activeTab: TabKey
  // Open page inside a tab that has sub-tabs (Trasa → Profil); the first page when unset.
  subTabs: Partial<Record<TabKey, string>>
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
  // What the middle of the editor shows in a tab that has its own workspace: that workspace or the frame.
  centerView: 'map' | 'frame'
  setCenterView: (view: 'map' | 'frame') => void
  setExporting: (value: boolean) => void
  setActiveTab: (tab: TabKey) => void
  setSubTab: (tab: TabKey, page: string) => void
  setPreviewBackdrop: (value: string) => void
  select: (selection: Selection | null) => void
  setAddingWaypoint: (value: boolean) => void
  setRouteEditable: (value: boolean) => void
  setShowSafeZones: (value: boolean) => void
  setPreviewLayout: (key: LayoutKey | null) => void
  setActiveSlide: (index: number) => void
  requestPhoto: (target: { slide: number; index: number } | null) => void
  showToast: (message: string, action?: ToastAction, error?: boolean) => void
  dismissToast: () => void
  bumpFontsVersion: () => void
}

export interface RouteSourceSlice {
  // Parsed points of every file loaded in this session, by TrackPart.sourceKey. Outside the
  // history (like the photo library), so undo can bring back a file that was replaced.
  trackCache: Record<string, GpxPoint[]>
  gpxError: string
  // Replaces the route, or with `append` adds the file as another day.
  loadGpxFile: (file: File, append?: boolean) => Promise<void>
  updatePart: (id: number, patch: Partial<Pick<TrackPart, 'color' | 'dashed' | 'visible' | 'vehicle'>>) => void
  removePart: (id: number) => void
}

export interface MediaSlice {
  photos: Photo[]
  photoError: string
  setAspectKey: (key: AspectKey) => void
  resetFormatLayout: () => void
  // Adds photos to the library; with a target they replace that slot, otherwise they fill empty slots in order.
  // A slot gets the first photo, a place (waypoint id) gets it pinned instead of filling slots.
  loadPhotoFiles: (files: File[], target?: { slide: number; index: number } | { waypoint: number }) => Promise<void>
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
  // Moves a stat to another place in the display order.
  moveStat: (key: StatKey, toIndex: number) => void
  setStatOverride: (key: keyof StatsContent['overrides'], value: string) => void
  setChipOffset: (key: StatKey, offset: Offset) => void
  resetStatsLayout: () => void
}

export interface ElementsSlice {
  addText: () => number
  updateText: (id: number, patch: Partial<TextNode>) => void
  deleteText: (id: number) => void
  addWaypoint: (trackPos: number) => number
  updateWaypoint: (id: number, patch: Partial<Waypoint>) => void
  updatePointStyle: (patch: Partial<PointStyle>) => void
  deleteWaypoint: (id: number) => void
  applyGlobalFont: (family: string) => void
  setPlacement: (kind: ElementKind, placement: ElementPlacement) => void
  deleteSelection: () => void
  nudgeSelection: (dx: number, dy: number) => void
}

export interface TemplatesSlice {
  customTemplates: StyleTemplate[]
  applyTemplate: (template: StyleTemplate, parts: TemplateParts) => void
  saveTemplate: (name: string) => void
  deleteTemplate: (id: string) => void
}

export interface HistoryEntry {
  doc: DocumentState
  // What the step changed, as the undo toast names it.
  label: string
}

export interface HistorySlice {
  past: HistoryEntry[]
  future: HistoryEntry[]
  undo: () => void
  redo: () => void
}

export type AppState = DocumentState &
  UiSlice &
  MediaSlice &
  RouteSourceSlice &
  RouteSlice &
  StatsSlice &
  ElementsSlice &
  TemplatesSlice &
  HistorySlice &
  ProfileSlice &
  DataColorSlice &
  AnimationSlice &
  CameraSlice &
  MapSlice &
  TravelSlice

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
