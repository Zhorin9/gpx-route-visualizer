import { Text } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { textShadow } from '../../core/canvas/shadows'
import { textColumn } from '../../core/formats/registry'
import { useStickerColor } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { konvaFontStyle } from '../../utils/fonts'
import { measureTextWidth } from '../../utils/measureText'
import { fittedTitleSize } from '../../utils/title'
import { KICKER_KIND } from './model'

// Room for a title bent in a wave, whose letters rise above its line.
const GAP = 0.7

// A short line over the title, in the figures' font; it sits just above the title until moved.
export default function KickerNode() {
  const text = useAppStore((s) => s.kicker.text)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const title = useAppStore((s) => s.texts.find((t) => t.role === 'title'))
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const sticker = useStickerColor(0)
  const ownColor = useAppStore((s) => s.statsStyle.color)
  useAppStore((s) => s.fontsVersion)
  const column = textColumn(aspectKey)
  const titleSize = title ? fittedTitleSize(title, column.w) : 96
  const size = Math.round(titleSize * 0.36)
  const fontStyle = konvaFontStyle(fontFamily)
  const width = Math.ceil(measureTextWidth(text, fontFamily, size, fontStyle))
  const titleY = title?.y ?? 300
  return (
    <DraggableElement kind={KICKER_KIND} width={width} height={size} defaultX={column.x + (column.w - width) / 2} defaultY={titleY - size * (1 + GAP)}>
      <Text text={text} fontSize={size} fontFamily={fontFamily} fontStyle={fontStyle} fill={sticker ?? ownColor} {...textShadow(sticker ?? ownColor)} listening={false} perfectDrawEnabled={false} />
    </DraggableElement>
  )
}
