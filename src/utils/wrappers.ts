import { contrastRatio, mixHex, toneOf } from './color'
import { wrapText } from './drawSlide'
import { fontWeight } from './fonts'
import { noiseTile } from './image'
import { isPanorama } from './layouts'
import type { CarouselKind, GpxPoint, RoutePart, Slide, SlideLook, Waypoint, Wrapper, WrapperField, WrapperId } from '../types'

// Where a slide's content is drawn: the whole slide shrunk to w × h (its own proportions, so nothing
// is cut off) at x, y, turned by `rotation` degrees about its centre. Frame pixels of the slide.
export interface ContentBox {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface WrapperScene {
  w: number
  h: number
  wrapper: Wrapper
  look: SlideLook
  // The route's length as the ticket prints it; null without a route.
  distance: string | null
}

// Room round the content, in fractions of the slide's shorter side.
interface Room {
  l: number
  t: number
  r: number
  b: number
}

interface WrapperDef {
  label: string
  // What the wrapper prints, in the order Teksty lists them.
  fields: WrapperField[]
  // side: a square or landscape slide, whose band goes beside the content rather than under it.
  room: (side: boolean, fields: Wrapper['fields']) => Room
  rotation?: number
  draw: (ctx: CanvasRenderingContext2D, box: ContentBox, scene: WrapperScene) => void
}

export const FIELD_LABELS: Record<WrapperField, string> = {
  title: 'Tytuł',
  place: 'Miejsce',
  from: 'Start',
  to: 'Meta',
  date: 'Data (z GPX)',
  note: 'Notatka',
}

const rad = (deg: number) => (deg * Math.PI) / 180

const font = (family: string, size: number, { bold = false, italic = false } = {}) => `${italic ? 'italic ' : ''}${fontWeight(family, bold)} ${Math.round(size)}px "${family}"`

// Sets the font at `size`, or smaller down to about half to fit `maxW`; past that the text is cut with an ellipsis.
function fitText(ctx: CanvasRenderingContext2D, value: string, maxW: number, family: string, size: number, style: { bold?: boolean; italic?: boolean } = {}): string {
  let s = size
  ctx.font = font(family, s, style)
  while (s > size * 0.55 && ctx.measureText(value).width > maxW) {
    s *= 0.92
    ctx.font = font(family, s, style)
  }
  if (ctx.measureText(value).width <= maxW) return value
  let cut = value
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

function put(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left', baseline: CanvasTextBaseline = 'alphabetic') {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(value, x, y)
}

// The theme's colours; an accent that wouldn't read on the paper (a white route) gives way to the ink.
function colors(look: SlideLook) {
  const accent = contrastRatio(look.accent, look.paper) >= 3 ? look.accent : look.ink
  return { paper: look.paper, ink: look.ink, accent, dark: toneOf(look.paper) === 'dark' }
}

// "12–15.08.2026" → ["12–15.08", "2026"], as a stamp sets it on two lines.
export function dateLines(date: string): string[] {
  const m = date.match(/^(.*)\.(\d{4})$/)
  return m ? [m[1], m[2]] : date ? [date] : []
}

// Centres of the holes along one edge: a whole number of steps, so no corner gets half a hole.
export function perforation(length: number, step: number): number[] {
  const n = Math.max(1, Math.round(length / step))
  return Array.from({ length: n }, (_, k) => ((k + 0.5) * length) / n)
}

function boxPath(ctx: CanvasRenderingContext2D, b: ContentBox) {
  ctx.save()
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.rotate(rad(b.rotation))
  ctx.rect(-b.w / 2, -b.h / 2, b.w, b.h)
  ctx.restore()
}

// Whatever `draw` paints stays off the content.
function outside(ctx: CanvasRenderingContext2D, scene: WrapperScene, b: ContentBox, draw: () => void) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, scene.w, scene.h)
  boxPath(ctx, b)
  ctx.clip('evenodd')
  draw()
  ctx.restore()
}

function shadow(ctx: CanvasRenderingContext2D, u: number) {
  ctx.shadowColor = 'rgba(45,43,43,0.22)'
  ctx.shadowBlur = u * 0.012
  ctx.shadowOffsetY = u * 0.003
}

function noShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

// The date in a frame of the accent, like the stamp on a postcard's back.
function stampField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, scene: WrapperScene, accent: string) {
  const u = Math.min(scene.w, scene.h)
  ctx.strokeStyle = accent
  ctx.lineWidth = Math.max(1.5, u * 0.0022)
  ctx.strokeRect(x, y, w, h)
  const lines = dateLines(scene.wrapper.fields.date)
  const size = Math.min(h * 0.2, w * 0.24)
  lines.forEach((line, i) => {
    ctx.font = font(scene.look.font, size)
    put(ctx, fitText(ctx, line, w * 0.86, scene.look.font, size), x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.3, accent, 'center', 'middle')
  })
}

// ---------- C1 Pocztówka ----------

const POSTCARD_BAND = 0.22
const POSTCARD_SIDE = 0.27

function drawPostcard(ctx: CanvasRenderingContext2D, b: ContentBox, scene: WrapperScene) {
  const { w, h, look } = scene
  const { place, note } = scene.wrapper.fields
  const c = colors(look)
  const u = Math.min(w, h)
  const gap = 0.04 * u
  const rule = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = c.ink
    ctx.lineWidth = Math.max(1, u * 0.0016)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  outside(ctx, scene, b, () => {
    ctx.fillStyle = mixHex(c.paper, '#f2cf96', c.dark ? 0.06 : 0.16)
    ctx.fillRect(0, 0, w, h)

    if (w >= h) {
      // Beside the content: the stamp on top, a rule, then the place and the note.
      const band = { x: b.x + b.w + gap, y: b.y, w: POSTCARD_SIDE * u }
      const sh = band.w * 0.86
      stampField(ctx, band.x, band.y, band.w, sh, scene, c.accent)
      rule(band.x, band.y + sh + gap * 0.6, band.x + band.w, band.y + sh + gap * 0.6)
      let y = band.y + sh + gap * 1.3
      const size = band.w * 0.2
      ctx.font = font(look.font, size)
      for (const line of wrapText(ctx, place, band.w).slice(0, 3)) {
        put(ctx, fitText(ctx, line, band.w, look.font, size), band.x, y, c.ink, 'left', 'top')
        y += size * 1.1
      }
      const small = band.w * 0.12
      ctx.font = font(look.font, small, { italic: true })
      for (const line of wrapText(ctx, note, band.w).slice(0, 4)) {
        put(ctx, line, band.x, y + small * 0.4, c.ink, 'left', 'top')
        y += small * 1.3
      }
      return
    }

    // Under the content: the place and the note, a rule, the stamp at the right.
    const band = { x: b.x, y: b.y + b.h + gap, w: b.w, h: POSTCARD_BAND * u }
    const sw = band.h * 0.74
    const sx = band.x + band.w - sw
    stampField(ctx, sx, band.y, sw, band.h, scene, c.accent)
    rule(sx - gap * 0.7, band.y, sx - gap * 0.7, band.y + band.h)
    const maxW = sx - gap * 1.4 - band.x
    const big = band.h * 0.3
    const small = band.h * 0.15
    const mid = band.y + band.h / 2
    if (place) {
      const value = fitText(ctx, place, maxW, look.font, big)
      put(ctx, value, band.x, note ? mid - small * 0.3 : mid, c.ink, 'left', note ? 'alphabetic' : 'middle')
    }
    if (note) {
      const value = fitText(ctx, note, maxW, look.font, small, { italic: true })
      put(ctx, value, band.x, place ? mid + small * 0.5 : mid, c.ink, 'left', place ? 'top' : 'middle')
    }
  })
}

// ---------- C2 Znaczek ----------

function drawStamp(ctx: CanvasRenderingContext2D, b: ContentBox, scene: WrapperScene) {
  const { w, h, look } = scene
  const { place, date } = scene.wrapper.fields
  const c = colors(look)
  const u = Math.min(w, h)
  const pad = 0.05 * u
  const row = 0.09 * u
  const paper = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 + row }
  const ground = mixHex(c.accent, c.paper, 0.72)
  outside(ctx, scene, b, () => {
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, w, h)
    shadow(ctx, u)
    ctx.fillStyle = c.paper
    ctx.fillRect(paper.x, paper.y, paper.w, paper.h)
    noShadow(ctx)
    // The holes of the perforation, cut in the ground's colour.
    const step = 0.04 * u
    const hole = (x: number, y: number, r: number) => {
      ctx.moveTo(x + r, y)
      ctx.arc(x, y, r, 0, Math.PI * 2)
    }
    const across = perforation(paper.w, step)
    const down = perforation(paper.h, step)
    ctx.fillStyle = ground
    ctx.beginPath()
    for (const x of across) {
      hole(paper.x + x, paper.y, (paper.w / across.length) * 0.3)
      hole(paper.x + x, paper.y + paper.h, (paper.w / across.length) * 0.3)
    }
    for (const y of down) {
      hole(paper.x, paper.y + y, (paper.h / down.length) * 0.3)
      hole(paper.x + paper.w, paper.y + y, (paper.h / down.length) * 0.3)
    }
    ctx.fill()

    const f = 0.012 * u
    ctx.strokeStyle = c.ink
    ctx.lineWidth = Math.max(1, u * 0.0018)
    ctx.strokeRect(b.x - f, b.y - f, b.w + f * 2, b.h + f * 2)

    // The place at the left, the year at the right as the stamp's value.
    const base = paper.y + paper.h - pad * 0.75
    const year = date.match(/\d{4}$/)?.[0] ?? ''
    const yearSize = 0.07 * u
    ctx.font = font(look.font, yearSize)
    const yearW = year ? ctx.measureText(year).width : 0
    if (year) put(ctx, year, paper.x + paper.w - pad, base, c.ink, 'right')
    if (place) {
      ctx.letterSpacing = `${(0.004 * u).toFixed(1)}px`
      const value = fitText(ctx, place.toUpperCase(), paper.w - pad * 3 - yearW, look.font, 0.03 * u)
      put(ctx, value, paper.x + pad, base, c.ink)
      ctx.letterSpacing = '0px'
    }
  })
}

// ---------- C3 Stempel ----------

const POSTMARK_TILT = -11

// The same speckles every time, so the ink looks worn the same way in the preview and the file.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Long names are cut so the text round the ring never runs into itself.
export function postmarkText(fields: Wrapper['fields']): string {
  const cut = (s: string) => (s.length > 24 ? `${s.slice(0, 23).trimEnd()}…` : s)
  return [fields.place, fields.title].filter(Boolean).map((s) => cut(s.toUpperCase())).join(' · ')
}

function drawPostmark(ctx: CanvasRenderingContext2D, scene: WrapperScene) {
  const { w, h, look, wrapper } = scene
  const c = colors(look)
  const u = Math.min(w, h)
  const r = 0.14 * u
  // Drawn apart at the canvas's own resolution, worn there, then laid over the slide.
  const k = Math.abs(ctx.getTransform().a) || 1
  const bw = r * 4.4
  const bh = r * 4.4
  const off = document.createElement('canvas')
  off.width = Math.ceil(bw * k)
  off.height = Math.ceil(bh * k)
  const o = off.getContext('2d')
  if (!o) return
  o.scale(k, k)
  o.translate(r * 1.4, bh / 2)
  o.rotate(rad(POSTMARK_TILT))
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
    o.font = font(look.font, size)
    const room = Math.PI * 2 * r * 0.8 * 0.94
    while (o.measureText(ring + text).width <= room * 0.9) ring += `${text} · `
    if (o.measureText(ring).width > room) {
      size *= room / o.measureText(ring).width
      o.font = font(look.font, size)
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
  o.font = font(look.font, ds)
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
  const random = seeded(11)
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

// ---------- C4 Bilet ----------

const TICKET_STUB = 0.24
const TICKET_SIDE = 0.3

function drawTicket(ctx: CanvasRenderingContext2D, b: ContentBox, scene: WrapperScene) {
  const { w, h, look, distance } = scene
  const { title, from, to, date } = scene.wrapper.fields
  const c = colors(look)
  const u = Math.min(w, h)
  const side = w >= h
  const pad = 0.035 * u
  const stub = (side ? TICKET_SIDE : TICKET_STUB) * u
  const t = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2 + (side ? stub : 0), h: b.h + pad * 2 + (side ? 0 : stub) }
  const ground = mixHex(c.paper, c.ink, c.dark ? 0.22 : 0.1)
  const notch = 0.028 * u
  outside(ctx, scene, b, () => {
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, w, h)
    shadow(ctx, u)
    ctx.fillStyle = c.paper
    ctx.fillRect(t.x, t.y, t.w, t.h)
    noShadow(ctx)

    // The tear line: two half-round notches and a dashed rule between them.
    const cut = side ? b.x + b.w + pad : b.y + b.h + pad
    const ends = side ? [[cut, t.y], [cut, t.y + t.h]] : [[t.x, cut], [t.x + t.w, cut]]
    ctx.fillStyle = ground
    for (const [x, y] of ends) {
      ctx.beginPath()
      ctx.arc(x, y, notch, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.strokeStyle = c.ink
    ctx.lineWidth = Math.max(1.5, u * 0.0025)
    ctx.setLineDash([u * 0.012, u * 0.009])
    ctx.beginPath()
    if (side) {
      ctx.moveTo(cut, t.y + notch * 1.6)
      ctx.lineTo(cut, t.y + t.h - notch * 1.6)
    } else {
      ctx.moveTo(t.x + notch * 1.6, cut)
      ctx.lineTo(t.x + t.w - notch * 1.6, cut)
    }
    ctx.stroke()
    ctx.restore()

    // Start → finish; without places the title takes the line instead.
    const places = [from, to].filter(Boolean)
    const headline = places.length ? places : [title]
    const facts = [date, distance ?? '', places.length ? title : ''].filter(Boolean)

    if (side) {
      // Down the stub: start, an arrow, the finish, then the facts.
      const x = cut + pad
      const width = t.x + t.w - pad - x
      const size = width * 0.19
      const small = width * 0.1
      const lines = [...headline.flatMap((name, i) => (i ? ['↓', name] : [name]))]
      const total = lines.length * size * 1.15 + facts.length * small * 1.5 + small
      let y = t.y + (t.h - total) / 2
      for (const line of lines) {
        const value = fitText(ctx, line, width, look.font, size)
        put(ctx, value, x, y, line === '↓' ? c.accent : c.ink, 'left', 'top')
        y += size * 1.15
      }
      y += small
      for (const fact of facts) {
        const value = fitText(ctx, fact, width, look.font, small)
        ctx.globalAlpha = places.length && fact === title ? 0.6 : 1
        put(ctx, value, x, y, c.ink, 'left', 'top')
        ctx.globalAlpha = 1
        y += small * 1.5
      }
      return
    }

    // Across the stub: start → finish on one line, the facts in a row under it.
    const x = t.x + pad * 1.4
    const width = t.w - pad * 2.8
    const size = stub * 0.22
    const small = stub * 0.11
    const top = cut + (stub - size - small * 1.8) / 2
    const arrow = ' → '
    let s = size
    ctx.font = font(look.font, s)
    const measure = () => headline.reduce((a, name) => a + ctx.measureText(name).width, 0) + (headline.length - 1) * ctx.measureText(arrow).width
    while (s > size * 0.55 && measure() > width) {
      s *= 0.92
      ctx.font = font(look.font, s)
    }
    const each = (width - (headline.length - 1) * ctx.measureText(arrow).width) / headline.length
    let cx = x
    headline.forEach((name, i) => {
      if (i) {
        put(ctx, arrow, cx, top, c.accent, 'left', 'top')
        cx += ctx.measureText(arrow).width
      }
      const value = measure() > width ? fitText(ctx, name, each, look.font, s) : name
      ctx.font = font(look.font, s)
      put(ctx, value, cx, top, c.ink, 'left', 'top')
      cx += ctx.measureText(value).width
    })
    const y = top + s + small * 0.8
    ctx.font = font(look.font, small)
    facts.forEach((fact, i) => {
      const align: CanvasTextAlign = facts.length === 1 ? 'left' : i === 0 ? 'left' : i === facts.length - 1 ? 'right' : 'center'
      const at = align === 'left' ? x : align === 'right' ? x + width : x + width / 2
      ctx.globalAlpha = places.length && fact === title ? 0.6 : 1
      put(ctx, fitText(ctx, fact, width / facts.length - small, look.font, small), at, y, c.ink, align, 'top')
      ctx.globalAlpha = 1
    })
  })
}

// ---------- C5 Strona albumu ----------

const ALBUM_TILT = -1.5
const ALBUM_NOTE = 0.09

function drawAlbum(ctx: CanvasRenderingContext2D, b: ContentBox, scene: WrapperScene) {
  const { w, h, look } = scene
  const { note } = scene.wrapper.fields
  const c = colors(look)
  const u = Math.min(w, h)
  outside(ctx, scene, b, () => {
    ctx.fillStyle = c.paper
    ctx.fillRect(0, 0, w, h)
    // A whisper of grain, so it reads as paper rather than a flat colour.
    const grain = ctx.createPattern(noiseTile(), 'repeat')
    if (grain) {
      ctx.globalAlpha = 0.06
      ctx.fillStyle = grain
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
    }
    // The pasted print's shadow; the print itself is the content.
    shadow(ctx, u)
    ctx.fillStyle = c.paper
    ctx.beginPath()
    boxPath(ctx, b)
    ctx.fill()
    noShadow(ctx)
    if (note) {
      const tilt = Math.abs(Math.sin(rad(b.rotation))) * (b.w / 2)
      const value = fitText(ctx, note, b.w * 0.9, look.font, 0.04 * u, { italic: true })
      put(ctx, value, b.x + b.w / 2, b.y + b.h + tilt + (ALBUM_NOTE * u) / 2, c.ink, 'center', 'middle')
    }
  })

  // Photo corners over the print's corners, turned with it.
  const cs = 0.075 * u
  const o = 0.01 * u
  ctx.save()
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.rotate(rad(b.rotation))
  ctx.globalAlpha = 0.85
  ctx.fillStyle = c.ink
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = (sx * b.w) / 2 + sx * o
    const y = (sy * b.h) / 2 + sy * o
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - sx * cs, y)
    ctx.lineTo(x, y - sy * cs)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

// ---------- Registry ----------

const WRAPPERS: Record<Exclude<WrapperId, 'none'>, WrapperDef> = {
  postcard: {
    label: 'Pocztówka',
    fields: ['place', 'date', 'note'],
    room: (side) => (side ? { l: 0.06, t: 0.06, b: 0.06, r: 0.1 + POSTCARD_SIDE } : { l: 0.06, t: 0.06, r: 0.06, b: 0.1 + POSTCARD_BAND }),
    draw: drawPostcard,
  },
  stamp: {
    label: 'Znaczek',
    fields: ['place', 'date'],
    room: () => ({ l: 0.11, t: 0.11, r: 0.11, b: 0.2 }),
    draw: drawStamp,
  },
  postmark: {
    label: 'Stempel',
    fields: ['place', 'title', 'date'],
    room: () => ({ l: 0, t: 0, r: 0, b: 0 }),
    draw: () => {},
  },
  ticket: {
    label: 'Bilet',
    fields: ['title', 'from', 'to', 'date'],
    room: (side) => (side ? { l: 0.09, t: 0.09, b: 0.09, r: 0.09 + TICKET_SIDE } : { l: 0.09, t: 0.09, r: 0.09, b: 0.09 + TICKET_STUB }),
    draw: drawTicket,
  },
  album: {
    label: 'Album',
    fields: ['note'],
    room: (_, fields) => ({ l: 0.08, t: 0.08, r: 0.08, b: 0.08 + (fields.note ? ALBUM_NOTE : 0) }),
    rotation: ALBUM_TILT,
    draw: drawAlbum,
  },
}

export const WRAPPER_OPTIONS: { id: WrapperId; label: string }[] = [{ id: 'none', label: 'Brak' }, ...Object.entries(WRAPPERS).map(([id, def]) => ({ id: id as WrapperId, label: def.label }))]

export const wrapperFieldsOf = (id: WrapperId): WrapperField[] => (id === 'none' ? [] : WRAPPERS[id].fields)

// The largest box of the slide's own proportions that leaves the wrapper its room, centred in what is left.
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

// The box a slide's content is drawn in, or null where it stays full-bleed: no wrapper, a postmark
// (laid over the content), a slide excepted from it, or a panorama, whose photo runs across slides.
export function slideBox(s: { wrapper: Wrapper; slides: Slide[]; carouselKind: CarouselKind }, index: number, w: number, h: number): ContentBox | null {
  const { id, fields } = s.wrapper
  if (id === 'none' || id === 'postmark' || s.slides[index]?.wrapperOff || isPanorama(s.slides, s.carouselKind)) return null
  return contentBox(id, w, h, fields)
}

// Whether the slide gets the postmark: the first one, or all of them when asked.
export function hasPostmark(s: { wrapper: Wrapper; slides: Slide[] }, index: number): boolean {
  return s.wrapper.id === 'postmark' && !s.slides[index]?.wrapperOff && (index === 0 || s.wrapper.postmark.all)
}

// Turns a point of the slide (frame pixels from its corner) the way the box draws it.
export function intoBox(b: ContentBox, w: number, h: number, x: number, y: number): { x: number; y: number } {
  const s = b.w / w
  const a = rad(b.rotation)
  const dx = (x - w / 2) * s
  const dy = (y - h / 2) * s
  return { x: b.x + b.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: b.y + b.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) }
}

// The opposite: where in the slide's own content a point drawn in the box comes from.
export function fromBox(b: ContentBox, w: number, h: number, x: number, y: number): { x: number; y: number } {
  const s = b.w / w
  const a = -rad(b.rotation)
  const dx = x - b.x - b.w / 2
  const dy = y - b.y - b.h / 2
  return { x: w / 2 + (dx * Math.cos(a) - dy * Math.sin(a)) / s, y: h / 2 + (dx * Math.sin(a) + dy * Math.cos(a)) / s }
}

// One slide's wrapper, into a context already scaled to frame pixels with the slide at the origin.
export function drawWrapper(ctx: CanvasRenderingContext2D, scene: WrapperScene, box: ContentBox | null, postmark: boolean) {
  const { id } = scene.wrapper
  ctx.save()
  if (box && id !== 'none' && id !== 'postmark') WRAPPERS[id].draw(ctx, box, scene)
  if (postmark) drawPostmark(ctx, scene)
  ctx.restore()
}

// ---------- Fields from the route ----------

const pad2 = (n: number) => String(n).padStart(2, '0')

// "12.08.2026", "12–15.08.2026", "28.08–02.09.2026" or two whole dates across a new year.
export function formatDateSpan(start: Date, end: Date): string {
  const d = (x: Date) => pad2(x.getDate())
  const dm = (x: Date) => `${d(x)}.${pad2(x.getMonth() + 1)}`
  const full = (x: Date) => `${dm(x)}.${x.getFullYear()}`
  if (start.getFullYear() !== end.getFullYear()) return `${full(start)}–${full(end)}`
  if (start.getMonth() !== end.getMonth()) return `${dm(start)}–${full(end)}`
  if (start.getDate() !== end.getDate()) return `${d(start)}–${full(end)}`
  return full(start)
}

const UNNAMED_PLACE = 'Miejscowość'

// What the wrapper can print, read from the route: its name, the first and last named places
// (the planner's stops, else the labels along the route) and the dates it was recorded on.
export function routeFields(name: string | null, points: GpxPoint[] | null, parts: RoutePart[], waypoints: Waypoint[]): Wrapper['fields'] {
  const stops = parts.flatMap((p) => p.plan?.stops.filter((s) => !s.via && s.name) ?? [])
  const labels = [...waypoints].sort((a, b) => a.trackPos - b.trackPos).filter((wp) => wp.text.trim() && wp.text !== UNNAMED_PLACE)
  const names = stops.length ? stops.map((s) => s.name) : labels.map((wp) => wp.text.trim())
  const from = names[0] ?? ''
  const to = names.length > 1 ? names[names.length - 1] : ''
  const times = (points ?? []).flatMap((p) => (p.time == null ? [] : [p.time]))
  return {
    title: name ?? '',
    place: to || from,
    from,
    to,
    date: times.length ? formatDateSpan(new Date(times[0]), new Date(times[times.length - 1])) : '',
    note: '',
  }
}
