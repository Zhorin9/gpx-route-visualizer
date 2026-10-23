import { Circle, Line, Shape, Text } from 'react-konva'
import type Konva from 'konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { distanceToKm, formatDistance, formatGain, formatHeight, heightIn, heightUnit } from '../../../core/units'
import { useAppStore } from '../../../store/useAppStore'
import { FORMATS, bottomInset } from '../../../core/formats/registry'
import { formatNumber } from '../../../utils/format'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import { distanceFraction, sampleRuns } from '../model/profile'
import { PROFILE_KIND, profileHeight, type ProfileSettings } from '../types'
import { sampledSource, useProfileColors, useProfileData, useProfileMarkerPos } from '../useProfile'
import { CHART_PAINTERS, sampleCount, xAt, yAt, type ChartArea } from './chartPainters'
import type { AspectKey } from '../../../types'

const SHADOW = { shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.5 }
// The chart never stretches a near-flat ride into mountains.
const MIN_SPAN_M = 60
const MAX_CLIMB_LABELS = 3
const STEEP = { fill: 'rgba(229, 115, 122, 0.22)', edge: 'rgba(229, 115, 122, 0.8)' }
const TICK_EVERY = 10

function framePosition(settings: ProfileSettings, aspectKey: AspectKey, width: number, height: number) {
  const { w, h } = FORMATS[aspectKey]
  if (settings.layout === 'overlay') return { x: 0, y: h - height }
  const bottom = bottomInset(aspectKey)
  return { x: (w - width) / 2, y: h - bottom - height }
}

// 1, 2 or 5 times a power of ten, about `rough`.
function niceStep(rough: number) {
  const pow = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10
}

export default function ElevationProfileNode() {
  const settings = useAppStore((s) => s.profile)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const units = useAppStore((s) => s.statsContent.units)
  useAppStore((s) => s.fontsVersion)

  const overlay = settings.layout === 'overlay'
  const width = overlay ? FORMATS[aspectKey].w : Math.round((FORMATS[aspectKey].w * settings.widthPct) / 100)
  const height = profileHeight(settings)
  const data = useProfileData(sampleCount(settings.style, width))
  const colors = useProfileColors(data)
  const markerPos = useProfileMarkerPos()
  if (!data) return null

  const fontStyle = konvaFontStyle(fontFamily)
  const labelSize = Math.max(16, Math.min(28, Math.round(height * 0.1)))
  const topPad = settings.showTotal || settings.climbLabels || settings.showMinMax || settings.peak ? labelSize * 1.7 : 6
  const bottomPad = overlay ? 0 : settings.showDistance ? labelSize * 1.6 : 4
  const area: ChartArea = { left: 0, top: topPad, width, height: Math.max(10, height - topPad - bottomPad) }

  const { samples, climbs, cumKm, range } = data
  const { values } = samples
  const span = Math.max(MIN_SPAN_M, samples.max - samples.min)
  const fromZero = settings.scale === 'zero'
  const baseLow = fromZero ? Math.min(0, samples.min) : samples.min - span * 0.08
  const high = fromZero ? Math.max(samples.max * 1.1, baseLow + MIN_SPAN_M) : baseLow + span * 1.1
  // Stretching keeps the summits in place and lifts the floor.
  const low = high - (high - baseLow) / settings.exaggeration
  const count = values.length
  const colorAt = (i: number) => (typeof colors === 'string' ? colors : colors[i])
  const fraction = (pos: number) => distanceFraction(cumKm, range.start, range.end, pos)
  const climbCols = climbs.map((c) => [Math.round(fraction(c.startIdx) * (count - 1)), Math.round(fraction(c.endIdx) * (count - 1))])
  const highlighted = (i: number) => climbCols.some(([a, b]) => i >= a && i <= b)
  const totalKm = cumKm[range.end] - cumKm[range.start]
  const colAtKm = (km: number) => (km / totalKm) * (count - 1)

  const grade = settings.steep ? sampledSource(data, 'grade') : null
  const steepRuns = grade ? sampleRuns(count, (i) => grade[i] >= settings.steepGrade) : []

  function sceneFunc(context: Konva.Context) {
    const ctx = context._context
    ctx.save()
    ctx.beginPath()
    ctx.rect(area.left - 4, area.top - 4, area.width + 8, area.height + 4)
    ctx.clip()
    for (const [a, b] of steepRuns) {
      const x0 = xAt(area, count, a - 0.5)
      const x1 = xAt(area, count, b + 0.5)
      ctx.fillStyle = STEEP.fill
      ctx.fillRect(x0, area.top, x1 - x0, area.height)
      ctx.strokeStyle = STEEP.edge
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect(x0, area.top, x1 - x0, area.height)
      ctx.setLineDash([])
    }
    CHART_PAINTERS[settings.style]({ ctx, values, area, low, high, color: colors, fillOpacity: settings.fillOpacity, highlighted, highlight: settings.highlightClimbs && climbs.length > 0 })
    ctx.restore()
  }

  const text = (key: string, value: string, x: number, y: number, size = labelSize, opacity = 1) => (
    <Text key={key} text={value} x={x} y={y} fontSize={size} fontFamily={fontFamily} fontStyle={fontStyle} fill={textColor} opacity={opacity} listening={false} perfectDrawEnabled={false} {...SHADOW} />
  )
  const measure = (value: string, size = labelSize) => measureTextWidth(value, fontFamily, size, fontStyle)
  const dot = (key: string, i: number, radius: number) => (
    <Circle key={key} x={xAt(area, count, i)} y={Math.min(area.top + area.height, yAt(area, low, high, values[i]))} radius={radius} fill={colorAt(i)} stroke={textColor} strokeWidth={3} listening={false} {...SHADOW} />
  )

  const labels: React.ReactNode[] = []
  const marks: React.ReactNode[] = []
  const taken: [number, number][] = []
  // Over a point of the chart, kept inside the chart and clear of other labels.
  const labelAt = (key: string, value: string, col: number, size: number) => {
    const w = measure(value, size)
    const x = Math.max(0, Math.min(width - w, xAt(area, count, col) - w / 2))
    if (taken.some(([a, b]) => x < b && x + w > a)) return
    taken.push([x - 8, x + w + 8])
    const y = Math.max(0, Math.min(yAt(area, low, high, values[col]) - size - 10, area.top - size * 0.9))
    labels.push(text(key, value, x, y, size))
  }

  if (settings.grid) {
    const factor = heightIn(1, units)
    const step = niceStep(((high - low) * factor) / 3)
    for (let v = Math.ceil((low * factor) / step) * step; v < high * factor; v += step) {
      const y = yAt(area, low, high, v / factor)
      marks.push(<Line key={`g${v}`} points={[0, y, width, y]} stroke={textColor} strokeWidth={1} opacity={0.25} listening={false} />)
      labels.push(text(`gl${v}`, `${formatNumber(v || 0)} ${heightUnit(units)}`, 4, y - labelSize * 0.7 - 2, labelSize * 0.7, 0.7))
    }
  }
  if (settings.kmTicks) {
    const step = distanceToKm(TICK_EVERY, units)
    const bottom = area.top + area.height
    for (let km = step; km < totalKm - step * 0.3; km += step) {
      const x = xAt(area, count, colAtKm(km))
      marks.push(<Line key={`t${km}`} points={[x, bottom, x, bottom - 10]} stroke={textColor} strokeWidth={2} opacity={0.7} listening={false} />)
    }
  }
  if (settings.showTotal) {
    const total = `↑ ${formatGain(data.gainM, units)}`
    labels.push(text('total', total, 0, 0))
    taken.push([0, measure(total) + 12])
  }
  if (settings.showMinMax) {
    const max = `max ${formatHeight(samples.max, units)}`
    const min = `min ${formatHeight(samples.min, units)}`
    labels.push(text('max', max, width - measure(max), 0, labelSize, 0.85))
    taken.push([width - measure(max) - 12, width])
    labels.push(text('min', min, width - measure(min, labelSize * 0.8), area.top + area.height - labelSize * 0.8 - 4, labelSize * 0.8, 0.75))
  }
  const finite = values.findIndex(Number.isFinite)
  if (settings.peak && finite >= 0) {
    const peak = values.reduce((best, v, i) => (v > values[best] ? i : best), finite)
    labelAt('peak', formatHeight(values[peak], units), peak, labelSize * 0.85)
    marks.push(dot('peakDot', peak, 6))
  }
  if (settings.startFinish && finite >= 0) {
    const last = count - 1 - [...values].reverse().findIndex(Number.isFinite)
    marks.push(dot('start', finite, 5), dot('finish', last, 5))
  }
  if (settings.climbLabels && settings.highlightClimbs) {
    // The biggest climbs get a label over their summit, as long as labels don't collide.
    climbs
      .map((c, i) => ({ c, col: climbCols[i][1] }))
      .sort((a, b) => b.c.gainM - a.c.gainM)
      .slice(0, MAX_CLIMB_LABELS)
      .forEach(({ c, col }) => labelAt(`climb${c.startIdx}`, formatGain(c.gainM, units, 5), col, labelSize * 0.85))
  }
  if (settings.showDistance && !overlay) {
    const size = labelSize * 0.85
    const y = height - labelSize
    const end = formatDistance(totalKm, units, 1)
    labels.push(text('d0', formatDistance(0, units, 0), 0, y, size, 0.8))
    labels.push(text('d1', end, width - measure(end, size), y, size, 0.8))
    if (settings.grid) {
      const mid = formatNumber(totalKm / 2 >= 10 ? Math.round(totalKm / 2) : totalKm / 2, totalKm / 2 >= 10 ? 0 : 1)
      labels.push(text('dm', mid, width / 2 - measure(mid, size) / 2, y, size, 0.8))
    }
  }

  let marker: React.ReactNode = null
  if (markerPos != null) {
    const col = fraction(markerPos) * (count - 1)
    const i = Math.max(0, Math.min(count - 1, Math.round(col)))
    const x = xAt(area, count, col)
    marker = (
      <>
        <Line points={[x, area.top, x, area.top + area.height]} stroke={textColor} strokeWidth={2} dash={[6, 5]} opacity={0.8} listening={false} />
        {Number.isFinite(values[i]) && <Circle x={x} y={yAt(area, low, high, values[i])} radius={7} fill={colorAt(i)} stroke={textColor} strokeWidth={3} listening={false} {...SHADOW} />}
      </>
    )
  }

  const pos = framePosition(settings, aspectKey, width, height)
  return (
    <DraggableElement kind={PROFILE_KIND} width={width} height={height} defaultX={pos.x} defaultY={pos.y}>
      <Shape sceneFunc={sceneFunc} listening={false} perfectDrawEnabled={false} />
      {marks}
      {labels}
      {marker}
    </DraggableElement>
  )
}
