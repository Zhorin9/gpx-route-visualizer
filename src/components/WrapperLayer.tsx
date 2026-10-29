import { Circle, Group, Layer, Shape } from 'react-konva'
import type Konva from 'konva'
import useSlideScene from '../hooks/useSlideScene'
import { useAppStore } from '../store/useAppStore'
import { formatDistance } from '../core/units'
import { drawWrapper, hasPostmark, slideBox } from '../utils/wrappers'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// The project's wrapper over every slide: its paper round the content, its fields and the postmark,
// which can be dragged to another place. Drawn on the canvas, so the files get the same.
export default function WrapperLayer() {
  const { projectLook: look, route, units, w, h, slides } = useSlideScene()
  const wrapper = useAppStore((s) => s.wrapper)
  const carouselKind = useAppStore((s) => s.carouselKind)
  const updateWrapper = useAppStore((s) => s.updateWrapper)
  if (wrapper.id === 'none') return null

  const scene = { w, h, wrapper, look, distance: route ? formatDistance(route.totalKm, units, 0) : null }
  const state = { wrapper, slides, carouselKind }
  const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, cursor: string) => {
    e.target.getStage()!.container().style.cursor = cursor
  }

  return (
    <Layer>
      {slides.map((_, i) => {
        const box = slideBox(state, i, w, h)
        const postmark = hasPostmark(state, i)
        if (!box && !postmark) return null
        return (
          <Group key={i} x={i * w}>
            <Shape listening={false} sceneFunc={(context) => drawWrapper(context._context, scene, box, postmark)} />
            {postmark && (
              <Circle
                x={wrapper.postmark.x * w}
                y={wrapper.postmark.y * h}
                radius={0.15 * Math.min(w, h)}
                fill="#000"
                opacity={0}
                draggable
                onMouseEnter={(e) => setCursor(e, 'move')}
                onMouseLeave={(e) => setCursor(e, '')}
                onDragMove={(e) => updateWrapper({ postmark: { x: clamp01(e.target.x() / w), y: clamp01(e.target.y() / h) } })}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
