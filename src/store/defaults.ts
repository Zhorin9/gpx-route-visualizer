import { DEFAULT_FONT } from '../utils/fonts'
import { DEFAULT_LAYOUT } from '../utils/layouts'
import type {
  CollageStyle,
  RouteStyle,
  RouteTransform,
  Slide,
  SlotAssignment,
  StatsContent,
  StatsLayout,
  StatsStyle,
  StylePreset,
  TextNode,
  Waypoint,
} from '../types'

export const DEFAULT_ROUTE_STYLE: RouteStyle = {
  color: '#ffffff',
  coreWidth: 5,
  glowEnabled: false,
  glowWidth: 14,
  glowBlur: 25,
  remainingVisible: true,
  remainingDashed: true,
  remainingOpacity: 0.35,
  remainingColor: '#ffffff',
  remainingWidth: 2,
  shape: 'natural',
  dashed: false,
  schematicSimplify: 40,
}

export const STYLE_PRESETS: Record<StylePreset, Partial<RouteStyle>> = {
  flat: { coreWidth: 5, glowEnabled: false },
  neon: { coreWidth: 3.5, glowEnabled: true, glowWidth: 14, glowBlur: 25 },
}

export const DAY_COLORS = ['#ffe3bf', '#ffffff', '#f4a58a', '#9fd3c7', '#c9b6e4', '#f2e07b']

export const IDENTITY_TRANSFORM: RouteTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }

export const DEFAULT_STATS_STYLE: StatsStyle = {
  fontFamily: DEFAULT_FONT,
  color: '#ffffff',
  fontSize: 38,
  spacing: 40,
  rotation: 0,
}

export const DEFAULT_STATS_CONTENT: StatsContent = {
  dayLabel: 'DZIEŃ 1',
  visible: { day: true, distance: true, elevation: true, time: true },
  overrides: { distance: '', elevation: '', time: '' },
  distancePrecision: 1,
  elevationRoundTo: 1,
}

export const DEFAULT_STATS_LAYOUT: StatsLayout = { x: null, y: null, chipOffsets: {} }

export const DEFAULT_SLOT_CROP: Pick<SlotAssignment, 'zoom' | 'offsetX' | 'offsetY'> = { zoom: 1, offsetX: 0, offsetY: 0 }

export const DEFAULT_COLLAGE: CollageStyle = {
  gap: 8,
  margin: 0,
  bgColor: '#f3f2f2',
  frame: { enabled: false, color: '#ffffff', thickness: 18, style: 'equal' },
  fit: 'cover',
}

export const DEFAULT_SLIDES: Slide[] = [{ layoutKey: DEFAULT_LAYOUT, slots: {} }]

export const MIN_CAROUSEL_SLIDES = 2
export const CAROUSEL_SLIDES = 2
export const MAX_SLIDES = 5

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
