import { INK, PAPER, toneOf } from './color'
import { formatDuration, formatNumber } from './format'
import { fontWeight } from './fonts'
import { fitMercator, projectWithFit } from './gpx'
import { percentile } from '../core/data/smoothing'
import { distanceIn, distanceUnit, formatDistance, formatGain, formatHeight, formatSpeed, type Units } from '../core/units'
import { DEFAULT_BACKGROUND, DEFAULT_FIGURES, FIGURE_LABELS, slideKind, type SeriesRoute } from './series'
import type { FigureSize, Photo, Slide, SlideLook, SummaryFigure } from '../types'

// Instagram's own interface covers about this much of the top and bottom of a post.
export const SAFE_BAND = 0.08

// Everything a slide is drawn from. Sizes are frame pixels; the caller scales the context.
export interface SlideScene {
  w: number
  h: number
  look: SlideLook
  route: SeriesRoute | null
  units: Units
  movingMs: number | null
  durationMs: number | null
  gainM: number | null
  // Days the recording spans, by date.
  days: number
  slides: Slide[]
  photos: Map<number, Photo>
}

type Rect = { x: number; y: number; w: number; h: number }

const font = (family: string, size: number, bold = false) => `${fontWeight(family, bold)} ${Math.round(size)}px "${family}"`

// Text and lines are sized off the shorter side, so a landscape frame doesn't get giant type.
const unit = (scene: Pick<SlideScene, 'w' | 'h'>) => Math.min(scene.w, scene.h)

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, f: string, color: string, align: CanvasTextAlign = 'left', baseline: CanvasTextBaseline = 'alphabetic') {
  ctx.font = f
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(value, x, y)
}

export function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of value.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line)
        line = word
      } else line = next
    }
    lines.push(line)
  }
  return lines
}

// Covers the box with the photo, centred.
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, r: Rect) {
  const scale = Math.max(r.w / img.width, r.h / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h)
}

// The photo a slide's background takes: the chosen slide's first photo, else the first in the series.
export function backgroundPhoto(slide: Slide, scene: Pick<SlideScene, 'slides' | 'photos'>): HTMLCanvasElement | null {
  const from = slide.background?.fromSlide
  const owners = from != null && scene.slides[from] ? [scene.slides[from]] : scene.slides
  for (const owner of owners) {
    for (const a of Object.values(owner.slots)) {
      const photo = scene.photos.get(a.photoId)
      if (photo) return photo.image
    }
  }
  return null
}

// Paints the background and gives the ink that reads on it.
function drawBackground(ctx: CanvasRenderingContext2D, slide: Slide, scene: SlideScene): string {
  const { look } = scene
  const bg = slide.background ?? DEFAULT_BACKGROUND
  if (bg.source === 'color') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, scene.w, scene.h)
    return toneOf(bg.color) === 'dark' ? PAPER : INK
  }
  const img = bg.source === 'photo' ? backgroundPhoto(slide, scene) : null
  if (!img) {
    ctx.fillStyle = look.paper
    ctx.fillRect(0, 0, scene.w, scene.h)
    return look.ink
  }
  const blur = (bg.blur / 100) * unit(scene) * 0.04
  ctx.save()
  // Drawn larger, so the blur doesn't fade the edges into transparency. The filter works in
  // canvas pixels, not frame pixels, so it follows the scale the slide is drawn at.
  if (blur > 0) ctx.filter = `blur(${blur * Math.abs(ctx.getTransform().a)}px)`
  drawCover(ctx, img, { x: -blur * 2, y: -blur * 2, w: scene.w + blur * 4, h: scene.h + blur * 4 })
  ctx.restore()
  // Darkened enough that the chart and the text keep their contrast.
  ctx.fillStyle = `rgba(0,0,0,${bg.dim / 100})`
  ctx.fillRect(0, 0, scene.w, scene.h)
  return PAPER
}

function noRoute(ctx: CanvasRenderingContext2D, scene: SlideScene, ink: string) {
  const u = unit(scene)
  text(ctx, 'Brak trasy', scene.w / 2, scene.h / 2, font(scene.look.font, u * 0.06), ink, 'center', 'middle')
  text(ctx, 'Wgraj GPX w zakładce Mapa', scene.w / 2, scene.h / 2 + u * 0.06, font(scene.look.font, u * 0.03), ink, 'center', 'middle')
}

function drawProfile(ctx: CanvasRenderingContext2D, slide: Slide, scene: SlideScene, ink: string, accent: string) {
  const { w, h, look } = scene
  const u = unit(scene)
  const pad = u * 0.08
  const route = scene.route
  if (!route) return noRoute(ctx, scene, ink)
  text(ctx, 'Profil wysokości', pad, h * SAFE_BAND + pad * 0.4, font(look.font, u * 0.06), ink, 'left', 'top')
  if (!route.hasElevation) {
    text(ctx, 'Trasa nie ma wysokości', w / 2, h / 2, font(look.font, u * 0.035), ink, 'center', 'middle')
    return
  }
  const chart = { x: pad, y: h * 0.34, w: w - pad * 2, h: h * 0.4 }
  const lo = percentile(route.ele, 0)
  const hi = percentile(route.ele, 100)
  const span = hi - lo || 1
  const end = route.points.length - 1
  const px = (i: number) => chart.x + (route.cumKm[i] / (route.totalKm || 1)) * chart.w
  const py = (i: number) => chart.y + chart.h - ((route.ele[i] - lo) / span) * chart.h
  const line = (from: number, to: number) => {
    ctx.beginPath()
    ctx.moveTo(px(from), py(from))
    for (let i = from + 1; i <= to; i++) ctx.lineTo(px(i), py(i))
  }
  line(0, end)
  ctx.lineTo(px(end), chart.y + chart.h)
  ctx.lineTo(px(0), chart.y + chart.h)
  ctx.closePath()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = accent
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.lineJoin = 'round'
  line(0, end)
  ctx.strokeStyle = accent
  ctx.lineWidth = u * 0.005
  ctx.stroke()

  const climb = route.hardestClimb
  if (climb && slide.climb !== false) {
    line(climb.startIdx, climb.endIdx)
    ctx.strokeStyle = ink
    ctx.lineWidth = u * 0.01
    ctx.stroke()
    const size = u * 0.034
    text(ctx, `Najtrudniejszy podjazd: ${formatNumber(climb.avgGrade, 1)}%`, pad, chart.y - size * 3.2, font(look.font, size, true), ink)
    const from = Math.round(distanceIn(route.cumKm[climb.startIdx], scene.units))
    const to = Math.round(distanceIn(route.cumKm[climb.endIdx], scene.units))
    text(ctx, `${distanceUnit(scene.units)} ${from}–${to} · ${formatDistance(climb.lengthKm, scene.units, 1)} · ${formatGain(climb.gainM, scene.units)}`, pad, chart.y - size * 1.8, font(look.font, size * 0.85), ink)
  }
  const small = font(look.font, u * 0.026)
  text(ctx, formatHeight(hi, scene.units), chart.x, chart.y - u * 0.01, small, ink, 'left', 'bottom')
  text(ctx, formatHeight(lo, scene.units), chart.x, chart.y + chart.h + u * 0.012, small, ink, 'left', 'top')
  text(ctx, formatDistance(route.totalKm, scene.units, 0), chart.x + chart.w, chart.y + chart.h + u * 0.012, small, ink, 'right', 'top')
}

function figureValue(figure: SummaryFigure, scene: SlideScene): string {
  const route = scene.route!
  const { units } = scene
  switch (figure) {
    case 'distance':
      return formatDistance(route.totalKm, units, 0)
    case 'moving':
      return scene.movingMs ? formatDuration(scene.movingMs) : '—'
    case 'duration':
      return scene.durationMs ? formatDuration(scene.durationMs) : '—'
    case 'gain':
      return scene.gainM != null && route.hasElevation ? formatGain(scene.gainM, units) : '—'
    case 'avgSpeed':
      return scene.movingMs ? formatSpeed(route.totalKm / (scene.movingMs / 3_600_000), units) : '—'
    case 'highest':
      return route.hasElevation ? formatHeight(percentile(route.ele, 100), units) : '—'
    case 'climb':
      return route.hardestClimb ? `${formatNumber(route.hardestClimb.avgGrade, 1)}%` : '—'
    case 'days':
      return String(Math.max(1, scene.days))
  }
}

// Height of a figure's value; the label sits above it, smaller.
const FIGURE_SIZES: Record<FigureSize, number> = { small: 0.065, medium: 0.09, large: 0.12 }

function drawSummary(ctx: CanvasRenderingContext2D, slide: Slide, scene: SlideScene, ink: string) {
  const { w, h, look } = scene
  const u = unit(scene)
  const pad = u * 0.08
  if (!scene.route) return noRoute(ctx, scene, ink)

  // The question sits at the bottom; the figures get what is left above it.
  const question = slide.question?.trim()
  const lh = u * 0.055
  ctx.font = font(look.font, u * 0.042)
  const lines = question ? wrapText(ctx, question, w - pad * 2) : []
  const questionTop = h * (1 - SAFE_BAND) - pad * 0.6 - lines.length * lh
  const top = h * SAFE_BAND + pad
  const bottom = lines.length ? questionTop - u * 0.08 : h * (1 - SAFE_BAND) - pad

  // More than four figures go in two columns; together they shrink until they fit.
  const figures = slide.figures ?? DEFAULT_FIGURES
  const cols = figures.length > 4 ? 2 : 1
  const rows = Math.ceil(figures.length / cols)
  const gap = pad * 0.6
  const colW = (w - pad * 2 - gap * (cols - 1)) / cols
  const wanted = u * FIGURE_SIZES[slide.figureSize ?? 'medium']
  const rowH = (s: number) => s * 2.05
  const size = Math.min(wanted, (bottom - top) / Math.max(1, rows) / rowH(1))
  figures.forEach((figure, i) => {
    const x = pad + (i % cols) * (colW + gap)
    const y = top + Math.floor(i / cols) * rowH(size)
    const value = figureValue(figure, scene)
    ctx.font = font(look.font, size)
    // A long value in a narrow column gets smaller rather than running into the next one.
    const fitted = Math.min(size, (size * colW) / Math.max(1, ctx.measureText(value).width))
    text(ctx, FIGURE_LABELS[figure].toUpperCase(), x, y, font(look.font, Math.max(u * 0.02, size * 0.26)), ink, 'left', 'top')
    text(ctx, value, x, y + size * 0.36, font(look.font, fitted), ink, 'left', 'top')
  })

  if (!lines.length) return
  ctx.fillStyle = ink
  ctx.fillRect(pad, questionTop - u * 0.03, w - pad * 2, Math.max(2, u * 0.002))
  lines.forEach((line, i) => text(ctx, line, pad, questionTop + i * lh, font(look.font, u * 0.042), ink, 'left', 'top'))
}

// A profile or summary slide, whole, into a context already scaled to frame pixels.
export function drawDataSlide(ctx: CanvasRenderingContext2D, slide: Slide, scene: SlideScene) {
  ctx.save()
  const ink = drawBackground(ctx, slide, scene)
  // On a photo or a colour the look's accent may vanish; the ink always reads.
  const accent = (slide.background ?? DEFAULT_BACKGROUND).source === 'style' ? scene.look.accent : ink
  if (slideKind(slide) === 'profile') drawProfile(ctx, slide, scene, ink, accent)
  else drawSummary(ctx, slide, scene, ink)
  ctx.restore()
}

// ---------- Overlays on a photo ----------

// "km 62 · 1 840 m" for a place on the route.
export function markerText(route: SeriesRoute, index: number, units: Units): string {
  const km = Math.round(distanceIn(route.cumKm[index], units))
  return `${distanceUnit(units)} ${formatNumber(km)} · ${formatHeight(route.points[index].ele, units)}`
}

function drawMiniMap(ctx: CanvasRenderingContext2D, scene: SlideScene, box: Rect, index: number) {
  const route = scene.route!
  const u = unit(scene)
  // Light with an outline, so it reads on a dark photo and a light one.
  ctx.fillStyle = 'rgba(243,242,242,0.92)'
  ctx.fillRect(box.x, box.y, box.w, box.h)
  ctx.strokeStyle = '#3a2a1c'
  ctx.lineWidth = Math.max(2, u * 0.002)
  ctx.strokeRect(box.x, box.y, box.w, box.h)
  const xy = projectWithFit(route.points, fitMercator(route.points, box.w, box.h, box.w * 0.12))
  ctx.save()
  ctx.translate(box.x, box.y)
  ctx.beginPath()
  for (let i = 0; i < xy.length; i += 2) (i ? ctx.lineTo : ctx.moveTo).call(ctx, xy[i], xy[i + 1])
  ctx.lineJoin = 'round'
  ctx.lineWidth = u * 0.004
  ctx.strokeStyle = scene.look.accent
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(xy[index * 2], xy[index * 2 + 1], u * 0.011, 0, Math.PI * 2)
  ctx.fillStyle = scene.look.accent
  ctx.fill()
  ctx.lineWidth = u * 0.004
  ctx.strokeStyle = PAPER
  ctx.stroke()
  ctx.restore()
}

// The mini-map and the km and height marker of a photo slide, inside the safe zone.
export function drawOverlays(ctx: CanvasRenderingContext2D, slide: Slide, scene: SlideScene, index: number) {
  const overlays = slide.overlays
  if (!scene.route || !overlays) return
  const { w, h } = scene
  const u = unit(scene)
  const pad = u * 0.05
  let y = h * (1 - SAFE_BAND) - u * 0.03

  if (overlays.marker) {
    const size = u * 0.03
    ctx.font = font(scene.look.font, size)
    const label = markerText(scene.route, index, scene.units)
    const tw = ctx.measureText(label).width
    ctx.fillStyle = 'rgba(32,31,29,0.78)'
    ctx.fillRect(pad, y - size * 1.6, tw + size, size * 1.6)
    text(ctx, label, pad + size / 2, y - size * 0.8, font(scene.look.font, size), PAPER, 'left', 'middle')
    y -= size * 1.6 + size * 0.6
  }

  if (overlays.miniMap === 'corner') {
    const bw = u * 0.26
    drawMiniMap(ctx, scene, { x: w - pad - bw, y: h * SAFE_BAND + pad * 0.4, w: bw, h: bw * 0.76 }, index)
  } else if (overlays.miniMap === 'large') {
    const bw = u * 0.5
    const bh = bw * 0.76
    drawMiniMap(ctx, scene, { x: pad, y: y - bh, w: bw, h: bh }, index)
  }
}
