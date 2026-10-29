import type { LayoutContext } from '../core/formats/layouts'
import { FORMATS } from '../core/formats/registry'
import { DEFAULT_SLOT_CROP } from '../store/defaults'
import type { DocumentState } from '../store/types'
import type { AspectKey, FormatLayout, FormatOverrides, Slide } from '../types'

// The layout authored in this format is the reference; the others are derived from it.
export const SOURCE_ASPECT: AspectKey = '4:5'

const TOLERANCE = 1

type LayoutState = Pick<DocumentState, 'texts' | 'placements' | 'routeTransform'>
type BaseState = LayoutState & Pick<DocumentState, 'aspectKey' | 'sourceLayout'>
type ReflowState = BaseState & Pick<DocumentState, 'layoutOverrides' | 'slides' | 'parkedSlides'>

export function readLayout(s: LayoutState): FormatLayout {
  return {
    texts: Object.fromEntries(s.texts.map((t) => [t.id, { x: t.x, y: t.y }])),
    elements: { ...s.placements },
    route: s.routeTransform,
  }
}

const context = (s: LayoutState, key: AspectKey): LayoutContext => ({ source: FORMATS[SOURCE_ASPECT], format: FORMATS[key], texts: s.texts })

// The automatic layout of a format, computed by the format's own strategy.
const autoLayout = (base: FormatLayout, s: LayoutState, key: AspectKey) => FORMATS[key].layout.fromSource(base, context(s, key))
const toSource = (live: FormatLayout, s: BaseState) => FORMATS[s.aspectKey].layout.toSource(live, context(s, s.aspectKey))

const near = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) <= TOLERANCE)

function routeDiffers(a: FormatLayout['route'], b: FormatLayout['route']) {
  return !near(a.x, b.x) || !near(a.y, b.y) || a.rotation !== b.rotation || Math.abs(a.scaleX - b.scaleX) > 0.001 || Math.abs(a.scaleY - b.scaleY) > 0.001
}

// Reference layout (in the source format) rebuilt from the live one plus what was remembered.
function baseFor(s: BaseState): FormatLayout {
  const live = readLayout(s)
  if (s.aspectKey === SOURCE_ASPECT) return live
  const inferred = toSource(live, s)
  const known = s.sourceLayout
  return {
    texts: Object.fromEntries(Object.keys(live.texts).map((id) => [id, known?.texts[Number(id)] ?? inferred.texts[Number(id)]])),
    elements: Object.fromEntries(Object.keys(live.elements).map((kind) => [kind, known?.elements[kind] ?? inferred.elements[kind]])),
    route: known?.route ?? inferred.route,
  }
}

function manualOverrides(live: FormatLayout, auto: FormatLayout): FormatOverrides {
  const texts: FormatOverrides['texts'] = {}
  for (const [id, p] of Object.entries(live.texts)) {
    const a = auto.texts[Number(id)]
    if (!a || !near(p.x, a.x) || !near(p.y, a.y)) texts[Number(id)] = p
  }
  const elements: FormatOverrides['elements'] = {}
  for (const [kind, p] of Object.entries(live.elements)) {
    const a = auto.elements[kind]
    if (!a || !near(p.x, a.x) || !near(p.y, a.y)) elements[kind] = p
  }
  const overrides: FormatOverrides = { texts, elements }
  if (routeDiffers(live.route, auto.route)) overrides.route = live.route
  return overrides
}

export interface ManualFlags {
  elements: Record<string, boolean>
  route: boolean
  texts: Record<number, boolean>
}

// Which elements were moved by hand in the current format (never in the source format).
export function manualFlags(s: BaseState): ManualFlags {
  if (s.aspectKey === SOURCE_ASPECT) return { elements: {}, route: false, texts: {} }
  const ov = manualOverrides(readLayout(s), autoLayout(baseFor(s), s, s.aspectKey))
  const flagged = (record: object) => Object.fromEntries(Object.keys(record).map((key) => [key, true]))
  return { elements: flagged(ov.elements), route: Boolean(ov.route), texts: flagged(ov.texts) }
}

export function hasManualLayout(flags: ManualFlags) {
  return flags.route || Object.keys(flags.elements).length > 0 || Object.keys(flags.texts).length > 0
}

function applyLayout(s: Pick<DocumentState, 'texts' | 'placements'>, layout: FormatLayout) {
  return {
    texts: s.texts.map((t) => (layout.texts[t.id] ? { ...t, ...layout.texts[t.id] } : t)),
    placements: { ...s.placements, ...layout.elements },
    routeTransform: layout.route,
  }
}

// Moves the document to another format: remembers what was placed by hand here and
// restores the hand-placed elements of the target; everything else is recomputed.
export function reflowTo(s: ReflowState, key: AspectKey): Partial<DocumentState> {
  if (s.aspectKey === key) return {}
  const base = baseFor(s)
  const layoutOverrides = { ...s.layoutOverrides }
  if (s.aspectKey !== SOURCE_ASPECT) layoutOverrides[s.aspectKey] = manualOverrides(readLayout(s), autoLayout(base, s, s.aspectKey))

  let next = key === SOURCE_ASPECT ? base : autoLayout(base, s, key)
  const ov = layoutOverrides[key]
  if (key !== SOURCE_ASPECT && ov) {
    next = {
      texts: { ...next.texts, ...Object.fromEntries(Object.entries(ov.texts).filter(([id]) => next.texts[Number(id)])) },
      elements: { ...next.elements, ...ov.elements },
      route: ov.route ?? next.route,
    }
  }

  return {
    aspectKey: key,
    ...applyLayout(s, next),
    sourceLayout: key === SOURCE_ASPECT ? null : base,
    layoutOverrides,
    // Crops were framed for the old shape.
    ...carouselSlides(
      s.slides.map((slide) => ({
        ...slide,
        slots: Object.fromEntries(Object.entries(slide.slots).map(([i, a]) => [i, { ...a, ...DEFAULT_SLOT_CROP }])),
      })),
      s.parkedSlides,
      FORMATS[key].carousel,
    ),
  }
}

// A format without a carousel shows only the first slide; the others wait for one that has it.
function carouselSlides(slides: Slide[], parked: Slide[], carousel: boolean): Pick<DocumentState, 'slides' | 'parkedSlides'> {
  return carousel ? { slides: [...slides, ...parked], parkedSlides: [] } : { slides: slides.slice(0, 1), parkedSlides: [...slides.slice(1), ...parked] }
}

// Slides the given format exports, whichever format is open now; skipped ones stay out.
export function slideCountIn(s: Pick<DocumentState, 'slides' | 'parkedSlides'>, key: AspectKey): number {
  return FORMATS[key].carousel ? [...s.slides, ...s.parkedSlides].filter((slide) => !slide.skipped).length : 1
}

// Drops every hand-placed element of the current format and follows the source again.
export function resetToAuto(s: ReflowState): Partial<DocumentState> {
  if (s.aspectKey === SOURCE_ASPECT) return {}
  const base = baseFor(s)
  const layoutOverrides = { ...s.layoutOverrides }
  delete layoutOverrides[s.aspectKey]
  return { ...applyLayout(s, autoLayout(base, s, s.aspectKey)), sourceLayout: base, layoutOverrides }
}
