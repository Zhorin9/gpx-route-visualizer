import { FORMATS } from '../../core/formats/registry'
import { easeInOut } from '../animation/model/timeline'
import type { AspectKey } from '../../types'
import { clamp01 } from '../../utils/math'

export type InsetCorner = 'tl' | 'tr' | 'bl' | 'br'

// The design as a small card over someone's footage: the rest of the frame is see-through.
export interface CardInset {
  // The footage's frame the file is made for.
  frame: AspectKey
  corner: InsetCorner
  // The card's longer side, as a share of the frame's shorter side.
  size: number
}

export const DEFAULT_INSET: CardInset = { frame: '16:9', corner: 'br', size: 0.6 }

const MARGIN = 0.05
const TILT_DEG = -3
// Seconds the card takes to slide in at the start and out at the end.
const SLIDE_S = 0.6

export interface CardRect {
  x: number
  y: number
  w: number
  h: number
}

// Where the card rests, in pixels of the footage's frame; it never outgrows the frame.
export function cardRect(inset: CardInset, card: AspectKey): CardRect {
  const frame = FORMATS[inset.frame]
  const { w: cw, h: ch } = FORMATS[card]
  const short = Math.min(frame.w, frame.h)
  const margin = MARGIN * short
  const k = Math.min((inset.size * short) / Math.max(cw, ch), (frame.w - margin * 2) / cw, (frame.h - margin * 2) / ch)
  const w = cw * k
  const h = ch * k
  const right = inset.corner === 'tr' || inset.corner === 'br'
  const bottom = inset.corner === 'bl' || inset.corner === 'br'
  return { x: right ? frame.w - margin - w : margin, y: bottom ? frame.h - margin - h : margin, w, h }
}

// 0 off screen, 1 at rest: in over the first moments, out over the last.
export function cardPresence(t: number, duration: number): number {
  const slide = Math.min(SLIDE_S, duration / 3)
  return easeInOut(clamp01(Math.min(t, duration - t) / slide))
}

// Lays the card on a cleared frame of the output size; it slides in from its own side.
export function drawCardInset(out: HTMLCanvasElement, card: HTMLCanvasElement, inset: CardInset, cardAspect: AspectKey, t: number, duration: number) {
  const ctx = out.getContext('2d')
  if (!ctx) return
  const scale = out.width / FORMATS[inset.frame].w
  const r = cardRect(inset, cardAspect)
  const p = cardPresence(t, duration)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, out.width, out.height)
  if (p <= 0) return
  const right = inset.corner === 'tr' || inset.corner === 'br'
  const away = right ? FORMATS[inset.frame].w - r.x : -(r.x + r.w)
  ctx.scale(scale, scale)
  ctx.translate(r.x + r.w / 2 + away * (1 - p), r.y + r.h / 2)
  ctx.rotate((TILT_DEG * Math.PI) / 180)
  ctx.globalAlpha = p
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = r.w * 0.04
  ctx.shadowOffsetY = r.w * 0.012
  ctx.drawImage(card, -r.w / 2, -r.h / 2, r.w, r.h)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.shadowColor = 'transparent'
}
