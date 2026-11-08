import { rotate } from './geometry'
import type { CarouselKind, FrameKind, LayoutGroup, LayoutKey, Slide } from '../types'
import type { TKey } from '../i18n'

export type SlotKind = 'cell' | 'backdrop' | 'framed'

// Fractions of the frame.
interface LayoutCell {
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  kind?: SlotKind
}

export interface LayoutDef {
  key: LayoutKey
  label: TKey
  group: LayoutGroup
  cells: LayoutCell[]
  orientation?: 'portrait' | 'landscape'
}

const T = 1 / 3

const cell = (x: number, y: number, w: number, h: number): LayoutCell => ({ x, y, w, h })
const framed = (x: number, y: number, w: number, h: number, rotation?: number): LayoutCell =>
  ({ x, y, w, h, ...(rotation !== undefined && { rotation }), kind: 'framed' })
const BACKDROP: LayoutCell = { x: 0, y: 0, w: 1, h: 1, kind: 'backdrop' }

const grid = (key: LayoutKey, label: TKey, cells: LayoutCell[], orientation?: LayoutDef['orientation']): LayoutDef =>
  ({ key, label, group: 'grid', cells, ...(orientation && { orientation }) })
const creative = (key: LayoutKey, label: TKey, cells: LayoutCell[]): LayoutDef => ({ key, label, group: 'creative', cells })

export const LAYOUTS: LayoutDef[] = [
  grid('g1', 'layouts.g1', [cell(0, 0, 1, 1)]),
  grid('g2h', 'layouts.g2h', [cell(0, 0, 1, 0.5), cell(0, 0.5, 1, 0.5)]),
  grid('g2v', 'layouts.g2v', [cell(0, 0, 0.5, 1), cell(0.5, 0, 0.5, 1)]),
  grid('g2v1h', 'layouts.g2v1h', [cell(0, 0, 0.5, 0.5), cell(0.5, 0, 0.5, 0.5), cell(0, 0.5, 1, 0.5)]),
  grid('g22', 'layouts.g22', [cell(0, 0, 0.5, 0.5), cell(0.5, 0, 0.5, 0.5), cell(0, 0.5, 0.5, 0.5), cell(0.5, 0.5, 0.5, 0.5)]),
  grid('g1b2s', 'layouts.g1b2s', [cell(0, 0, 1, 0.62), cell(0, 0.62, 0.5, 0.38), cell(0.5, 0.62, 0.5, 0.38)]),
  grid('g2s1b', 'layouts.g2s1b', [cell(0, 0, 0.5, 0.38), cell(0.5, 0, 0.5, 0.38), cell(0, 0.38, 1, 0.62)]),
  grid('g3h', 'layouts.g3h', [cell(0, 0, 1, T), cell(0, T, 1, T), cell(0, 2 * T, 1, T)], 'portrait'),
  grid('g3v', 'layouts.g3v', [cell(0, 0, T, 1), cell(T, 0, T, 1), cell(2 * T, 0, T, 1)]),
  grid('g4v', 'layouts.g4v', [0, 0.25, 0.5, 0.75].map((x) => cell(x, 0, 0.25, 1))),
  grid('g23', 'layouts.g23', [0, T, 2 * T].flatMap((y) => [cell(0, y, 0.5, T), cell(0.5, y, 0.5, T)]), 'portrait'),
  grid('g1b3s', 'layouts.g1b3s', [cell(0, 0, 1, 0.6), cell(0, 0.6, T, 0.4), cell(T, 0.6, T, 0.4), cell(2 * T, 0.6, T, 0.4)]),
  grid('g3s1b', 'layouts.g3s1b', [cell(0, 0, T, 0.4), cell(T, 0, T, 0.4), cell(2 * T, 0, T, 0.4), cell(0, 0.4, 1, 0.6)]),
  grid('w1b2s', 'layouts.w1b2s', [cell(0, 0, 2 * T, 1), cell(2 * T, 0, T, 0.5), cell(2 * T, 0.5, T, 0.5)], 'landscape'),
  // Leaves the side column of the landscape layout to the title and stats.
  grid('w1p', 'layouts.w1p', [cell(0, 0, 0.6, 1)], 'landscape'),
  creative('c1', 'layouts.c1', [BACKDROP, framed(0.18, 0.26, 0.64, 0.48)]),
  creative('c2', 'layouts.c2', [BACKDROP, framed(0.5, 0.55, 0.42, 0.36)]),
  creative('c3', 'layouts.c3', [BACKDROP, framed(0.08, 0.36, 0.84, 0.56)]),
  creative('c4', 'layouts.c4', [framed(0.08, 0.06, 0.56, 0.46, -2), framed(0.4, 0.3, 0.52, 0.4, 2.5), framed(0.14, 0.58, 0.58, 0.36, -1.5)]),
]

const LAYOUT_BY_KEY = new Map(LAYOUTS.map((l) => [l.key, l]))

export const DEFAULT_LAYOUT: LayoutKey = 'g1'

export function layoutFits(def: LayoutDef, w: number, h: number): boolean {
  return !def.orientation || (def.orientation === 'landscape') === w > h
}

export function layoutDef(key: LayoutKey): LayoutDef {
  return LAYOUT_BY_KEY.get(key) ?? LAYOUTS[0]
}

export interface SlotRect {
  index: number
  x: number
  y: number
  w: number
  h: number
  rotation: number
  kind: SlotKind
}

export function computeSlots(def: LayoutDef, W: number, H: number, gap: number, margin: number): SlotRect[] {
  const innerW = W - 2 * margin
  const innerH = H - 2 * margin
  return def.cells.map((c, index) => {
    const kind = c.kind ?? 'cell'
    if (kind === 'backdrop') return { index, x: 0, y: 0, w: W, h: H, rotation: 0, kind }
    if (kind === 'framed') return { index, x: c.x * W, y: c.y * H, w: c.w * W, h: c.h * H, rotation: c.rotation ?? 0, kind }
    const x = margin + c.x * innerW + (c.x > 0.001 ? gap / 2 : 0)
    const y = margin + c.y * innerH + (c.y > 0.001 ? gap / 2 : 0)
    const right = margin + (c.x + c.w) * innerW - (c.x + c.w < 0.999 ? gap / 2 : 0)
    const bottom = margin + (c.y + c.h) * innerH - (c.y + c.h < 0.999 ? gap / 2 : 0)
    return { index, x, y, w: right - x, h: bottom - y, rotation: 0, kind }
  })
}

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export function frameInsets(slot: SlotRect, thickness: number, style: 'equal' | 'polaroid', framed: boolean): Insets {
  if (!framed) return { top: 0, right: 0, bottom: 0, left: 0 }
  const t = Math.max(0, Math.min(thickness, slot.w / 2 - 2, slot.h / 2 - 2))
  const bottom = style === 'polaroid' ? Math.min(thickness * 2.6, slot.h / 2 - 4) : t
  return { top: t, right: t, bottom: Math.max(t, bottom), left: t }
}

export function ribbonSlot(w: number, h: number, count: number): SlotRect {
  return { index: 0, x: 0, y: 0, w: w * count, h, rotation: 0, kind: 'cell' }
}

// Later slots are drawn on top.
export function slotAt(slots: SlotRect[], px: number, py: number): SlotRect | null {
  for (let i = slots.length - 1; i >= 0; i--) {
    const s = slots[i]
    const local = rotate(px - s.x - s.w / 2, py - s.y - s.h / 2, -s.rotation)
    if (Math.abs(local.x) <= s.w / 2 && Math.abs(local.y) <= s.h / 2) return s
  }
  return null
}

export function frameStyleFor(key: LayoutKey): FrameKind {
  return layoutDef(key).group === 'creative' ? 'polaroid' : 'equal'
}

export const slotCount = (slide: Slide) => ((slide.kind ?? 'photos') === 'photos' ? layoutDef(slide.layoutKey).cells.length : 0)

export function isPanorama(slides: Slide[], kind: CarouselKind) {
  return kind === 'panorama' && slides.length > 1
}

// A panorama hides the other slides' slots.
export function hasVisiblePhotos(slides: Slide[], kind: CarouselKind) {
  if (isPanorama(slides, kind)) return Boolean(slides[0].slots[0])
  return slides.some((slide) => Object.keys(slide.slots).length > 0)
}

export function photoCoversFrame(slides: Slide[], kind: CarouselKind, W: number, H: number, gap: number, margin: number): boolean {
  if (isPanorama(slides, kind)) return Boolean(slides[0].slots[0])
  const covered = (slide: Slide) =>
    computeSlots(layoutDef(slide.layoutKey), W, H, gap, margin).some(
      (slot) => slide.slots[slot.index] && (slot.kind === 'backdrop' || (slot.rotation === 0 && slot.x <= 0.5 && slot.y <= 0.5 && slot.w >= W - 1 && slot.h >= H - 1)),
    )
  return slides.every((slide) => !slotCount(slide) || covered(slide))
}
