import { Line, Text } from 'react-konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { useAppStore } from '../../../store/useAppStore'
import { ASPECTS, defaultStatsY, statsYBelowTitle } from '../../../utils/aspects'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import { fittedTitleSize } from '../../../utils/title'
import { arrangementFor } from '../model/registry'
import { useStatsChips } from '../useStatsChips'

export const STATS_KIND = 'stats'

const SHADOW = { shadowColor: '#000000', shadowBlur: 10, shadowOpacity: 0.6 }

// Draws whatever box the chosen arrangement computes; dragging the box moves the
// whole header, dragging a chip in the one-line arrangement stores its own offset.
export default function StatsHeaderNode() {
  const chips = useStatsChips()
  const style = useAppStore((s) => s.statsStyle)
  const title = useAppStore((s) => s.texts.find((t) => t.role === 'title'))
  const chipOffsets = useAppStore((s) => s.statsLayout.chipOffsets)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setChipOffset = useAppStore((s) => s.setChipOffset)
  // Re-measure once web fonts arrive; earlier widths came from a fallback font.
  useAppStore((s) => s.fontsVersion)

  if (!chips.length) return null

  const frameW = ASPECTS[aspectKey].w
  const fontStyle = konvaFontStyle(style.fontFamily)
  const box = arrangementFor(style.arrangement).arrange({ chips, style, fontStyle, frameW, chipOffsets, measure: measureTextWidth })
  const defaultY = title ? statsYBelowTitle({ y: title.y, fontSize: fittedTitleSize(title, frameW) }) : defaultStatsY(aspectKey)

  return (
    <DraggableElement kind={STATS_KIND} width={box.width} height={box.height} defaultX={(frameW - box.width) / 2} defaultY={defaultY} rotation={style.rotation}>
      {box.dividers.map((d, i) => (
        <Line key={`d${i}`} points={[d.x1, d.y1, d.x2, d.y2]} stroke={style.color} strokeWidth={2} opacity={0.4} listening={false} />
      ))}
      {box.texts.map((t) => {
        const base = t.dragBase
        return (
          <Text
            key={t.id}
            text={t.text}
            x={t.x}
            y={t.y}
            width={t.width}
            wrap={t.width ? 'none' : undefined}
            ellipsis={Boolean(t.width)}
            fontFamily={style.fontFamily}
            fontStyle={fontStyle}
            fontSize={t.fontSize}
            letterSpacing={t.letterSpacing}
            opacity={t.opacity}
            fill={style.color}
            perfectDrawEnabled={false}
            listening={Boolean(base)}
            draggable={Boolean(base)}
            onDragEnd={base ? (e) => setChipOffset(t.chipKey, { dx: e.target.x() - base.x, dy: e.target.y() - base.y }) : undefined}
            {...(t.shadow ? SHADOW : null)}
          />
        )
      })}
    </DraggableElement>
  )
}
