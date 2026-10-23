import { Text } from 'react-konva'
import DraggableElement from '../../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../../core/formats/registry'
import { useAppStore } from '../../../store/useAppStore'
import { konvaFontStyle } from '../../../utils/fonts'
import { measureTextWidth } from '../../../utils/measureText'
import { creditFor } from '../model/styles'
import { MAP_CREDIT_KIND } from '../types'

const MARGIN = 24

// The map's source, as its licence asks: small, in a corner, movable and recolourable but always there.
export default function MapCreditNode() {
  const settings = useAppStore((s) => s.map)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const textColor = useAppStore((s) => s.statsStyle.color)
  useAppStore((s) => s.fontsVersion)

  const text = creditFor(settings)
  const size = settings.creditSize
  const fontStyle = konvaFontStyle(fontFamily)
  const width = Math.ceil(measureTextWidth(text, fontFamily, size, fontStyle))
  const { w, h, safeZone } = FORMATS[aspectKey]
  return (
    <DraggableElement
      kind={MAP_CREDIT_KIND}
      width={width}
      height={size}
      defaultX={w - (safeZone?.right ?? 0) - MARGIN - width}
      defaultY={h - Math.min(bottomInset(aspectKey), (safeZone?.bottom ?? 0) + MARGIN) - size}
    >
      <Text text={text} fontSize={size} fontFamily={fontFamily} fontStyle={fontStyle} fill={settings.creditColor ?? textColor} opacity={0.8} listening={false} perfectDrawEnabled={false} />
    </DraggableElement>
  )
}
