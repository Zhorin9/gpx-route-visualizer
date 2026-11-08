import { Text } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../core/formats/registry'
import { useStickerColor } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { konvaFontStyle } from '../../utils/fonts'
import { measureTextWidth } from '../../utils/measureText'
import { STAMP_KIND, selectStartTime, stampText } from './model'

const SIZE = 34
const MARGIN = 48
const GAP = 24


export default function StampNode() {
  const time = useAppStore(selectStartTime)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const titleY = useAppStore((s) => s.texts.find((t) => t.role === 'title')?.y)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const sticker = useStickerColor(0)
  const ownColor = useAppStore((s) => s.statsStyle.color)
  const color = sticker ?? ownColor
  useAppStore((s) => s.fontsVersion)
  if (time == null) return null
  const text = stampText(time)
  const fontStyle = konvaFontStyle(fontFamily)
  const width = Math.ceil(measureTextWidth(text, fontFamily, SIZE, fontStyle))
  const { w, h, safeZone } = FORMATS[aspectKey]
  // Top right above the title, as on the board; with no room there (a title right under the
  // app's top bar), bottom left, clear of the map credit on the right.
  const top = (safeZone?.top ?? 0) + MARGIN
  const above = titleY == null ? top : titleY - SIZE - GAP
  const corner =
    above >= top
      ? { x: w - (safeZone?.right ?? 0) - MARGIN - width, y: Math.min(top, above) }
      : { x: (safeZone?.left ?? 0) + MARGIN, y: h - Math.min(bottomInset(aspectKey), (safeZone?.bottom ?? 0) + MARGIN) - SIZE }
  return (
    <DraggableElement kind={STAMP_KIND} width={width} height={SIZE} defaultX={corner.x} defaultY={corner.y}>
      <Text text={text} fontSize={SIZE} fontFamily={fontFamily} fontStyle={fontStyle} fill={color} listening={false} perfectDrawEnabled={false} />
    </DraggableElement>
  )
}
