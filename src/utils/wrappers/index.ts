import { isPanorama } from '../layouts'
import { rad, type ContentBox } from './box'
import type { WrapperDef, WrapperScene } from './paint'
import { album } from './album'
import { postcard } from './postcard'
import { drawPostmark, postmark } from './postmark'
import { stamp } from './stamp'
import { ticket } from './ticket'
import type { CarouselKind, Slide, Wrapper, WrapperField, WrapperId } from '../../types'

export { fromBox, intoBox } from './box'
export { routeFields } from './routeFields'

export const FIELD_LABELS: Record<WrapperField, string> = {
  title: 'Tytuł',
  place: 'Miejsce',
  from: 'Start',
  to: 'Meta',
  date: 'Data (z GPX)',
  note: 'Notatka',
}

const WRAPPERS: Record<Exclude<WrapperId, 'none'>, WrapperDef> = { postcard, stamp, postmark, ticket, album }

export const WRAPPER_OPTIONS: { id: WrapperId; label: string }[] = [{ id: 'none', label: 'Brak' }, ...Object.entries(WRAPPERS).map(([id, def]) => ({ id: id as WrapperId, label: def.label }))]

export const wrapperFieldsOf = (id: WrapperId): WrapperField[] => (id === 'none' ? [] : WRAPPERS[id].fields)

export function contentBox(id: WrapperId, w: number, h: number, fields: Wrapper['fields']): ContentBox {
  if (id === 'none') return { x: 0, y: 0, w, h, rotation: 0 }
  const def = WRAPPERS[id]
  const u = Math.min(w, h)
  const room = def.room(w >= h, fields)
  const aw = w - (room.l + room.r) * u
  const ah = h - (room.t + room.b) * u
  const rotation = def.rotation ?? 0
  const cos = Math.cos(rad(rotation))
  const sin = Math.abs(Math.sin(rad(rotation)))
  // A turned box needs more room; it shrinks until its corners stay on the page.
  const s = Math.min(aw / (w * cos + h * sin), ah / (w * sin + h * cos))
  return { x: room.l * u + (aw - w * s) / 2, y: room.t * u + (ah - h * s) / 2, w: w * s, h: h * s, rotation }
}

// null: full-bleed (no wrapper, a postmark over the content, an excepted slide, a panorama).
export function slideBox(s: { wrapper: Wrapper; slides: Slide[]; carouselKind: CarouselKind }, index: number, w: number, h: number): ContentBox | null {
  const { id, fields } = s.wrapper
  if (id === 'none' || id === 'postmark' || s.slides[index]?.wrapperOff || isPanorama(s.slides, s.carouselKind)) return null
  return contentBox(id, w, h, fields)
}

export function hasPostmark(s: { wrapper: Wrapper; slides: Slide[] }, index: number): boolean {
  return s.wrapper.id === 'postmark' && !s.slides[index]?.wrapperOff && (index === 0 || s.wrapper.postmark.all)
}

export function drawWrapper(ctx: CanvasRenderingContext2D, scene: WrapperScene, box: ContentBox | null, postmarkOn: boolean) {
  const { id } = scene.wrapper
  ctx.save()
  if (box && id !== 'none' && id !== 'postmark') WRAPPERS[id].draw(ctx, box, scene)
  if (postmarkOn) drawPostmark(ctx, scene)
  ctx.restore()
}
