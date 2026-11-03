import { Group, Layer, Shape } from 'react-konva'
import useSlideScene from '../hooks/useSlideScene'
import { usePanorama } from '../store/selectors'
import { drawDataSlide, drawOverlays } from '../utils/drawSlide'
import { slideKind, slidePlace } from '../utils/series'
import SlideBox from './SlideBox'
import type { Slide } from '../types'

// Draws a slide straight on the stage's canvas, so files at 2× stay sharp.
function SlideShape({ index, x, draw }: { index: number; x: number; draw: (ctx: CanvasRenderingContext2D) => void }) {
  return (
    <SlideBox slide={index}>
      <Group x={x}>
        <Shape listening={false} sceneFunc={(context) => draw(context._context)} />
      </Group>
    </SlideBox>
  )
}

// Profile and summary slides, and the mini-map and marker over photo slides.
export default function SeriesLayer() {
  const panorama = usePanorama()
  const { projectLook: look, ...scene } = useSlideScene()
  if (panorama || scene.slides.length < 2) return null
  const points = scene.route?.points ?? null

  const drawn = (slide: Slide, i: number) => {
    const full = { ...scene, look: slide.ownLook ?? look }
    if (slideKind(slide) !== 'photos') return <SlideShape key={i} index={i} x={i * scene.w} draw={(ctx) => drawDataSlide(ctx, slide, full)} />
    const place = slide.overlays ? slidePlace(slide, scene.photos, points) : null
    if (!place || (!slide.overlays?.marker && slide.overlays?.miniMap === 'off')) return null
    return <SlideShape key={i} index={i} x={i * scene.w} draw={(ctx) => drawOverlays(ctx, slide, full, place.index)} />
  }

  return <Layer listening={false}>{scene.slides.map((slide, i) => (i > 0 ? drawn(slide, i) : null))}</Layer>
}
