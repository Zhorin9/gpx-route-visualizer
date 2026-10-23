import { DEFAULT_FONT } from '../utils/fonts'
import { DEFAULT_LAYOUT } from '../utils/layouts'
import type {
  CollageStyle,
  PointStyle,
  RouteStyle,
  RouteTransform,
  Slide,
  SlotAssignment,
  StatKey,
  StatsContent,
  StatsLayout,
  StatsStyle,
  StylePreset,
  TextNode,
  TitleStyle,
  Waypoint,
} from '../types'

export const DEFAULT_ROUTE_STYLE: RouteStyle = {
  color: '#ffffff',
  coreWidth: 5,
  glowEnabled: false,
  glowWidth: 14,
  glowBlur: 25,
  glowColor: null,
  glowOpacity: 0.8,
  remainingVisible: true,
  remainingDashed: true,
  remainingOpacity: 0.35,
  remainingColor: '#ffffff',
  remainingWidth: 2,
  shape: 'natural',
  dashed: false,
  dotted: false,
  schematicSimplify: 40,
}

export const STYLE_PRESETS: Record<StylePreset, Partial<RouteStyle>> = {
  flat: { coreWidth: 5, glowEnabled: false },
  neon: { coreWidth: 1.5, glowEnabled: true, glowWidth: 6, glowBlur: 15, glowColor: null, glowOpacity: 0.44 },
}

export const DAY_COLORS = ['#ffe3bf', '#ffffff', '#f4a58a', '#9fd3c7', '#c9b6e4', '#f2e07b']

export const IDENTITY_TRANSFORM: RouteTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }

export const DEFAULT_STATS_STYLE: StatsStyle = {
  arrangement: 'columns',
  stretch: true,
  labels: true,
  dividers: true,
  fontFamily: DEFAULT_FONT,
  color: '#ffffff',
  fontSize: 38,
  spacing: 40,
  rotation: 0,
  heroKey: 'distance',
  heroSecondary: true,
}

export const STAT_ORDER: StatKey[] = ['day', 'distance', 'elevation', 'time', 'movingTime', 'avgSpeed', 'maxElevation']

export const DEFAULT_STATS_CONTENT: StatsContent = {
  dayLabel: 'DZIEŃ 1',
  visible: { day: false, distance: true, elevation: false, time: true, movingTime: false, avgSpeed: true, maxElevation: false },
  order: STAT_ORDER,
  units: 'metric',
  overrides: { distance: '', elevation: '', time: '', movingTime: '', avgSpeed: '', maxElevation: '' },
  distancePrecision: 1,
  elevationRoundTo: 1,
}

export const DEFAULT_STATS_LAYOUT: StatsLayout = { chipOffsets: {} }

export const DEFAULT_SLOT_CROP: Pick<SlotAssignment, 'zoom' | 'offsetX' | 'offsetY'> = { zoom: 1, offsetX: 0, offsetY: 0 }

export const DEFAULT_COLLAGE: CollageStyle = {
  gap: 8,
  margin: 0,
  bgColor: '#f3f2f2',
  bgKind: 'transparent',
  gradient: { from: '#a06f24', to: '#444141', angle: 172, grain: 6, smooth: true, pattern: 'none' },
  autoContrast: true,
  frame: { enabled: false, color: '#ffffff', thickness: 18, style: 'equal' },
  fit: 'cover',
}

export const DEFAULT_POINT_STYLE: PointStyle = { marker: 'polaroid', size: 'M' }

export const DEFAULT_SLIDES: Slide[] = [{ layoutKey: DEFAULT_LAYOUT, slots: {} }]

export const MIN_CAROUSEL_SLIDES = 2
export const CAROUSEL_SLIDES = 2
export const MAX_SLIDES = 5

// The next free id in a list of document items.
export function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export function makeText(id: number, stageW: number, stageH: number): TextNode {
  return {
    id,
    text: 'Nowy tekst',
    x: stageW / 2 - 120,
    y: stageH / 2,
    fontSize: 48,
    fontFamily: DEFAULT_FONT,
    color: '#ffffff',
    bold: false,
    italic: false,
    letterSpacing: 0,
    rotation: 0,
    opacity: 1,
    outlineEnabled: false,
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowEnabled: true,
  }
}

export const DEFAULT_TITLE_STYLE: TitleStyle = {
  fontFamily: DEFAULT_FONT,
  color: '#ffffff',
  italic: false,
  uppercase: true,
}

export const TITLE_FONT_SIZE = 80

// The track name, placed as on the template previews: centred, near the top.
export function makeTitle(id: number, text: string, style: TitleStyle, at: { x: number; y: number }): TextNode {
  return {
    ...makeText(id, 0, 0),
    text,
    ...at,
    fontSize: TITLE_FONT_SIZE,
    fontFamily: style.fontFamily,
    color: style.color,
    italic: style.italic,
    uppercase: style.uppercase,
    letterSpacing: Math.round(TITLE_FONT_SIZE * 0.12),
    role: 'title',
  }
}

export function makeWaypoint(id: number, trackPos: number): Waypoint {
  return {
    id,
    kind: 'point',
    trackPos,
    dx: 40,
    dy: -34,
    text: 'Miejscowość',
    fontFamily: DEFAULT_FONT,
    fontSize: 26,
    color: '#ffffff',
  }
}
