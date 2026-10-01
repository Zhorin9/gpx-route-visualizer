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

export interface Waypoint {
  id: number
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
  // 0-100, higher = more simplified.
  schematicSimplify: number
}

export type StylePreset = 'flat' | 'neon'

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

export interface BgAdjust {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface AspectOption {
  w: number
  h: number
  label: string
}

export type AspectKey = '9:16' | '4:5' | '1:1'

export type ExportFormat = 'png' | 'jpg'

export type TabKey = 'media' | 'stats' | 'range' | 'style' | 'texts' | 'places' | 'export'

export interface BgLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export type Selection = { kind: 'text' | 'waypoint'; id: number }

export interface RouteRange {
  start: number
  end: number
}
