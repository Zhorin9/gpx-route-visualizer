import { canvasFont } from '../fonts'
import { newCanvas } from '../image'
import { seededRandom } from '../math'
import { rad } from './box'
import { colors, dateLines, type WrapperDef, type WrapperScene } from './paint'
import type { Wrapper } from '../../types'

const TILT = -11

export const postmark: WrapperDef = {
  label: 'Stempel',
  fields: ['place', 'title', 'date'],
  room: () => ({ l: 0, t: 0, r: 0, b: 0 }),
  draw: () => {},
}

export function postmarkText(fields: Wrapper['fields']): string {
  const cut = (s: string) => (s.length > 24 ? `${s.slice(0, 23).trimEnd()}…` : s)
  return [fields.place, fields.title].filter(Boolean).map((s) => cut(s.toUpperCase())).join(' · ')
}

export function drawPostmark(ctx: CanvasRenderingContext2D, scene: WrapperScene) {
  const { w, h, look, wrapper } = scene
  const c = colors(look)
  const u = Math.min(w, h)
  const r = 0.14 * u
  // Drawn apart at the canvas's own resolution, worn there, then laid over the slide.
  const k = Math.abs(ctx.getTransform().a) || 1
  const bw = r * 4.4
  const bh = r * 4.4
  const { canvas: off, ctx: o } = newCanvas(Math.ceil(bw * k), Math.ceil(bh * k))
  if (!o) return
  o.scale(k, k)
  o.translate(r * 1.4, bh / 2)
  o.rotate(rad(TILT))
  o.strokeStyle = c.ink
  o.fillStyle = c.ink
  o.lineWidth = r * 0.045
  o.beginPath()
  o.arc(0, 0, r, 0, Math.PI * 2)
  o.stroke()
  o.lineWidth = r * 0.028
  o.beginPath()
  o.arc(0, 0, r * 0.6, 0, Math.PI * 2)
  o.stroke()

  // The names round the ring, repeated while they fit, then spread over the whole circle.
  const text = postmarkText(wrapper.fields)
  if (text) {
    let ring = `${text} · `
    let size = r * 0.17
    o.font = canvasFont(look.font, size)
    const room = Math.PI * 2 * r * 0.8 * 0.94
    while (o.measureText(ring + text).width <= room * 0.9) ring += `${text} · `
    if (o.measureText(ring).width > room) {
      size *= room / o.measureText(ring).width
      o.font = canvasFont(look.font, size)
    }
    const widths = [...ring].map((ch) => o.measureText(ch).width)
    const spread = (Math.PI * 2) / widths.reduce((a, x) => a + x, 0)
    let angle = -Math.PI / 2
    o.textAlign = 'center'
    o.textBaseline = 'middle'
    ;[...ring].forEach((ch, i) => {
      const a = angle + (widths[i] * spread) / 2
      o.save()
      o.rotate(a)
      o.translate(r * 0.8, 0)
      o.rotate(Math.PI / 2)
      o.fillText(ch, 0, 0)
      o.restore()
      angle += widths[i] * spread
    })
  }
  const lines = dateLines(wrapper.fields.date)
  const ds = r * 0.2
  o.font = canvasFont(look.font, ds)
  o.textAlign = 'center'
  o.textBaseline = 'middle'
  lines.forEach((line, i) => o.fillText(line, 0, (i - (lines.length - 1) / 2) * ds * 1.15, r * 1.05))

  // Three wavy cancellation lines to the right of the ring.
  o.lineWidth = r * 0.045
  o.beginPath()
  for (const y of [-0.36, 0, 0.36]) {
    o.moveTo(r * 1.15, y * r)
    for (let x = r * 1.15; x < r * 2.9; x += r * 0.5) {
      o.quadraticCurveTo(x + r * 0.125, y * r - r * 0.12, x + r * 0.25, y * r)
      o.quadraticCurveTo(x + r * 0.375, y * r + r * 0.12, x + r * 0.5, y * r)
    }
  }
  o.stroke()

  o.setTransform(1, 0, 0, 1, 0, 0)
  o.globalCompositeOperation = 'destination-out'
  // Same speckles every time, so the preview and the file wear alike.
  const random = seededRandom(11)
  for (let i = 0; i < 320; i++) {
    o.globalAlpha = 0.35 + random() * 0.6
    o.beginPath()
    o.arc(random() * off.width, random() * off.height, (0.006 + random() * 0.03) * r * k, 0, Math.PI * 2)
    o.fill()
  }

  ctx.save()
  ctx.globalAlpha = 0.72
  ctx.drawImage(off, wrapper.postmark.x * w - r * 1.4, wrapper.postmark.y * h - bh / 2, bw, bh)
  ctx.restore()
}
