import type { ElementPlacement, FormatLayout, TextNode } from '../../types'
import type { FormatDef } from './registry'

export interface LayoutContext {
  // The format the reference layout is authored in, and the one being laid out.
  source: FormatDef
  format: FormatDef
  texts: readonly TextNode[]
}

// How a format places what the user laid out in the source format.
export interface LayoutStrategy {
  fromSource: (base: FormatLayout, ctx: LayoutContext) => FormatLayout
  // Inverse, for elements that only exist in this format so far.
  toSource: (layout: FormatLayout, ctx: LayoutContext) => FormatLayout
}

const IDENTITY = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
// Room kept under a text's top edge so it doesn't run into the bottom safe zone.
const TEXT_BOTTOM_ROOM = 60
const TEXT_GAP = 16

const mapElements = (elements: FormatLayout['elements'], fn: (p: ElementPlacement) => ElementPlacement) =>
  Object.fromEntries(Object.entries(elements).map(([kind, p]) => [kind, fn(p)]))

const mapTexts = (texts: FormatLayout['texts'], fn: (p: { x: number; y: number }, id: number) => { x: number; y: number }) =>
  Object.fromEntries(Object.entries(texts).map(([id, p]) => [id, fn(p, Number(id))]))

// Distance from the bottom edge that elements anchored there keep.
export function insetBelow({ safeZone }: FormatDef): number {
  return safeZone ? safeZone.bottom + 20 : 60
}

function clampToSafe(y: number, { h, safeZone }: FormatDef): number {
  if (!safeZone) return y
  return Math.max(safeZone.top, Math.min(h - safeZone.bottom - TEXT_BOTTOM_ROOM, y))
}

// Same width in every portrait format, so only vertical positions change.
export const stretchLayout: LayoutStrategy = {
  fromSource: (base, { source, format }) => {
    const ratio = format.h / source.h
    return {
      texts: mapTexts(base.texts, (p) => ({ x: p.x, y: clampToSafe(p.y * ratio, format) })),
      elements: mapElements(base.elements, (p) => ({ x: p.x, y: p.y == null ? null : clampToSafe(p.y * ratio, format) })),
      route: { ...base.route, y: base.route.y * ratio },
    }
  },
  toSource: (layout, { source, format }) => {
    const ratio = source.h / format.h
    return {
      texts: mapTexts(layout.texts, (p) => ({ x: p.x, y: p.y * ratio })),
      elements: mapElements(layout.elements, (p) => ({ x: p.x, y: p.y == null ? null : p.y * ratio })),
      route: { ...layout.route, y: layout.route.y * ratio },
    }
  },
}

// Landscape: the route fills the left part (it is projected there), the title and stats head the
// right column, the user's texts stack at its foot in their portrait order. Elements go to their
// own default places for the format; a hand-placed one stays an override of this format only.
export const columnLayout: LayoutStrategy = {
  fromSource: (base, { format, texts }) => {
    const { side, footH } = format.columns!
    const placed: FormatLayout['texts'] = {}
    let bottom = format.h - insetBelow(format) - footH
    const own = texts.filter((t) => t.role !== 'title' && base.texts[t.id]).sort((a, b) => base.texts[b.id].y - base.texts[a.id].y)
    for (const t of own) {
      bottom -= t.fontSize * t.text.split('\n').length
      placed[t.id] = { x: side.x, y: Math.round(bottom) }
      bottom -= TEXT_GAP
    }
    for (const t of texts) if (t.role === 'title' && base.texts[t.id]) placed[t.id] = { x: side.x, y: side.y }
    return { texts: placed, elements: mapElements(base.elements, () => ({ x: null, y: null })), route: IDENTITY }
  },
  toSource: (layout, { source, format }) => {
    const side = format.columns!.side
    const ratio = source.h / format.h
    return {
      texts: mapTexts(layout.texts, (p) => ({ x: Math.max(0, Math.min(source.w - TEXT_GAP, p.x - side.x)), y: p.y * ratio })),
      elements: mapElements(layout.elements, () => ({ x: null, y: null })),
      route: IDENTITY,
    }
  },
}
