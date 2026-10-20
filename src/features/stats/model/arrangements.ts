import type { Offset, StatChip, StatKey, StatsArrangement, StatsStyle } from '../../../types'

export type MeasureText = (text: string, fontFamily: string, fontSize: number, fontStyle: string) => number

export interface ArrangeInput {
  chips: StatChip[]
  style: StatsStyle
  fontStyle: string
  frameW: number
  chipOffsets: Partial<Record<StatKey, Offset>>
  measure: MeasureText
}

// One piece of text in the header box, origin at the box's top-left corner.
export interface StatTextBox {
  id: string
  chipKey: StatKey
  text: string
  x: number
  y: number
  fontSize: number
  // Clip width (single line, ellipsis).
  width?: number
  letterSpacing?: number
  opacity?: number
  shadow: boolean
  // Set when the chip can be dragged out of the line on its own; the offset is measured from here.
  dragBase?: { x: number; y: number }
}

export interface StatsBox {
  width: number
  height: number
  texts: StatTextBox[]
  dividers: { x1: number; y1: number; x2: number; y2: number }[]
}

export interface StatsArrangementStrategy {
  id: StatsArrangement
  label: string
  arrange: (input: ArrangeInput) => StatsBox
}

// Same proportions as the design: 5% side padding, caption about half the value size.
const COLUMN_PAD_RATIO = 0.05
const LABEL_RATIO = 0.5
const LABEL_GAP_RATIO = 0.12
const CELL_INSET_RATIO = 0.5
export const LABEL_TRACKING = 0.08

export const captionSize = (fontSize: number) => Math.max(14, Math.round(fontSize * LABEL_RATIO))
export const captionGap = (fontSize: number) => fontSize * LABEL_GAP_RATIO

// Values side by side in one line; a chip dragged out keeps its own offset.
export const rowArrangement: StatsArrangementStrategy = {
  id: 'row',
  label: 'W jednej linii',
  arrange: ({ chips, style, fontStyle, chipOffsets, measure }) => {
    const texts: StatTextBox[] = []
    let cursor = 0
    for (const chip of chips) {
      const offset = chipOffsets[chip.key] ?? { dx: 0, dy: 0 }
      texts.push({
        id: chip.key,
        chipKey: chip.key,
        text: chip.text,
        x: cursor + offset.dx,
        y: offset.dy,
        fontSize: style.fontSize,
        shadow: true,
        dragBase: { x: cursor, y: 0 },
      })
      cursor += measure(chip.text, style.fontFamily, style.fontSize, fontStyle) + style.spacing
    }
    return { width: Math.max(1, cursor - style.spacing), height: style.fontSize, texts, dividers: [] }
  },
}

interface Cell {
  left: number
  dividerX: number
  width: number
}

function columnCells({ chips, style, fontStyle, frameW, measure }: ArrangeInput, labelSize: number): { totalW: number; cells: Cell[] } {
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
    const valueW = measure(chip.value, style.fontFamily, style.fontSize, fontStyle)
    const labelW = style.labels ? measure(chip.label.toUpperCase(), style.fontFamily, labelSize, fontStyle) + labelSize * LABEL_TRACKING * chip.label.length : 0
    const width = Math.max(valueW, labelW) + 2
    const cell = { left: cursor, dividerX: cursor - style.spacing / 2, width }
    cursor += width + style.spacing
    return cell
  })
  return { totalW: Math.max(1, cursor - style.spacing), cells }
}

// Caption above the value, as in the column and grid arrangements.
export function captionedValue(chip: StatChip, style: StatsStyle, left: number, top: number, width: number): StatTextBox[] {
  const labelSize = captionSize(style.fontSize)
  const labelBlock = style.labels ? labelSize + captionGap(style.fontSize) : 0
  const texts: StatTextBox[] = []
  if (style.labels) {
    texts.push({
      id: `${chip.key}:label`,
      chipKey: chip.key,
      text: chip.label.toUpperCase(),
      x: left,
      y: top,
      fontSize: labelSize,
      letterSpacing: labelSize * LABEL_TRACKING,
      opacity: 0.85,
      shadow: false,
    })
  }
  texts.push({ id: chip.key, chipKey: chip.key, text: chip.value, x: left, y: top + labelBlock, fontSize: style.fontSize, width, shadow: true })
  return texts
}

// Equal columns across the frame (or sized to content), caption above each value, rules between.
export const columnsArrangement: StatsArrangementStrategy = {
  id: 'columns',
  label: 'Kolumny',
  arrange: (input) => {
    const { chips, style } = input
    const labelSize = captionSize(style.fontSize)
    const labelBlock = style.labels ? labelSize + captionGap(style.fontSize) : 0
    const { totalW, cells } = columnCells(input, labelSize)
    const height = style.fontSize + labelBlock
    const texts: StatTextBox[] = []
    const dividers: StatsBox['dividers'] = []
    chips.forEach((chip, i) => {
      const { left, dividerX, width } = cells[i]
      if (style.dividers && i > 0) dividers.push({ x1: dividerX, y1: 0, x2: dividerX, y2: height })
      texts.push(...captionedValue(chip, style, left, 0, width))
    })
    return { width: totalW, height, texts, dividers }
  },
}

const GRID_COLUMNS = 2
const GRID_ROW_GAP_RATIO = 0.45

// Two columns that wrap into rows; caption above every value.
export const gridArrangement: StatsArrangementStrategy = {
  id: 'grid',
  label: 'Siatka',
  arrange: ({ chips, style, fontStyle, frameW, measure }) => {
    const labelSize = captionSize(style.fontSize)
    const labelBlock = style.labels ? labelSize + captionGap(style.fontSize) : 0
    const cols = Math.min(GRID_COLUMNS, chips.length)
    const contentW = Math.max(
      ...chips.map((c) =>
        Math.max(
          measure(c.value, style.fontFamily, style.fontSize, fontStyle),
          style.labels ? measure(c.label.toUpperCase(), style.fontFamily, labelSize, fontStyle) + labelSize * LABEL_TRACKING * c.label.length : 0,
        ),
      ),
    )
    const cellW = style.stretch ? (frameW * (1 - 2 * COLUMN_PAD_RATIO) - style.spacing * (cols - 1)) / cols : contentW + 2
    const cellH = style.fontSize + labelBlock
    const rowGap = style.fontSize * GRID_ROW_GAP_RATIO
    const rows = Math.ceil(chips.length / cols)
    const width = cols * cellW + (cols - 1) * style.spacing
    const height = rows * cellH + (rows - 1) * rowGap
    const texts = chips.flatMap((chip, i) => {
      const left = (i % cols) * (cellW + style.spacing)
      const top = Math.floor(i / cols) * (cellH + rowGap)
      return captionedValue(chip, style, left, top, cellW)
    })
    const dividers: StatsBox['dividers'] = []
    if (style.dividers && cols > 1) {
      const x = cellW + style.spacing / 2
      dividers.push({ x1: x, y1: 0, x2: x, y2: height })
    }
    return { width, height, texts, dividers }
  },
}

const HERO_RATIO = 2.4
const HERO_SECONDARY_RATIO = 0.6

// One figure large with its caption, the others in a small line under it.
export const heroArrangement: StatsArrangementStrategy = {
  id: 'hero',
  label: 'Jedna duża liczba',
  arrange: ({ chips, style, fontStyle, measure }) => {
    const hero = chips.find((c) => c.key === style.heroKey) ?? chips[0]
    const heroSize = Math.round(style.fontSize * HERO_RATIO)
    const labelSize = captionSize(style.fontSize)
    const labelBlock = style.labels ? labelSize + captionGap(heroSize) : 0
    const smallSize = Math.max(14, Math.round(style.fontSize * HERO_SECONDARY_RATIO))
    const others = style.heroSecondary ? chips.filter((c) => c !== hero) : []
    const smallGap = Math.max(12, style.spacing * 0.6)

    const caption = hero.label.toUpperCase()
    const captionW = style.labels ? measure(caption, style.fontFamily, labelSize, fontStyle) + labelSize * LABEL_TRACKING * caption.length : 0
    const heroW = measure(hero.value, style.fontFamily, heroSize, fontStyle)
    const smallWidths = others.map((c) => measure(c.text, style.fontFamily, smallSize, fontStyle))
    const smallW = smallWidths.reduce((sum, w) => sum + w, 0) + Math.max(0, others.length - 1) * smallGap
    const width = Math.max(captionW, heroW, smallW, 1)

    const texts: StatTextBox[] = []
    if (style.labels) {
      texts.push({
        id: `${hero.key}:label`,
        chipKey: hero.key,
        text: caption,
        x: (width - captionW) / 2,
        y: 0,
        fontSize: labelSize,
        letterSpacing: labelSize * LABEL_TRACKING,
        opacity: 0.85,
        shadow: false,
      })
    }
    texts.push({ id: hero.key, chipKey: hero.key, text: hero.value, x: (width - heroW) / 2, y: labelBlock, fontSize: heroSize, shadow: true })

    const smallTop = labelBlock + heroSize * 1.08
    let cursor = (width - smallW) / 2
    others.forEach((chip, i) => {
      texts.push({ id: chip.key, chipKey: chip.key, text: chip.text, x: cursor, y: smallTop, fontSize: smallSize, opacity: 0.9, shadow: true })
      cursor += smallWidths[i] + smallGap
    })
    const height = others.length ? smallTop + smallSize : labelBlock + heroSize
    return { width, height, texts, dividers: [] }
  },
}
