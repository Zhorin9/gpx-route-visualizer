import { sampleRuns } from '../model/profile'
import type { ProfileSettings } from '../types'
import { sampledSource } from '../useProfile'
import type { ProfileChart } from './chart'
import { CHART_PAINTERS } from './chartPainters'

const STEEP = { fill: 'rgba(229, 115, 122, 0.22)', edge: 'rgba(229, 115, 122, 0.8)' }

function shadeSteepStretches(ctx: CanvasRenderingContext2D, chart: ProfileChart, settings: ProfileSettings) {
  const grade = sampledSource(chart.data, 'grade')
  const { area } = chart
  for (const [a, b] of sampleRuns(chart.count, (i) => grade[i] >= settings.steepGrade)) {
    const x0 = chart.x(a - 0.5)
    const x1 = chart.x(b + 0.5)
    ctx.fillStyle = STEEP.fill
    ctx.fillRect(x0, area.top, x1 - x0, area.height)
    ctx.strokeStyle = STEEP.edge
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 4])
    ctx.strokeRect(x0, area.top, x1 - x0, area.height)
    ctx.setLineDash([])
  }
}

export function paintProfile(ctx: CanvasRenderingContext2D, chart: ProfileChart, settings: ProfileSettings, colors: string | string[]) {
  const { area, climbCols } = chart
  ctx.save()
  ctx.beginPath()
  ctx.rect(area.left - 4, area.top - 4, area.width + 8, area.height + 4)
  ctx.clip()
  if (settings.steep) shadeSteepStretches(ctx, chart, settings)
  CHART_PAINTERS[settings.style]({
    ctx,
    values: chart.values,
    area,
    low: chart.low,
    high: chart.high,
    color: colors,
    fillOpacity: settings.fillOpacity,
    highlighted: (i) => climbCols.some(([a, b]) => i >= a && i <= b),
    highlight: settings.highlightClimbs && climbCols.length > 0,
  })
  ctx.restore()
}
