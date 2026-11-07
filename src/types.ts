import type { IconFinish, IconId } from './components/place/icons'
import type { StickerSettings } from './utils/sticker'
import type { ReactNode } from 'react'
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

export interface Stop {
  id: number
  name: string
  lat: number
  lon: number
  // A via point shapes the line but is not a named place.
  via: boolean
  // Seconds the animated line rests here; 1 s at a stop on the way and none at the end when unset.
  pause?: number
}

export type TravelModeId = 'plane' | 'train' | 'car' | 'bike' | 'foot'

export type LineKind = 'road' | 'straight' | 'arc'

export type RouteOption = 'avoid_toll' | 'avoid_motorways' | 'avoid_unpaved'

// The first and last stops are the leg's ends.
export interface TravelPlan {
  mode: TravelModeId
  // Variant of the mode, e.g. the bike's road / trekking / mtb.
  profile?: string
  options?: RouteOption[]
  // The mode's own shape when unset.
  line?: LineKind
  // Seconds the animation takes to draw this leg.
  duration?: number
  stops: Stop[]
}

// A GPX file (a day) or a planned leg. Its points live in the track cache, outside the history.
export interface TrackPart {
  id: number
  name: string
  color: string
  dashed: boolean
  visible: boolean
  sourceKey: string
  // Absent for a GPX file.
  plan?: TravelPlan
  // false: the heights aren't the ground's (a flight, a straight line), so climbing doesn't count.
  groundElevation?: false
  estimatedTime?: true
  // The animation's own marker when absent.
  vehicle?: VehicleId
}

export type VehicleId = 'dot' | 'plane' | 'train' | 'car' | 'bike' | 'walker' | 'boat'

// In the document so undo covers loading and removing files; the joined track is derived (store/derived.ts).
export interface RouteSource {
  // The first file's track name.
  name: string | null
  parts: TrackPart[]
}

export interface RoutePart extends TrackPart {
  startIdx: number
  endIdx: number
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
  // null when the file has no elevation.
  maxElevationM: number | null
  // A planned leg's times are estimated, so the time figures are approximate.
  estimatedTime?: boolean
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
  // In place of the soft shadow: a sharp copy underneath.
  hardShadow?: HardShadow
  // Set: an icon stands in for the text, fontSize wide.
  icon?: IconId
  // 'title': the track name, centred across the frame with the stats header a line below.
  role?: 'title'
  uppercase?: boolean
}

export interface HardShadow {
  dx: number
  dy: number
  color: string
}

export interface TextOutline {
  color: string
  width: number
}

// What a style does to the glyphs of every text, beyond font and colour.
export interface TextEffect {
  outline?: TextOutline
  hardShadow?: HardShadow
}

export interface TitleStyle {
  fontFamily: string
  color: string
  italic: boolean
  uppercase: boolean
}

export type WaypointKind = 'point' | 'pass' | 'peak' | 'lodging' | 'icon'

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
  // Unset: on.
  shadowEnabled?: boolean
  // Unset: on.
  leaderEnabled?: boolean
  photoId?: number
  // Offsets are fractions of the photo's box, so the crop survives a change of marker or size. Unset: centred.
  photoCrop?: Pick<SlotAssignment, 'zoom' | 'offsetX' | 'offsetY'>
  // The planner's stop this label names; it follows the stop when the trip changes.
  stopId?: number
  // Kind 'icon' only.
  icon?: IconId
}

// 'label': no photo, the name alone over a rule.
export type PhotoMarker = 'polaroid' | 'circle' | 'square' | 'film' | 'label'

export interface PointStyle {
  marker: PhotoMarker
  size: 'S' | 'M' | 'L'
}

export type RouteShape = 'natural' | 'schematic'

export interface RouteStyle {
  color: string
  coreWidth: number
  glowEnabled: boolean
  glowWidth: number
  glowBlur: number
  // null = the line's own colour.
  glowColor: string | null
  glowOpacity: number
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
  // A dark line under the route and its copy shifted aside, as on a sticker.
  casing?: RouteCasing
}

export interface RouteCasing {
  // Added to the line's width, half on each side.
  width: number
  color: string
  dx: number
  dy: number
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
  // Absent from templates saved before photos could sit on the route.
  pointStyle?: PointStyle
  // The map's colours come from the template's background and text.
  map?: { styleId?: string; hillshade?: boolean; labels?: boolean }
  // Applied with the effects part; absent ones clear what an earlier style left.
  titleEffect?: TextEffect
  statsEffect?: TextEffect
  iconFinish?: IconFinish
  // Only the sticker styles carry one; any other style turns it off.
  sticker?: StickerSettings
  // Saved templates have a group of their own.
  group?: TemplateGroup
  custom?: boolean
}

export type TemplateGroup = 'basic' | 'natural' | 'retro' | 'dark' | 'sticker' | 'poster'

export interface TemplateParts {
  fonts: boolean
  route: boolean
  frame: boolean
  colors: boolean
  layout: boolean
  points: boolean
  effects: boolean
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
  shadow: boolean
  hardShadow?: HardShadow
  outline?: TextOutline
  // Hero arrangement only.
  heroKey: StatKey
  heroSecondary: boolean
}

export interface StatsContent {
  dayLabel: string
  visible: Record<StatKey, boolean>
  // Every key appears once.
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

export type LayoutKey = 'g1' | 'g2h' | 'g2v' | 'g2v1h' | 'g22' | 'g1b2s' | 'g2s1b' | 'g3h' | 'g3v' | 'g4v' | 'g23' | 'g1b3s' | 'g3s1b' | 'w1b2s' | 'w1p' | 'c1' | 'c2' | 'c3' | 'c4'

export type LayoutGroup = 'grid' | 'creative'

export interface Photo {
  id: number
  name: string
  image: HTMLCanvasElement
  // Small data URL for the photo tape and layout thumbnails.
  thumb: string
  // From EXIF; matches the photo to a place on the route.
  geo?: PhotoGeo
}

export interface PhotoGeo {
  lat?: number
  lon?: number
  // Epoch ms. EXIF keeps the camera's wall clock; without an offset tag it is read as local time.
  time?: number
}

// fill: covers the slot, centred; fit: the whole photo over a blurred copy; manual: covers it,
// dragged and zoomed by hand.
export type SlotCrop = 'fill' | 'fit' | 'manual'

export interface SlotAssignment {
  photoId: number
  zoom: number
  offsetX: number
  offsetY: number
  // Unset: the collage-wide fit decides.
  crop?: SlotCrop
}

// photos: a layout of photos (one photo is Zdjęcie, more a Kolaż); profile and summary are drawn
// from the route. The first slide is always the editor's own frame, whatever its kind.
export type SlideKind = 'photos' | 'profile' | 'summary'

export type MiniMap = 'off' | 'corner' | 'large'

export interface SlideOverlays {
  miniMap: MiniMap
  // "km 62 · 1 840 m" from the photo's place on the route.
  marker: boolean
}

export type SummaryFigure = 'distance' | 'moving' | 'duration' | 'gain' | 'avgSpeed' | 'highest' | 'climb' | 'days'

// How large a summary's figures are; many of them shrink further to fit.
export type FigureSize = 'small' | 'medium' | 'large'

// style: the project's paper; photo: this or another slide's photo, blurred and darkened.
export interface SlideBackground {
  source: 'style' | 'color' | 'photo'
  color: string
  // Whose photo: this slide's own (null) or another slide's, by index.
  fromSlide: number | null
  // 0-100: 0 is a sharp photo.
  blur: number
  // 0-100: how much the photo is darkened.
  dim: number
}

export interface SlideLook {
  paper: string
  ink: string
  accent: string
  font: string
}

// Fields past the layout belong to a series; a slide without them is a plain photo slide.
export interface Slide {
  layoutKey: LayoutKey
  slots: Record<number, SlotAssignment>
  kind?: SlideKind
  // Left out of the export and of the numbers on the map.
  skipped?: boolean
  overlays?: SlideOverlays
  // A place on the route set by hand (track index); otherwise the first photo's EXIF decides.
  place?: number
  background?: SlideBackground
  // A style exception: the project's look doesn't reach this slide.
  ownLook?: SlideLook
  // Profile: the steepest climb drawn over the line.
  climb?: boolean
  // Summary: the figures shown and the question to the audience.
  figures?: SummaryFigure[]
  figureSize?: FigureSize
  question?: string
  // An exception to the project's wrapper: this slide keeps its content full-bleed.
  wrapperOff?: boolean
}

// Shrinks every slide's content without changing it; a postmark is stamped over the content instead.
export type WrapperId = 'none' | 'postcard' | 'stamp' | 'postmark' | 'ticket' | 'album'

export type WrapperField = 'title' | 'place' | 'from' | 'to' | 'date' | 'note'

export interface Wrapper {
  id: WrapperId
  // Filled from the route when a wrapper is picked (only where empty), then edited in Teksty.
  fields: Record<WrapperField, string>
  // The postmark's centre in fractions of the slide, and whether it goes on every slide or the first.
  postmark: { x: number; y: number; all: boolean }
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
  // Fine lines over the background in the text colour; absent = none.
  pattern?: BackgroundPattern
}

export type BackgroundPattern = 'none' | 'grid' | 'contours'

// transparent: nothing behind the photos (a PNG to lay over a photo in Instagram);
// color / gradient / map: the whole frame is filled, so the file can also be a JPG.
export type BackgroundKind = 'transparent' | 'color' | 'gradient' | 'map'

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

export type AspectKey = '9:16' | '4:5' | '1:1' | '16:9'

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

// The side panel's tabs; 'route' is Mapa.
export type PanelTab = 'route' | 'media' | 'texts' | 'style' | 'animation'
// Anything with sub-tabs features can add pages to: a tab, or the export window.
export type TabKey = PanelTab | 'export'

// A project with a map (GPX files and planned trips mix freely) or a collage of photos alone,
// which never gets a route or a map.
export type ProjectMode = 'map' | 'collage'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  group?: string
  disabled?: boolean
}

export type Selection =
  | { kind: 'text' | 'waypoint'; id: number }
  | { kind: 'element'; element: ElementKind }
  | { kind: 'slot'; slide: number; index: number }

export interface RouteRange {
  start: number
  end: number
}
