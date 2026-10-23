import { sampleRuns } from '../model/profile'
import type { ProfileChartStyle } from '../types'

export interface ChartArea {
  left: number
  top: number
  width: number
  height: number
}

export interface ChartInput {
  ctx: CanvasRenderingContext2D
  values: Float32Array
  area: ChartArea
  // Value at the bottom and at the top of the area.
  low: number
  high: number
  // One colour, or one per sample.
  color: string | string[]
  // Opacity at the top of the fill.
  fillOpacity: number
  // Per sample: part of a highlighted climb.
  highlighted: (index: number) => boolean
  // Draw only the highlighted parts at full strength, the rest muted.
  highlight: boolean
}

export const xAt = (area: ChartArea, count: number, i: number) => area.left + (count <= 1 ? 0 : (area.width * i) / (count - 1))
export const yAt = (area: ChartArea, low: number, high: number, v: number) => area.top + area.height * (1 - (v - low) / (high - low || 1))

// Runs of consecutive drawable samples (a hidden day splits the chart).
const runs = (values: Float32Array, keep: (i: number) => boolean) => sampleRuns(values.length, (i) => Number.isFinite(values[i]) && keep(i))

function tracePath(input: ChartInput, [from, to]: [number, number], closed: boolean, stepped: boolean) {
  const { ctx, values, area, low, high } = input
  ctx.beginPath()
  const x0 = xAt(area, values.length, from)
  if (closed) ctx.moveTo(x0, area.top + area.height)
  for (let i = from; i <= to; i++) {
    const x = xAt(area, values.length, i)
    const y = yAt(area, low, high, values[i])
    if (i === from && !closed) ctx.moveTo(x, y)
    else {
      if (stepped && i > from) ctx.lineTo(x, yAt(area, low, high, values[i - 1]))
      ctx.lineTo(x, y)
    }
  }
  if (closed) {
    ctx.lineTo(xAt(area, values.length, to), area.top + area.height)
    ctx.closePath()
  }
}

// Left to right through the samples' colours.
function linePaint({ ctx, color, area }: ChartInput): string | CanvasGradient {
  if (typeof color === 'string') return color
  const g = ctx.createLinearGradient(area.left, 0, area.left + area.width, 0)
  color.forEach((c, i) => g.addColorStop(color.length <= 1 ? 0 : i / (color.length - 1), c))
  return g
}

// One colour fades towards the bottom; colours by data stay even, at the fill's opacity.
function fillPaint(input: ChartInput): string | CanvasGradient {
  const { ctx, area, color } = input
  if (typeof color !== 'string') return linePaint(input)
  const g = ctx.createLinearGradient(0, area.top, 0, area.top + area.height)
  g.addColorStop(0, color)
  g.addColorStop(1, withAlpha(color, 0.1))
  return g
}

export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6).padEnd(6, '0'), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function stroke(input: ChartInput, run: [number, number], width: number, alpha: number, stepped: boolean) {
  const { ctx } = input
  tracePath(input, run, false, stepped)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = linePaint(input)
  ctx.lineWidth = width
  ctx.stroke()
}

function fill(input: ChartInput, run: [number, number], alpha: number, stepped: boolean) {
  const { ctx } = input
  tracePath(input, run, true, stepped)
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.fillStyle = fillPaint(input)
  ctx.fill()
}

// Filled terrain under a line; climbs filled and stroked stronger.
function paintArea(input: ChartInput, stepped = false) {
  const { ctx, values, fillOpacity, highlight, highlighted } = input
  ctx.lineJoin = stepped ? 'miter' : 'round'
  ctx.lineCap = 'round'
  for (const run of runs(values, () => true)) {
    fill(input, run, highlight ? fillOpacity * 0.65 : fillOpacity, stepped)
    stroke(input, run, 3, highlight ? 0.7 : 1, stepped)
  }
  if (!highlight) return
  for (const run of runs(values, highlighted)) {
    fill(input, run, fillOpacity * 1.55, stepped)
    stroke(input, run, 4, 1, stepped)
  }
}

function paintLine(input: ChartInput) {
  const { ctx, values, highlight, highlighted } = input
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const run of runs(values, () => true)) stroke(input, run, 3, highlight ? 0.5 : 1, false)
  if (!highlight) return
  for (const run of runs(values, highlighted)) stroke(input, run, 5, 1, false)
}

const BAR_SHARE = 0.62

function paintBars(input: ChartInput) {
  const { ctx, values, area, low, high, color, highlight, highlighted } = input
  const step = area.width / values.length
  const barW = Math.max(1, step * BAR_SHARE)
  const bottom = area.top + area.height
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) continue
    const y = yAt(area, low, high, values[i])
    ctx.globalAlpha = !highlight || highlighted(i) ? 1 : 0.4
    ctx.fillStyle = typeof color === 'string' ? color : color[i]
    ctx.fillRect(area.left + i * step + (step - barW) / 2, y, barW, bottom - y)
  }
}

export const CHART_PAINTERS: Record<ProfileChartStyle, (input: ChartInput) => void> = {
  area: (input) => paintArea(input),
  steps: (input) => paintArea(input, true),
  line: paintLine,
  bars: paintBars,
}

// Bars and steps need fewer samples than a line to read well.
export function sampleCount(style: ProfileChartStyle, width: number): number {
  return Math.max(8, Math.round(style === 'bars' || style === 'steps' ? width / 16 : width / 4))
}
