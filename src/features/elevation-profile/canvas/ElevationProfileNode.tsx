import { Circle, Line, Shape, Text } from 'react-konva'
import type Konva from 'konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { formatDistance, formatGain, formatHeight } from '../../../core/units'
import { useAppStore } from '../../../store/useAppStore'
import { ASPECTS, STORY_SAFE_ZONE, defaultStatsY } from '../../../utils/aspects'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import { distanceFraction } from '../model/profile'
import { PROFILE_KIND, type ProfileSettings } from '../types'
import { useProfileData, useProfileMarkerPos } from '../useProfile'
import { CHART_PAINTERS, sampleCount, xAt, yAt, type ChartArea } from './chartPainters'
import type { AspectKey } from '../../../types'

const SHADOW = { shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.5 }
// The chart never stretches a near-flat ride into mountains.
const MIN_SPAN_M = 60
const MAX_CLIMB_LABELS = 3

function defaultPosition(settings: ProfileSettings, aspectKey: AspectKey, width: number, height: number) {
  const { w, h } = ASPECTS[aspectKey]
  const x = (w - width) / 2
  if (settings.placement === 'top') return { x, y: defaultStatsY(aspectKey) + 190 }
  const bottom = aspectKey === '9:16' ? STORY_SAFE_ZONE.bottom + 20 : 60
  return { x, y: h - bottom - height }
}

export default function ElevationProfileNode() {
  const settings = useAppStore((s) => s.profile)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const units = useAppStore((s) => s.statsContent.units)
  useAppStore((s) => s.fontsVersion)

  const width = Math.round((ASPECTS[aspectKey].w * settings.widthPct) / 100)
  const height = settings.height
  const data = useProfileData(sampleCount(settings.style, width))
  const markerPos = useProfileMarkerPos()
  if (!data) return null

  const color = settings.color ?? routeColor
  const fontStyle = konvaFontStyle(fontFamily)
  const labelSize = Math.max(16, Math.min(28, Math.round(height * 0.1)))
  const topPad = settings.showTotal || settings.climbLabels || settings.showMinMax ? labelSize * 1.7 : 6
  const bottomPad = settings.showDistance ? labelSize * 1.6 : 4
  const area: ChartArea = { left: 0, top: topPad, width, height: Math.max(10, height - topPad - bottomPad) }

  const { samples, climbs, cumKm, range } = data
  const span = Math.max(MIN_SPAN_M, samples.max - samples.min)
  const low = samples.min - span * 0.08
  const high = low + span * 1.1
  const count = samples.values.length
  const fraction = (pos: number) => distanceFraction(cumKm, range.start, range.end, pos)
  const climbCols = climbs.map((c) => [Math.round(fraction(c.startIdx) * (count - 1)), Math.round(fraction(c.endIdx) * (count - 1))])
  const highlighted = (i: number) => climbCols.some(([a, b]) => i >= a && i <= b)

  function sceneFunc(context: Konva.Context) {
    const ctx = context._context
    ctx.save()
    CHART_PAINTERS[settings.style]({ ctx, values: samples.values, area, low, high, color, highlighted, highlight: settings.highlightClimbs && climbs.length > 0 })
    ctx.restore()
  }

  const text = (key: string, value: string, x: number, y: number, size = labelSize, opacity = 1) => (
    <Text key={key} text={value} x={x} y={y} fontSize={size} fontFamily={fontFamily} fontStyle={fontStyle} fill={textColor} opacity={opacity} listening={false} perfectDrawEnabled={false} {...SHADOW} />
  )
  const measure = (value: string, size = labelSize) => measureTextWidth(value, fontFamily, size, fontStyle)

  const labels: React.ReactNode[] = []
  const taken: [number, number][] = []
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
  if (settings.climbLabels && settings.highlightClimbs) {
    // The biggest climbs get a label over their summit, as long as labels don't collide.
    const best = climbs
      .map((c, i) => ({ c, col: climbCols[i][1] }))
      .sort((a, b) => b.c.gainM - a.c.gainM)
      .slice(0, MAX_CLIMB_LABELS)
    for (const { c, col } of best) {
      const label = formatGain(c.gainM, units, 5)
      const w = measure(label, labelSize * 0.85)
      const x = Math.max(0, Math.min(width - w, xAt(area, count, col) - w / 2))
      if (taken.some(([a, b]) => x < b && x + w > a)) continue
      taken.push([x - 8, x + w + 8])
      const y = Math.max(0, Math.min(yAt(area, low, high, samples.values[col]) - labelSize - 6, area.top - labelSize * 0.9))
      labels.push(text(`climb${c.startIdx}`, label, x, y, labelSize * 0.85))
    }
  }
  if (settings.showDistance) {
    const end = formatDistance(cumKm[range.end] - cumKm[range.start], units, 1)
    const y = height - labelSize
    labels.push(text('d0', formatDistance(0, units, 0), 0, y, labelSize * 0.85, 0.8))
    labels.push(text('d1', end, width - measure(end, labelSize * 0.85), y, labelSize * 0.85, 0.8))
  }

  let marker: React.ReactNode = null
  if (markerPos != null) {
    const col = fraction(markerPos) * (count - 1)
    const i = Math.max(0, Math.min(count - 1, Math.round(col)))
    const x = xAt(area, count, col)
    const v = samples.values[i]
    marker = (
      <>
        <Line points={[x, area.top, x, area.top + area.height]} stroke={textColor} strokeWidth={2} dash={[6, 5]} opacity={0.8} listening={false} />
        {Number.isFinite(v) && <Circle x={x} y={yAt(area, low, high, v)} radius={7} fill={color} stroke={textColor} strokeWidth={3} listening={false} {...SHADOW} />}
      </>
    )
  }

  const pos = defaultPosition(settings, aspectKey, width, height)
  return (
    <DraggableElement kind={PROFILE_KIND} width={width} height={height} defaultX={pos.x} defaultY={pos.y}>
      <Shape sceneFunc={sceneFunc} listening={false} perfectDrawEnabled={false} />
      {labels}
      {marker}
    </DraggableElement>
  )
}
