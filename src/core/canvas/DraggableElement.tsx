import type { ReactNode } from 'react'
import { Group, Rect } from 'react-konva'
import Konva from 'konva'
import { useAppStore } from '../../store/useAppStore'
import { ASPECTS } from '../../utils/aspects'
import { UI_ONLY } from '../../utils/exportImage'
import { useLayerAnimation } from '../animation/layers'
import { CHROME_ACCENT } from './chrome'
import { canvasElement } from './registry'
import { snapBox, type Box } from './snap'
import type { ElementKind } from '../../types'

const HIT_PADDING = 24
const OUTLINE_PAD = 8
// Snap distance in screen pixels, whatever the preview scale.
const SNAP_PX = 6
const SNAP_TARGET = 'snap-target'
const GUIDE = 'snap-guide'

// The element's axis-aligned box: its group sits on the centre, offset by half the size, and may be rotated.
function boxOf(node: Konva.Node): Box {
  const angle = (node.rotation() * Math.PI) / 180
  const [cos, sin] = [Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))]
  const [w, h] = [node.offsetX() * 2, node.offsetY() * 2]
  const width = w * cos + h * sin
  const height = w * sin + h * cos
  return { x: node.x() - width / 2, y: node.y() - height / 2, width, height }
}

function clearGuides(layer: Konva.Layer) {
  layer.find(`.${GUIDE}`).forEach((guide) => guide.destroy())
}

export interface DraggableElementProps {
  kind: ElementKind
  width: number
  height: number
  // Used until the element is placed by hand in this format.
  defaultX: number
  defaultY: number
  rotation?: number
  children: ReactNode
}

// Shared behaviour of every registered element: placement per format, dragging,
// selection and its outline. The element itself only draws its content in a
// width × height box with the origin at the top-left corner.
export default function DraggableElement({ kind, width, height, defaultX, defaultY, rotation = 0, children }: DraggableElementProps) {
  const placement = useAppStore((s) => s.placements[kind])
  const selected = useAppStore((s) => s.selection?.kind === 'element' && s.selection.element === kind)
  const select = useAppStore((s) => s.select)
  const setPlacement = useAppStore((s) => s.setPlacement)
  const animation = useLayerAnimation(canvasElement(kind)?.animationTrack ?? 'stats')

  const x = placement?.x ?? defaultX
  const y = placement?.y ?? defaultY
  const onSelect = () => select({ kind: 'element', element: kind })

  // Lines the element up with the frame and the other elements while it moves; Alt drags freely.
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    if (e.target !== e.currentTarget) return
    const node = e.target
    const layer = node.getLayer()
    if (!layer) return
    clearGuides(layer)
    if (e.evt.altKey) return
    const { aspectKey, slides } = useAppStore.getState()
    const { w, h } = ASPECTS[aspectKey]
    const box = boxOf(node)
    const slide = Math.min(slides.length - 1, Math.max(0, Math.floor((box.x + box.width / 2) / w)))
    const others = layer.find(`.${SNAP_TARGET}`).filter((n) => n !== node).map(boxOf)
    const snap = snapBox(box, [{ x: slide * w, y: 0, width: w, height: h }, ...others], SNAP_PX / (node.getStage()?.scaleX() ?? 1))
    node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy })
    for (const points of snap.guides) {
      layer.add(new Konva.Line({ name: `${GUIDE} ${UI_ONLY}`, points, stroke: CHROME_ACCENT, strokeWidth: 1.5, strokeScaleEnabled: false, dash: [6, 4], listening: false }))
    }
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Drags of inner parts (a stats chip) bubble up here too; those are handled where they start.
    if (e.target !== e.currentTarget) return
    const layer = e.target.getLayer()
    if (layer) clearGuides(layer)
    setPlacement(kind, { x: e.target.x() - width / 2, y: e.target.y() - height / 2 - animation.offsetY })
  }

  return (
    <Group
      x={x + width / 2}
      y={y + height / 2 + animation.offsetY}
      opacity={animation.opacity}
      offsetX={width / 2}
      offsetY={height / 2}
      rotation={rotation}
      name={SNAP_TARGET}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <Rect x={-HIT_PADDING} y={-HIT_PADDING} width={width + HIT_PADDING * 2} height={height + HIT_PADDING * 2} fill="#000" opacity={0} />
      {children}
      {selected && (
        <Rect
          name={UI_ONLY}
          x={-OUTLINE_PAD}
          y={-OUTLINE_PAD}
          width={width + OUTLINE_PAD * 2}
          height={height + OUTLINE_PAD * 2}
          stroke={CHROME_ACCENT}
          strokeWidth={2.5}
          strokeScaleEnabled={false}
          dash={[8, 5]}
          cornerRadius={4}
          listening={false}
        />
      )}
    </Group>
  )
}
