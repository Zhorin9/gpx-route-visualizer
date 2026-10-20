import { Layer, Rect } from 'react-konva'
import { useAppStore } from '../store/useAppStore'
import { ASPECTS } from '../utils/aspects'
import { gradientLine } from '../utils/color'
import { noiseTile } from '../utils/image'

// One gradient across the whole carousel ribbon, drawn under the photos.
export default function BackgroundLayer() {
  const collage = useAppStore((s) => s.collage)
  const slideCount = useAppStore((s) => s.slides.length)
  const aspectKey = useAppStore((s) => s.aspectKey)

  if (collage.bgKind !== 'gradient') return null

  const { gradient } = collage
  const { w, h } = ASPECTS[aspectKey]
  const width = w * slideCount
  const { start, end } = gradientLine(gradient.angle, width, h)
  // Dithering is the same noise at a whisper, enough to break up banding.
  const grainOpacity = Math.min(1, (gradient.grain / 100) * 0.6 + (gradient.smooth ? 0.04 : 0))

  return (
    <Layer listening={false}>
      <Rect
        width={width}
        height={h}
        fillLinearGradientStartPoint={start}
        fillLinearGradientEndPoint={end}
        fillLinearGradientColorStops={[0, gradient.from, 1, gradient.to]}
      />
      {grainOpacity > 0 && <Rect width={width} height={h} fillPatternImage={noiseTile() as unknown as HTMLImageElement} fillPatternRepeat="repeat" opacity={grainOpacity} />}
    </Layer>
  )
}
