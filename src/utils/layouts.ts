import type { CarouselKind, FrameKind, LayoutGroup, LayoutKey, Slide } from '../types'

export type SlotKind = 'cell' | 'backdrop' | 'framed'

// Fractions of the frame. Grid cells split the frame (gap/margin applied),
// backdrops cover it, framed cells float freely and may be tilted.
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
  label: string
  group: LayoutGroup
  cells: LayoutCell[]
}

const T = 1 / 3

export const LAYOUTS: LayoutDef[] = [
  { key: 'g1', label: '1 zdjęcie', group: 'grid', cells: [{ x: 0, y: 0, w: 1, h: 1 }] },
  {
    key: 'g2h',
    label: '2 poziome',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    key: 'g2v',
    label: '2 pionowe',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    key: 'g2v1h',
    label: '2 pionowe + 1 poziome',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    key: 'g22',
    label: '2×2',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    key: 'g1b2s',
    label: '1 duże + 2 małe',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
    ],
  },
  {
    key: 'g2s1b',
    label: '2 małe + 1 duże',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0, w: 0.5, h: 0.38 },
      { x: 0, y: 0.38, w: 1, h: 0.62 },
    ],
  },
  {
    key: 'g3h',
    label: '3 poziome',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 1, h: T },
      { x: 0, y: T, w: 1, h: T },
      { x: 0, y: 2 * T, w: 1, h: T },
    ],
  },
  {
    key: 'g3v',
    label: '3 pionowe',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: T, h: 1 },
      { x: T, y: 0, w: T, h: 1 },
      { x: 2 * T, y: 0, w: T, h: 1 },
    ],
  },
  {
    key: 'g4v',
    label: '4 pionowe',
    group: 'grid',
    cells: [0, 0.25, 0.5, 0.75].map((x) => ({ x, y: 0, w: 0.25, h: 1 })),
  },
  {
    key: 'g23',
    label: '2×3',
    group: 'grid',
    cells: [0, T, 2 * T].flatMap((y) => [
      { x: 0, y, w: 0.5, h: T },
      { x: 0.5, y, w: 0.5, h: T },
    ]),
  },
  {
    key: 'g1b3s',
    label: '1 duże + 3 małe',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: T, h: 0.4 },
      { x: T, y: 0.6, w: T, h: 0.4 },
      { x: 2 * T, y: 0.6, w: T, h: 0.4 },
    ],
  },
  {
    key: 'g3s1b',
    label: '3 małe + 1 duże',
    group: 'grid',
    cells: [
      { x: 0, y: 0, w: T, h: 0.4 },
      { x: T, y: 0, w: T, h: 0.4 },
      { x: 2 * T, y: 0, w: T, h: 0.4 },
      { x: 0, y: 0.4, w: 1, h: 0.6 },
    ],
  },
  {
    key: 'c1',
    label: 'Tło + ramka na środku',
    group: 'creative',
    cells: [
      { x: 0, y: 0, w: 1, h: 1, kind: 'backdrop' },
      { x: 0.18, y: 0.26, w: 0.64, h: 0.48, kind: 'framed' },
    ],
  },
  {
    key: 'c2',
    label: 'Tło + ramka w rogu',
    group: 'creative',
    cells: [
      { x: 0, y: 0, w: 1, h: 1, kind: 'backdrop' },
      { x: 0.5, y: 0.55, w: 0.42, h: 0.36, kind: 'framed' },
    ],
  },
  {
    key: 'c3',
    label: 'Tło + duża na dole',
    group: 'creative',
    cells: [
      { x: 0, y: 0, w: 1, h: 1, kind: 'backdrop' },
      { x: 0.08, y: 0.36, w: 0.84, h: 0.56, kind: 'framed' },
    ],
  },
  {
    key: 'c4',
    label: 'Scrapbook ×3',
    group: 'creative',
    cells: [
      { x: 0.08, y: 0.06, w: 0.56, h: 0.46, rotation: -2, kind: 'framed' },
      { x: 0.4, y: 0.3, w: 0.52, h: 0.4, rotation: 2.5, kind: 'framed' },
      { x: 0.14, y: 0.58, w: 0.58, h: 0.36, rotation: -1.5, kind: 'framed' },
    ],
  },
]

export const LAYOUT_BY_KEY = new Map(LAYOUTS.map((l) => [l.key, l]))

export const DEFAULT_LAYOUT: LayoutKey = 'g1'

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

// Slot rectangles in frame pixels, with the gap split evenly between neighbours
// and the margin kept around the whole grid.
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

// How much of a slot the frame takes. "Polaroid" leaves a thicker bottom edge.
export function frameInsets(slot: SlotRect, thickness: number, style: 'equal' | 'polaroid', framed: boolean): Insets {
  if (!framed) return { top: 0, right: 0, bottom: 0, left: 0 }
  const t = Math.max(0, Math.min(thickness, slot.w / 2 - 2, slot.h / 2 - 2))
  const bottom = style === 'polaroid' ? Math.min(thickness * 2.6, slot.h / 2 - 4) : t
  return { top: t, right: t, bottom: Math.max(t, bottom), left: t }
}

// In a panorama carousel one photo covers the whole ribbon of `count` frames.
export function ribbonSlot(w: number, h: number, count: number): SlotRect {
  return { index: 0, x: 0, y: 0, w: w * count, h, rotation: 0, kind: 'cell' }
}

// Topmost slot under a point in frame pixels (later slots are drawn on top).
export function slotAt(slots: SlotRect[], px: number, py: number): SlotRect | null {
  for (let i = slots.length - 1; i >= 0; i--) {
    const s = slots[i]
    const cx = s.x + s.w / 2
    const cy = s.y + s.h / 2
    const rad = (-s.rotation * Math.PI) / 180
    const dx = px - cx
    const dy = py - cy
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
    if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) return s
  }
  return null
}

// Creative layouts come with polaroid frames, grids with equal ones.
export function frameStyleFor(key: LayoutKey): FrameKind {
  return layoutDef(key).group === 'creative' ? 'polaroid' : 'equal'
}

export function isPanorama(slides: Slide[], kind: CarouselKind) {
  return kind === 'panorama' && slides.length > 1
}

// Only the photos that are actually on the canvas: a panorama hides the other slides' slots.
export function hasVisiblePhotos(slides: Slide[], kind: CarouselKind) {
  if (isPanorama(slides, kind)) return Boolean(slides[0].slots[0])
  return slides.some((slide) => Object.keys(slide.slots).length > 0)
}

// Every slide is fully covered by a photo (one photo over the whole frame, a backdrop
// behind framed photos, a panorama): the background colour or gradient can't be seen.
export function photoCoversFrame(slides: Slide[], kind: CarouselKind, W: number, H: number, gap: number, margin: number): boolean {
  if (isPanorama(slides, kind)) return Boolean(slides[0].slots[0])
  return slides.every((slide) =>
    computeSlots(layoutDef(slide.layoutKey), W, H, gap, margin).some(
      (slot) => slide.slots[slot.index] && (slot.kind === 'backdrop' || (slot.rotation === 0 && slot.x <= 0.5 && slot.y <= 0.5 && slot.w >= W - 1 && slot.h >= H - 1)),
    ),
  )
}
