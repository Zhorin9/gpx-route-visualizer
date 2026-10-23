import { Layer, Rect, Shape } from 'react-konva'
import type Konva from 'konva'
import { useAppStore } from '../store/useAppStore'
import { FORMATS } from '../core/formats/registry'
import { gradientLine } from '../utils/color'
import { noiseTile } from '../utils/image'
import type { BackgroundPattern } from '../types'

const GRID_STEP = 72
const CONTOUR_STEP = 60

// Fine lines in the text colour: a drafting grid, or contour rings round a point low on each slide.
function Pattern({ kind, width, height, slideWidth }: { kind: BackgroundPattern; width: number; height: number; slideWidth: number }) {
  const color = useAppStore((s) => s.statsStyle.color)
  if (kind === 'none') return null
  function sceneFunc(context: Konva.Context) {
    const ctx = context._context
    ctx.strokeStyle = color
    ctx.beginPath()
    if (kind === 'grid') {
      ctx.globalAlpha = 0.1
      ctx.lineWidth = 1.5
      for (let x = 0; x <= width; x += GRID_STEP) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y <= height; y += GRID_STEP) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
    } else {
      ctx.globalAlpha = 0.14
      ctx.lineWidth = 3
      const reach = Math.hypot(slideWidth, height)
      for (let left = 0; left < width; left += slideWidth) {
        for (let r = CONTOUR_STEP; r < reach; r += CONTOUR_STEP) {
          ctx.moveTo(left + slideWidth * 0.3 + r, height * 0.7)
          ctx.arc(left + slideWidth * 0.3, height * 0.7, r, 0, Math.PI * 2)
        }
      }
    }
    ctx.stroke()
  }
  return <Shape sceneFunc={sceneFunc} perfectDrawEnabled={false} />
}

// The frame's background across the whole carousel ribbon, drawn under the photos:
// a flat colour or one gradient, with an optional pattern. Nothing at all for a transparent background,
// nor for a map, which lies under the stage.
export default function BackgroundLayer() {
  const collage = useAppStore((s) => s.collage)
  const slideCount = useAppStore((s) => s.slides.length)
  const aspectKey = useAppStore((s) => s.aspectKey)

  if (collage.bgKind !== 'color' && collage.bgKind !== 'gradient') return null

  const { gradient } = collage
  const { w, h } = FORMATS[aspectKey]
  const width = w * slideCount
  if (collage.bgKind === 'color') {
    return (
      <Layer listening={false}>
        <Rect width={width} height={h} fill={collage.bgColor} />
      </Layer>
    )
  }
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
      <Pattern kind={gradient.pattern ?? 'none'} width={width} height={h} slideWidth={w} />
      {grainOpacity > 0 && <Rect width={width} height={h} fillPatternImage={noiseTile() as unknown as HTMLImageElement} fillPatternRepeat="repeat" opacity={grainOpacity} />}
    </Layer>
  )
}
