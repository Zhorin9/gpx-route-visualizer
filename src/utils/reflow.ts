import { DEFAULT_SLOT_CROP } from '../store/defaults'
import type { DocumentState } from '../store/types'
import type { AspectKey, FormatLayout, FormatOverrides } from '../types'
import { ASPECTS, STORY_SAFE_ZONE } from './aspects'

// The layout authored in this format is the reference; the others are derived from it.
export const SOURCE_ASPECT: AspectKey = '4:5'
export const FORMAT_ORDER: AspectKey[] = ['4:5', '9:16', '1:1']

const TOLERANCE = 1
// Room kept under a text's top edge so it doesn't run into the story's reply box.
const TEXT_BOTTOM_ROOM = 60

type LayoutState = Pick<DocumentState, 'texts' | 'statsLayout' | 'routeTransform'>
type BaseState = LayoutState & Pick<DocumentState, 'aspectKey' | 'sourceLayout'>
type ReflowState = BaseState & Pick<DocumentState, 'layoutOverrides' | 'slides'>

export function readLayout(s: LayoutState): FormatLayout {
  return {
    texts: Object.fromEntries(s.texts.map((t) => [t.id, { x: t.x, y: t.y }])),
    stats: { x: s.statsLayout.x, y: s.statsLayout.y },
    route: s.routeTransform,
  }
}

function clampToSafe(y: number, aspect: AspectKey): number {
  if (aspect !== '9:16') return y
  return Math.max(STORY_SAFE_ZONE.top, Math.min(ASPECTS[aspect].h - STORY_SAFE_ZONE.bottom - TEXT_BOTTOM_ROOM, y))
}

// Same width in every format, so only vertical positions change.
export function autoLayout(base: FormatLayout, to: AspectKey): FormatLayout {
  const ratio = ASPECTS[to].h / ASPECTS[SOURCE_ASPECT].h
  return {
    texts: Object.fromEntries(Object.entries(base.texts).map(([id, p]) => [id, { x: p.x, y: clampToSafe(p.y * ratio, to) }])),
    stats: { x: base.stats.x, y: base.stats.y == null ? null : clampToSafe(base.stats.y * ratio, to) },
    route: { ...base.route, y: base.route.y * ratio },
  }
}

function toSource(layout: FormatLayout, from: AspectKey): FormatLayout {
  const ratio = ASPECTS[SOURCE_ASPECT].h / ASPECTS[from].h
  return {
    texts: Object.fromEntries(Object.entries(layout.texts).map(([id, p]) => [id, { x: p.x, y: p.y * ratio }])),
    stats: { x: layout.stats.x, y: layout.stats.y == null ? null : layout.stats.y * ratio },
    route: { ...layout.route, y: layout.route.y * ratio },
  }
}

const near = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) <= TOLERANCE)

function routeDiffers(a: FormatLayout['route'], b: FormatLayout['route']) {
  return !near(a.x, b.x) || !near(a.y, b.y) || a.rotation !== b.rotation || Math.abs(a.scaleX - b.scaleX) > 0.001 || Math.abs(a.scaleY - b.scaleY) > 0.001
}

// Reference layout (in the source format) rebuilt from the live one plus what was remembered.
function baseFor(s: BaseState): FormatLayout {
  const live = readLayout(s)
  if (s.aspectKey === SOURCE_ASPECT) return live
  const inferred = toSource(live, s.aspectKey)
  const known = s.sourceLayout
  return {
    texts: Object.fromEntries(Object.keys(live.texts).map((id) => [id, known?.texts[Number(id)] ?? inferred.texts[Number(id)]])),
    stats: known?.stats ?? inferred.stats,
    route: known?.route ?? inferred.route,
  }
}

function manualOverrides(live: FormatLayout, auto: FormatLayout): FormatOverrides {
  const texts: FormatOverrides['texts'] = {}
  for (const [id, p] of Object.entries(live.texts)) {
    const a = auto.texts[Number(id)]
    if (!a || !near(p.x, a.x) || !near(p.y, a.y)) texts[Number(id)] = p
  }
  const overrides: FormatOverrides = { texts }
  if (!near(live.stats.x, auto.stats.x) || !near(live.stats.y, auto.stats.y)) overrides.stats = live.stats
  if (routeDiffers(live.route, auto.route)) overrides.route = live.route
  return overrides
}

export interface ManualFlags {
  stats: boolean
  route: boolean
  texts: Record<number, boolean>
}

// Which elements were moved by hand in the current format (never in the source format).
export function manualFlags(s: BaseState): ManualFlags {
  if (s.aspectKey === SOURCE_ASPECT) return { stats: false, route: false, texts: {} }
  const ov = manualOverrides(readLayout(s), autoLayout(baseFor(s), s.aspectKey))
  return { stats: Boolean(ov.stats), route: Boolean(ov.route), texts: Object.fromEntries(Object.keys(ov.texts).map((id) => [id, true])) }
}

export function hasManualLayout(flags: ManualFlags) {
  return flags.stats || flags.route || Object.keys(flags.texts).length > 0
}

function applyLayout(s: Pick<DocumentState, 'texts' | 'statsLayout'>, layout: FormatLayout) {
  return {
    texts: s.texts.map((t) => (layout.texts[t.id] ? { ...t, ...layout.texts[t.id] } : t)),
    statsLayout: { ...s.statsLayout, x: layout.stats.x, y: layout.stats.y },
    routeTransform: layout.route,
  }
}

// Moves the document to another format: remembers what was placed by hand here and
// restores the hand-placed elements of the target; everything else is recomputed.
export function reflowTo(s: ReflowState, key: AspectKey): Partial<DocumentState> {
  if (s.aspectKey === key) return {}
  const base = baseFor(s)
  const layoutOverrides = { ...s.layoutOverrides }
  if (s.aspectKey !== SOURCE_ASPECT) layoutOverrides[s.aspectKey] = manualOverrides(readLayout(s), autoLayout(base, s.aspectKey))

  let next = key === SOURCE_ASPECT ? base : autoLayout(base, key)
  const ov = layoutOverrides[key]
  if (key !== SOURCE_ASPECT && ov) {
    next = {
      texts: { ...next.texts, ...Object.fromEntries(Object.entries(ov.texts).filter(([id]) => next.texts[Number(id)])) },
      stats: ov.stats ?? next.stats,
      route: ov.route ?? next.route,
    }
  }

  return {
    aspectKey: key,
    ...applyLayout(s, next),
    sourceLayout: key === SOURCE_ASPECT ? null : base,
    layoutOverrides,
    // Crops were framed for the old shape.
    slides: s.slides.map((slide) => ({
      ...slide,
      slots: Object.fromEntries(Object.entries(slide.slots).map(([i, a]) => [i, { ...a, ...DEFAULT_SLOT_CROP }])),
    })),
  }
}

// Drops every hand-placed element of the current format and follows the source again.
export function resetToAuto(s: ReflowState): Partial<DocumentState> {
  if (s.aspectKey === SOURCE_ASPECT) return {}
  const base = baseFor(s)
  const layoutOverrides = { ...s.layoutOverrides }
  delete layoutOverrides[s.aspectKey]
  return { ...applyLayout(s, autoLayout(base, s.aspectKey)), sourceLayout: base, layoutOverrides }
}
