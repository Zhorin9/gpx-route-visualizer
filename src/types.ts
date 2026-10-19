export interface GpxPoint {
  lat: number
  lon: number
  ele: number
  // Epoch ms, parsed once on import.
  time: number | null
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
  durationMs: number
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
  // 0-100, higher = more simplified.
  schematicSimplify: number
}

export type StylePreset = 'flat' | 'neon'

// Look only: a template never touches photos, routes or the text people typed.
export interface StyleTemplate {
  id: string
  name: string
  desc: string
  fontFamily: string
  statsStyle: Partial<StatsStyle>
  textColor: string
  route: Partial<RouteStyle>
  frame: CollageStyle['frame']
  bgColor: string
  layoutKey: LayoutKey
  preview: { bg: string; text: string; line: string; title: string; titleFont: string; dash: boolean; width: number; frame?: string }
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

export type StatKey = 'day' | 'distance' | 'elevation' | 'time'

export interface StatsStyle {
  fontFamily: string
  color: string
  fontSize: number
  spacing: number
  rotation: number
}

export interface StatsContent {
  dayLabel: string
  visible: Record<StatKey, boolean>
  overrides: Record<Exclude<StatKey, 'day'>, string>
  distancePrecision: number
  elevationRoundTo: number
}

export interface Offset {
  dx: number
  dy: number
}

export interface StatsLayout {
  // null = default placement for the current aspect ratio.
  x: number | null
  y: number | null
  chipOffsets: Partial<Record<StatKey, Offset>>
}

export interface StatChip {
  key: StatKey
  text: string
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

export interface CollageStyle {
  gap: number
  margin: number
  bgColor: string
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
  stats: { x: number | null; y: number | null }
  route: RouteTransform
}

// What the user placed by hand in one format; everything else follows the source format.
export interface FormatOverrides {
  texts: Record<number, { x: number; y: number }>
  stats?: FormatLayout['stats']
  route?: RouteTransform
}

export type ExportFormat = 'png' | 'jpg'

export type TabKey = 'media' | 'route' | 'texts' | 'style' | 'export'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  group?: string
}

export type Selection =
  | { kind: 'text' | 'waypoint'; id: number }
  | { kind: 'stats' }
  | { kind: 'slot'; slide: number; index: number }

export interface RouteRange {
  start: number
  end: number
}
