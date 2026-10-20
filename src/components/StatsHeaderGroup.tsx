import { Group, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { useStatsChips } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS, defaultStatsY, statsYBelowTitle } from '../utils/aspects'
import { konvaFontStyle } from '../utils/fonts'
import { measureTextWidth } from '../utils/measureText'
import { fittedTitleSize } from '../utils/title'
import type { StatChip, StatsStyle } from '../types'

const HIT_PADDING = 24
// Same proportions as the design: 5% side padding, caption about half the value size.
const COLUMN_PAD_RATIO = 0.05
const LABEL_RATIO = 0.5
const LABEL_GAP_RATIO = 0.12
const CELL_INSET_RATIO = 0.5

function layoutRow(chips: StatChip[], fontFamily: string, fontSize: number, fontStyle: string, spacing: number) {
  const placed: (StatChip & { baseX: number })[] = []
  let cursor = 0
  for (const chip of chips) {
    placed.push({ ...chip, baseX: cursor })
    cursor += measureTextWidth(chip.text, fontFamily, fontSize, fontStyle) + spacing
  }
  return { placed, rowW: cursor - spacing }
}

function layoutColumns(chips: StatChip[], style: StatsStyle, fontStyle: string, labelSize: number, frameW: number) {
  const inset = style.fontSize * CELL_INSET_RATIO
  if (style.stretch) {
    const totalW = frameW * (1 - 2 * COLUMN_PAD_RATIO)
    const cellW = totalW / chips.length
    return {
      totalW,
      cells: chips.map((_, i) => ({ left: i * cellW + (i ? inset : 0), dividerX: i * cellW, width: cellW - (i ? inset : 0) })),
    }
  }
  // Compact: each column is as wide as its content, with the chosen spacing between.
  let cursor = 0
  const cells = chips.map((chip) => {
    const valueW = measureTextWidth(chip.value, style.fontFamily, style.fontSize, fontStyle)
    const labelW = style.labels ? measureTextWidth(chip.label.toUpperCase(), style.fontFamily, labelSize, fontStyle) + labelSize * 0.08 * chip.label.length : 0
    const width = Math.max(valueW, labelW) + 2
    const cell = { left: cursor, dividerX: cursor - style.spacing / 2, width }
    cursor += width + style.spacing
    return cell
  })
  return { totalW: Math.max(1, cursor - style.spacing), cells }
}

// Two layouts. "row": chips in one line from their measured widths; dragging a chip stores a manual
// offset. "columns": equal columns across the frame, caption above the value, rules between.
// Dragging the empty space moves the whole header either way.
export default function StatsHeaderGroup() {
  const chips = useStatsChips()
  const style = useAppStore((s) => s.statsStyle)
  const title = useAppStore((s) => s.texts.find((t) => t.role === 'title'))
  const layout = useAppStore((s) => s.statsLayout)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const setStatsPosition = useAppStore((s) => s.setStatsPosition)
  const setChipOffset = useAppStore((s) => s.setChipOffset)
  const select = useAppStore((s) => s.select)
  // Re-measure once web fonts arrive; earlier widths came from a fallback font.
  useAppStore((s) => s.fontsVersion)

  if (!chips.length) return null

  const frameW = ASPECTS[aspectKey].w
  const fontStyle = konvaFontStyle(style.fontFamily)
  const columns = style.arrangement === 'columns'
  const labelSize = Math.max(14, Math.round(style.fontSize * LABEL_RATIO))
  const labelBlock = columns && style.labels ? labelSize + style.fontSize * LABEL_GAP_RATIO : 0

  const row = layoutRow(chips, style.fontFamily, style.fontSize, fontStyle, style.spacing)
  const cells = layoutColumns(chips, style, fontStyle, labelSize, frameW)
  const rowW = columns ? cells.totalW : row.rowW
  const rowH = style.fontSize + labelBlock
  const x = layout.x ?? (frameW - rowW) / 2
  const y = layout.y ?? (title ? statsYBelowTitle({ y: title.y, fontSize: fittedTitleSize(title, frameW) }) : defaultStatsY(aspectKey))

  function handleGroupDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Chip drags bubble up here too — those are handled on the chip.
    if (e.target !== e.currentTarget) return
    setStatsPosition(e.target.x() - rowW / 2, e.target.y() - rowH / 2)
  }

  const shadow = { shadowColor: '#000000', shadowBlur: 10, shadowOpacity: 0.6 }

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
      <Rect x={-HIT_PADDING} y={-HIT_PADDING} width={rowW + HIT_PADDING * 2} height={rowH + HIT_PADDING * 2} fill="#000" opacity={0} />
      {columns
        ? chips.map((chip, i) => {
            const { left, dividerX, width } = cells.cells[i]
            return (
              <Group key={chip.key} listening={false}>
                {style.dividers && i > 0 && (
                  <Line points={[dividerX, 0, dividerX, rowH]} stroke={style.color} strokeWidth={2} opacity={0.4} />
                )}
                {style.labels && (
                  <Text
                    text={chip.label.toUpperCase()}
                    x={left}
                    y={0}
                    fontFamily={style.fontFamily}
                    fontStyle={fontStyle}
                    fontSize={labelSize}
                    letterSpacing={labelSize * 0.08}
                    fill={style.color}
                    opacity={0.85}
                    perfectDrawEnabled={false}
                  />
                )}
                <Text
                  text={chip.value}
                  x={left}
                  y={labelBlock}
                  width={width}
                  wrap="none"
                  ellipsis
                  fontFamily={style.fontFamily}
                  fontStyle={fontStyle}
                  fontSize={style.fontSize}
                  fill={style.color}
                  perfectDrawEnabled={false}
                  {...shadow}
                />
              </Group>
            )
          })
        : row.placed.map((chip) => {
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
                perfectDrawEnabled={false}
                draggable
                onDragEnd={(e) => setChipOffset(chip.key, { dx: e.target.x() - chip.baseX, dy: e.target.y() })}
                {...shadow}
              />
            )
          })}
    </Group>
  )
}
