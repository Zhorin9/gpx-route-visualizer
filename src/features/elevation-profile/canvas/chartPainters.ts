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
  color: string
  // Per sample: part of a highlighted climb.
  highlighted: (index: number) => boolean
  // Draw only the highlighted parts at full strength, the rest muted.
  highlight: boolean
}

export const xAt = (area: ChartArea, count: number, i: number) => area.left + (count <= 1 ? 0 : (area.width * i) / (count - 1))
export const yAt = (area: ChartArea, low: number, high: number, v: number) => area.top + area.height * (1 - (v - low) / (high - low || 1))

// Runs of consecutive drawable samples (a hidden day splits the chart).
function runs(values: Float32Array, keep: (i: number) => boolean): [number, number][] {
  const out: [number, number][] = []
  let start = -1
  for (let i = 0; i <= values.length; i++) {
    const ok = i < values.length && Number.isFinite(values[i]) && keep(i)
    if (ok && start < 0) start = i
    if (!ok && start >= 0) {
      out.push([start, i - 1])
      start = -1
    }
  }
  return out
}

function tracePath(input: ChartInput, [from, to]: [number, number], closed: boolean) {
  const { ctx, values, area, low, high } = input
  ctx.beginPath()
  const x0 = xAt(area, values.length, from)
  if (closed) ctx.moveTo(x0, area.top + area.height)
  for (let i = from; i <= to; i++) {
    const x = xAt(area, values.length, i)
    const y = yAt(area, low, high, values[i])
    if (i === from && !closed) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  if (closed) {
    ctx.lineTo(xAt(area, values.length, to), area.top + area.height)
    ctx.closePath()
  }
}

function fadeFill(input: ChartInput, alphaTop: number) {
  const { ctx, area, color } = input
  const g = ctx.createLinearGradient(0, area.top, 0, area.top + area.height)
  g.addColorStop(0, withAlpha(color, alphaTop))
  g.addColorStop(1, withAlpha(color, alphaTop * 0.1))
  return g
}

export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6).padEnd(6, '0'), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// Filled terrain under a line; climbs filled and stroked stronger.
function paintArea(input: ChartInput) {
  const { ctx, values, color, highlight, highlighted } = input
  const all = runs(values, () => true)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const run of all) {
    tracePath(input, run, true)
    ctx.fillStyle = fadeFill(input, highlight ? 0.35 : 0.55)
    ctx.fill()
    tracePath(input, run, false)
    ctx.strokeStyle = withAlpha(color, highlight ? 0.7 : 1)
    ctx.lineWidth = 3
    ctx.stroke()
  }
  if (!highlight) return
  for (const run of runs(values, highlighted)) {
    tracePath(input, run, true)
    ctx.fillStyle = fadeFill(input, 0.85)
    ctx.fill()
    tracePath(input, run, false)
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.stroke()
  }
}

function paintLine(input: ChartInput) {
  const { ctx, values, color, highlight, highlighted } = input
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const run of runs(values, () => true)) {
    tracePath(input, run, false)
    ctx.strokeStyle = withAlpha(color, highlight ? 0.5 : 1)
    ctx.lineWidth = 3
    ctx.stroke()
  }
  if (!highlight) return
  for (const run of runs(values, highlighted)) {
    tracePath(input, run, false)
    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.stroke()
  }
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
    ctx.fillStyle = withAlpha(color, !highlight || highlighted(i) ? 1 : 0.4)
    ctx.fillRect(area.left + i * step + (step - barW) / 2, y, barW, bottom - y)
  }
}

export const CHART_PAINTERS: Record<ProfileChartStyle, (input: ChartInput) => void> = {
  area: paintArea,
  line: paintLine,
  bars: paintBars,
}

// Bars need fewer samples than a line to read well.
export function sampleCount(style: ProfileChartStyle, width: number): number {
  return Math.max(8, Math.round(style === 'bars' ? width / 16 : width / 4))
}
