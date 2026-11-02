import { applyTransform } from '../../../utils/geometry'
import { channels } from '../../../utils/color'
import { memoOne } from '../../../utils/memo'
import type { RouteTransform } from '../../../types'
import type { MapSettings, SketchSettings } from '../types'
import { jitter, rng, type Pt } from './pen'
import type { SketchShape } from './shape'

export interface SketchPalette {
  paper: string
  ink: string
  water: string
}

// A notebook page; the map's palette (the style template's or the photos') takes over when set:
// background → paper, text → ink, water → water.
const NOTEBOOK: SketchPalette = { paper: '#f7f1e3', ink: '#3a2a1c', water: '#5f7f93' }

export function sketchPalette(settings: Pick<MapSettings, 'palette'>): SketchPalette {
  const p = settings.palette
  return p ? { paper: p.land, ink: p.label, water: p.water } : NOTEBOOK
}

// Everything one drawing of the sketch depends on; the same frame always gives the same pixels.
export interface SketchFrame {
  shape: SketchShape | null
  // The route's ends, labelled when there are no places (no data, no network).
  ends: [Pt, Pt] | null
  // The view: the route's transform composed with the camera.
  transform: RouteTransform
  // The ribbon, and a slide's shorter side, in frame pixels.
  width: number
  height: number
  short: number
  palette: SketchPalette
  settings: SketchSettings
  seed: number
}

interface Stroke {
  pts: Pt[]
  width: number
  color: 'ink' | 'water'
  alpha: number
  dashed: boolean
}

// D3: every line as pen strokes, in the route's pixels. Each object's seed is its own
// (seed + layer × 1000 + index), so one changed feature leaves the others as they were.
const inked = memoOne((shape: SketchShape | null, ends: [Pt, Pt] | null, seed: number, roughness: number, short: number) => {
  const amp = short * 0.004 * roughness
  const step = short * 0.006
  const S = (layer: number, i: number) => seed + layer * 1000 + i
  const strokes: Stroke[] = []
  // A main pass cut into ~40 px pieces of uneven width, then a thinner, paler correction.
  const pen = (pts: Pt[], s: number, a: number, width: number, color: Stroke['color'], alpha = 1, dashed = false) => {
    const r = rng(s + 99)
    const main = jitter(pts, s, a, step)
    for (let i = 0; i < main.length - 1; i += 7) strokes.push({ pts: main.slice(i, i + 8), width: width * (0.75 + r() * 0.5), color, alpha, dashed })
    strokes.push({ pts: jitter(pts, s + 7, a * 1.4, step), width: width * 0.45, color, alpha: alpha * 0.5, dashed })
  }
  const circle = ([x, y]: Pt, radius: number): Pt[] => Array.from({ length: 13 }, (_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * radius, y + Math.sin((i / 12) * Math.PI * 2) * radius])
  // Little ripples off the coast, on the sea's side (the right of the line).
  const offshore = (line: Pt[], by: number): Pt[] =>
    line.map(([x, y], i) => {
      const [ax, ay] = line[Math.max(0, i - 1)]
      const [bx, by2] = line[Math.min(line.length - 1, i + 1)]
      const len = Math.hypot(bx - ax, by2 - ay) || 1
      return [x - ((by2 - ay) / len) * by, y + ((bx - ax) / len) * by]
    })

  const labels: { name: string; at: Pt; sea: boolean }[] = []
  const ripples: Stroke[] = []
  const washed: Pt[][] = []
  if (shape) {
    shape.roads.forEach((l, i) => pen(l, S(4, i), amp, short * 0.003, 'ink', 0.55, true))
    shape.rivers.forEach((l, i) => pen(l, S(2, i), amp, short * 0.0035, 'water'))
    shape.shores.forEach((l, i) => {
      pen(l, S(1, i), amp, short * 0.0045, 'ink')
      ;[0.02, 0.04].forEach((o, k) =>
        ripples.push({ pts: jitter(offshore(l, short * o), S(1, 500 + i * 2 + k), amp * 1.5, step), width: short * 0.002, color: 'water', alpha: 0.6 - k * 0.25, dashed: true }),
      )
    })
    shape.water.forEach((ring, i) => washed.push(jitter(ring, S(1, 700 + i), amp * 2.5, step)))
    shape.places.forEach((p, i) => {
      if (p.kind !== 'water') pen(circle(p.at, short * 0.008), S(6, i), amp * 0.3, short * 0.0032, 'ink')
      labels.push({ name: p.name, at: p.at, sea: p.kind === 'water' })
    })
  }
  if (ends && !shape?.places.some((p) => p.kind !== 'water')) {
    ends.forEach((at, i) => {
      pen(circle(at, short * 0.008), S(6, 900 + i), amp * 0.3, short * 0.0032, 'ink')
      labels.push({ name: i ? 'meta' : 'start', at, sea: false })
    })
  }
  return { strokes, ripples, washed, labels }
})

// Paper texture: seeded noise in the ink, `alpha` at most, `cols` × `rows` cells.
const tiles = new Map<string, HTMLCanvasElement>()
function noiseTile(seed: number, color: string, cols: number, rows: number, alpha: number): HTMLCanvasElement {
  const id = [seed, color, cols, rows, alpha].join()
  const known = tiles.get(id)
  if (known) return known
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const [r, g, b] = channels(color)
    const random = rng(seed)
    const data = ctx.createImageData(cols, rows)
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = r
      data.data[i + 1] = g
      data.data[i + 2] = b
      data.data[i + 3] = random() * alpha * 255
    }
    ctx.putImageData(data, 0, 0)
  }
  if (tiles.size > 16) tiles.clear()
  tiles.set(id, canvas)
  return canvas
}

function toView(ctx: CanvasRenderingContext2D, t: RouteTransform, scale: number) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.translate(t.x, t.y)
  ctx.rotate((t.rotation * Math.PI) / 180)
  ctx.scale(t.scaleX, t.scaleY)
}

function trace(ctx: CanvasRenderingContext2D, pts: Pt[], close = false) {
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  if (close) ctx.closePath()
}

// D4: the whole sketch on a canvas `scale` times the frame's pixels.
export function drawSketch(ctx: CanvasRenderingContext2D, f: SketchFrame, scale: number) {
  const { shape, transform: t, width, height, short, palette, settings, seed } = f
  const ink = inked(shape, f.ends, seed, settings.roughness, short)
  const colorOf = (c: Stroke['color']) => (c === 'ink' ? palette.ink : palette.water)
  // Widths are on the page; the view's scale is taken back out of them.
  const k = Math.abs(t.scaleX) || 1

  ctx.save()
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, width, height)
  // Stains: large, soft, a few per cent.
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  for (const [cells, alpha] of [[3, 0.06], [10, 0.035]] as const) {
    ctx.drawImage(noiseTile(seed + cells, palette.ink, Math.ceil((cells * width) / short), Math.ceil((cells * height) / short), alpha), 0, 0, width, height)
  }

  const strokes = (list: Stroke[]) => {
    for (const s of list) {
      ctx.beginPath()
      trace(ctx, s.pts)
      ctx.strokeStyle = colorOf(s.color)
      ctx.globalAlpha = s.alpha
      ctx.lineWidth = s.width / k
      ctx.setLineDash(s.dashed ? [(short * 0.012) / k, (short * 0.01) / k] : [])
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.setLineDash([])
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (shape && shape.water.length) {
    toView(ctx, t, scale)
    if (settings.water === 'hatch') {
      ctx.save()
      ctx.beginPath()
      for (const ring of shape.water) trace(ctx, ring, true)
      ctx.clip('nonzero')
      // Hatching at 45° on the page, whatever the view's turn.
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.beginPath()
      const gap = short * 0.012
      for (let c = -height; c < width; c += gap) {
        ctx.moveTo(c, 0)
        ctx.lineTo(c + height, height)
      }
      ctx.strokeStyle = palette.water
      ctx.globalAlpha = 0.75
      ctx.lineWidth = short * 0.0025
      ctx.stroke()
      ctx.restore()
      toView(ctx, t, scale)
      strokes(ink.ripples)
    } else {
      // A wash: uneven edge, soft, with a darker rim along the shore.
      ctx.save()
      ctx.filter = `blur(${short * 0.0035 * scale}px)`
      ctx.beginPath()
      for (const ring of ink.washed) trace(ctx, ring, true)
      ctx.fillStyle = palette.water
      ctx.globalAlpha = 0.45
      ctx.fill('nonzero')
      ctx.beginPath()
      for (const line of shape.shores) trace(ctx, line)
      ctx.strokeStyle = palette.water
      ctx.globalAlpha = 0.35
      ctx.lineWidth = (short * 0.017) / k
      ctx.stroke()
      ctx.restore()
    }
  }

  toView(ctx, t, scale)
  strokes(ink.strokes)

  // Names upright on the page, beside their dot, turned back in when they would leave the frame.
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  const size = short * 0.036
  ctx.textBaseline = 'alphabetic'
  for (const label of ink.labels) {
    const { x, y } = applyTransform({ x: label.at[0], y: label.at[1] }, t)
    if (label.sea) {
      ctx.save()
      ctx.font = `italic 600 ${size * 1.2}px Caveat, cursive`
      ctx.fillStyle = palette.water
      ctx.translate(x, y)
      ctx.rotate((-8 * Math.PI) / 180)
      ctx.textAlign = 'center'
      ctx.fillText(label.name, 0, 0)
      ctx.restore()
      continue
    }
    ctx.font = `600 ${size}px Caveat, cursive`
    ctx.fillStyle = palette.ink
    const right = x + size * 0.4 + ctx.measureText(label.name).width < width - size * 0.5
    ctx.textAlign = right ? 'left' : 'right'
    ctx.fillText(label.name, x + (right ? 1 : -1) * size * 0.4, y - size * 0.25)
  }

  // Grain over everything, at the canvas's own pixels.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const grain = ctx.createPattern(noiseTile(seed, palette.ink, 256, 256, 0.08), 'repeat')
  if (grain) {
    ctx.fillStyle = grain
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }
  ctx.restore()
}
