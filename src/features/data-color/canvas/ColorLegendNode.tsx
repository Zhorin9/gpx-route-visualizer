import { Rect, Text } from 'react-konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { dataSource } from '../../../core/data/sources'
import { useAppStore } from '../../../store/useAppStore'
import { ASPECTS, STORY_SAFE_ZONE } from '../../../utils/aspects'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import { LEGEND_KIND } from '../types'
import { useActiveDataColor } from '../useDataColoring'

const WIDTH = 380
const BAR_H = 16
const LABEL = 22
const GAP = 10
const SHADOW = { shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.5 }

// Gradient bar with what the colours mean, in the stats header's font and colour.
export default function ColorLegendNode() {
  const active = useActiveDataColor()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const units = useAppStore((s) => s.statsContent.units)
  const textColor = useAppStore((s) => s.statsStyle.color)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  // Keeps clear of the elevation chart when both sit at the bottom.
  const profileBelow = useAppStore((s) => (s.profile.enabled && s.profile.placement === 'bottom' && s.placements.elevationProfile == null ? s.profile.height : 0))
  useAppStore((s) => s.fontsVersion)
  if (!active) return null

  const source = dataSource(active.sourceId)
  const fontStyle = konvaFontStyle(fontFamily)
  const height = LABEL + GAP + BAR_H + GAP + LABEL
  const [lo, hi] = active.domain
  const low = source.format(lo, units)
  const high = source.format(hi, units)
  const title = `${source.label.toUpperCase()} · ${source.unit(units)}`
  const stops = active.bins.flatMap((c, i) => [i / Math.max(1, active.bins.length - 1), c])

  const { h } = ASPECTS[aspectKey]
  const bottom = (aspectKey === '9:16' ? STORY_SAFE_ZONE.bottom + 20 : 60) + (profileBelow ? profileBelow + 30 : 0)
  const text = (key: string, value: string, x: number, y: number, size: number, extra = {}) => (
    <Text key={key} text={value} x={x} y={y} fontSize={size} fontFamily={fontFamily} fontStyle={fontStyle} fill={textColor} listening={false} perfectDrawEnabled={false} {...SHADOW} {...extra} />
  )

  return (
    <DraggableElement kind={LEGEND_KIND} width={WIDTH} height={height} defaultX={60} defaultY={h - bottom - height}>
      {text('title', title, 0, 0, LABEL * 0.8, { letterSpacing: LABEL * 0.08, opacity: 0.85 })}
      <Rect
        y={LABEL + GAP}
        width={WIDTH}
        height={BAR_H}
        cornerRadius={BAR_H / 2}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: WIDTH, y: 0 }}
        fillLinearGradientColorStops={stops}
        listening={false}
        {...SHADOW}
      />
      {text('low', low, 0, LABEL + GAP * 2 + BAR_H, LABEL)}
      {text('high', high, WIDTH - measureTextWidth(high, fontFamily, LABEL, fontStyle), LABEL + GAP * 2 + BAR_H, LABEL)}
    </DraggableElement>
  )
}
