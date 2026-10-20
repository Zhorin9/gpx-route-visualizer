import type { Units } from './core/units'

export interface GpxPoint {
  lat: number
  lon: number
  ele: number
  // Epoch ms, parsed once on import.
  time: number | null
  // Heart rate in bpm, from the Garmin/Strava track point extension; absent when not recorded.
  hr?: number
}

export interface GpxTrack {
  name: string | null
  points: GpxPoint[]
}

// One GPX file of a multi-day trip; the files are joined into a single track, each day keeps its slice.
export interface RouteDay {
  id: number
  name: string
  startIdx: number
  endIdx: number
  color: string
  dashed: boolean
  visible: boolean
}

// 0 = no markers, otherwise a marker every N km.
export type KmInterval = 0 | 10 | 25 | 50

export interface RangeStats {
  distanceKm: number
  elevationGainM: number
  // Elapsed time inside each day (nights between days don't count).
  durationMs: number
  // Elapsed time minus stops.
  movingMs: number
  // Highest point of the range; null when the file has no elevation.
  maxElevationM: number | null
}

export interface TrackDay {
  startIdx: number
  endIdx: number
  date: Date
}

export interface TextNode {
  id: number
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
  letterSpacing: number
  rotation: number
  opacity: number
  outlineEnabled: boolean
  outlineColor: string
  outlineWidth: number
  shadowEnabled: boolean
  // 'title': the track name, centred across the frame with the stats header a line below.
  role?: 'title'
  uppercase?: boolean
}

// How a track title is set: templates write it, a newly loaded GPX reads it.
export interface TitleStyle {
  fontFamily: string
  color: string
  italic: boolean
  uppercase: boolean
}

export type WaypointKind = 'point' | 'pass' | 'peak'

export interface Waypoint {
  id: number
  kind: WaypointKind
  // Fractional index into the full track, so the label stays on the route
  // when the aspect ratio or visible range changes.
  trackPos: number
  // Label offset from the anchor, in stage pixels.
  dx: number
  dy: number
  text: string
  fontFamily: string
  fontSize: number
  color: string
}

export type RouteShape = 'natural' | 'schematic'

export interface RouteStyle {
  color: string
  coreWidth: number
  glowEnabled: boolean
  glowWidth: number
  glowBlur: number
  remainingVisible: boolean
  remainingDashed: boolean
  remainingOpacity: number
  remainingColor: string
  remainingWidth: number
  shape: RouteShape
  dashed: boolean
  dotted: boolean
  // 0-100, higher = more simplified.
  schematicSimplify: number
}

export type StylePreset = 'flat' | 'neon'

// Look only: a template never touches photos, routes or the text people typed.
export interface StyleTemplate {
  id: string
  name: string
  desc: string
  // One pair per role: titles (texts), figures (stats header) and notes (place labels).
  fonts: { title: string; data: string; note: string }
  titleItalic?: boolean
  titleUppercase?: boolean
  statsStyle: Partial<StatsStyle>
  textColor: string
  titleColor?: string
  route: Partial<RouteStyle>
  frame: CollageStyle['frame']
  gradient: GradientStyle
  layoutKey: LayoutKey
  preview: {
    bg: string
    text: string
    line: string
    title: string
    titleFont: string
    titleColor?: string
    italic?: boolean
    dash: boolean
    dotted?: boolean
    glow?: boolean
    width: number
    frame?: string
  }
  custom?: boolean
}

export interface TemplateParts {
  fonts: boolean
  route: boolean
  frame: boolean
  colors: boolean
  layout: boolean
}

export interface RouteTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

export type StatKey = 'day' | 'distance' | 'elevation' | 'time' | 'movingTime' | 'avgSpeed' | 'maxElevation'

// row: values side by side in one line; columns: equal columns across the frame, label above each value;
// grid: two columns that wrap; hero: one figure large, the others small under it.
export type StatsArrangement = 'row' | 'columns' | 'grid' | 'hero'

export interface StatsStyle {
  arrangement: StatsArrangement
  // Columns only: spread over the whole frame, or sized to their content with `spacing` between.
  stretch: boolean
  labels: boolean
  dividers: boolean
  fontFamily: string
  color: string
  fontSize: number
  spacing: number
  rotation: number
  // Hero arrangement: the figure shown large, and whether the others stay under it.
  heroKey: StatKey
  heroSecondary: boolean
}

export interface StatsContent {
  dayLabel: string
  visible: Record<StatKey, boolean>
  // Display order of the stats; every key appears once.
  order: StatKey[]
  units: Units
  overrides: Record<Exclude<StatKey, 'day'>, string>
  distancePrecision: number
  elevationRoundTo: number
}

export interface Offset {
  dx: number
  dy: number
}

export interface StatsLayout {
  chipOffsets: Partial<Record<StatKey, Offset>>
}

// Top-left corner of a canvas element; null = default placement for the current aspect ratio.
export interface ElementPlacement {
  x: number | null
  y: number | null
}

// Key of an element in the canvas element registry ('stats', 'elevationProfile', ...).
export type ElementKind = string

export interface StatChip {
  key: StatKey
  text: string
  // Caption and bare value used by the column layout.
  label: string
  value: string
}

export type LayoutKey = 'g1' | 'g2h' | 'g2v' | 'g2v1h' | 'g22' | 'g1b2s' | 'g2s1b' | 'g3h' | 'g3v' | 'g4v' | 'g23' | 'g1b3s' | 'g3s1b' | 'c1' | 'c2' | 'c3' | 'c4'

export type LayoutGroup = 'grid' | 'creative'

export interface Photo {
  id: number
  name: string
  image: HTMLCanvasElement
  // Small data URL for the photo tape and layout thumbnails.
  thumb: string
}

// A photo placed in one slot of a layout, with its own crop.
export interface SlotAssignment {
  photoId: number
  zoom: number
  offsetX: number
  offsetY: number
}

export interface Slide {
  layoutKey: LayoutKey
  slots: Record<number, SlotAssignment>
}

// panorama: one photo stretched over the whole ribbon; slides: every slide has its own layout.
export type CarouselKind = 'panorama' | 'slides'

export type FrameKind = 'equal' | 'polaroid'

export interface FrameStyle {
  enabled: boolean
  color: string
  thickness: number
  style: FrameKind
}

export interface GradientStyle {
  from: string
  to: string
  // CSS convention: 180 runs top to bottom.
  angle: number
  // Film grain strength, 0-100.
  grain: number
  // Dithers the blend so the gradient shows no banding.
  smooth: boolean
}

export type BackgroundKind = 'color' | 'gradient'

export interface CollageStyle {
  gap: number
  margin: number
  bgColor: string
  bgKind: BackgroundKind
  gradient: GradientStyle
  // Text and route flip between dark and light when the gradient does.
  autoContrast: boolean
  frame: FrameStyle
  fit: 'cover' | 'contain'
}

export interface AspectOption {
  w: number
  h: number
  label: string
}

export type AspectKey = '9:16' | '4:5' | '1:1'

// Positions of the elements whose placement differs between formats.
export interface FormatLayout {
  texts: Record<number, { x: number; y: number }>
  elements: Record<ElementKind, ElementPlacement>
  route: RouteTransform
}

// What the user placed by hand in one format; everything else follows the source format.
export interface FormatOverrides {
  texts: Record<number, { x: number; y: number }>
  elements: Record<ElementKind, ElementPlacement>
  route?: RouteTransform
}

export type ExportFormat = 'png' | 'jpg'

export type TabKey = 'background' | 'media' | 'route' | 'texts' | 'style' | 'export'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  group?: string
}

export type Selection =
  | { kind: 'text' | 'waypoint'; id: number }
  | { kind: 'element'; element: ElementKind }
  | { kind: 'slot'; slide: number; index: number }

export interface RouteRange {
  start: number
  end: number
}
