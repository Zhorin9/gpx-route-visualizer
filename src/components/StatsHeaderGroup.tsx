import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { useStatsChips } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS, defaultStatsY } from '../utils/aspects'
import { konvaFontStyle } from '../utils/fonts'
import { measureTextWidth } from '../utils/measureText'
import type { StatChip } from '../types'

const HIT_PADDING = 24

function layoutRow(chips: StatChip[], fontFamily: string, fontSize: number, fontStyle: string, spacing: number) {
  const placed: (StatChip & { baseX: number })[] = []
  let cursor = 0
  for (const chip of chips) {
    placed.push({ ...chip, baseX: cursor })
    cursor += measureTextWidth(chip.text, fontFamily, fontSize, fontStyle) + spacing
  }
  return { placed, rowW: cursor - spacing }
}

// Chips are laid out in a row from their real measured widths. Dragging the
// empty space moves the whole header; dragging a single chip stores a manual
// offset that survives font size / spacing changes.
export default function StatsHeaderGroup() {
  const chips = useStatsChips()
  const style = useAppStore((s) => s.statsStyle)
  const layout = useAppStore((s) => s.statsLayout)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setStatsPosition = useAppStore((s) => s.setStatsPosition)
  const setChipOffset = useAppStore((s) => s.setChipOffset)
  const select = useAppStore((s) => s.select)
  // Re-measure once web fonts arrive; earlier widths came from a fallback font.
  useAppStore((s) => s.fontsVersion)

  if (!chips.length) return null

  const fontStyle = konvaFontStyle(style.fontFamily)
  const { placed, rowW } = layoutRow(chips, style.fontFamily, style.fontSize, fontStyle, style.spacing)
  const rowH = style.fontSize
  const x = layout.x ?? (ASPECTS[aspectKey].w - rowW) / 2
  const y = layout.y ?? defaultStatsY(aspectKey)

  function handleGroupDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Chip drags bubble up here too — those are handled on the chip.
    if (e.target !== e.currentTarget) return
    setStatsPosition(e.target.x() - rowW / 2, e.target.y() - rowH / 2)
  }

  return (
    <Group
      x={x + rowW / 2}
      y={y + rowH / 2}
      offsetX={rowW / 2}
      offsetY={rowH / 2}
      rotation={style.rotation}
      draggable
      onMouseDown={() => select({ kind: 'stats' })}
      onTouchStart={() => select({ kind: 'stats' })}
      onDragEnd={handleGroupDragEnd}
    >
      <Rect
        x={-HIT_PADDING}
        y={-HIT_PADDING}
        width={rowW + HIT_PADDING * 2}
        height={rowH + HIT_PADDING * 2}
        fill="#000"
        opacity={0}
      />
      {placed.map((chip) => {
        const offset = layout.chipOffsets[chip.key] ?? { dx: 0, dy: 0 }
        return (
          <Text
            key={chip.key}
            text={chip.text}
            x={chip.baseX + offset.dx}
            y={offset.dy}
            fontFamily={style.fontFamily}
            fontStyle={fontStyle}
            fontSize={style.fontSize}
            fill={style.color}
            shadowColor="#000000"
            shadowBlur={10}
            shadowOpacity={0.6}
            perfectDrawEnabled={false}
            draggable
            onDragEnd={(e) => setChipOffset(chip.key, { dx: e.target.x() - chip.baseX, dy: e.target.y() })}
          />
        )
      })}
    </Group>
  )
}
