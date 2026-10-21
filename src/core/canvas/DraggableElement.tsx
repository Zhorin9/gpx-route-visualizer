import type { ReactNode } from 'react'
import { Group, Rect } from 'react-konva'
import type Konva from 'konva'
import { useAppStore } from '../../store/useAppStore'
import { UI_ONLY } from '../../utils/exportImage'
import { useLayerAnimation } from '../animation/layers'
import { CHROME_ACCENT } from './chrome'
import { canvasElement } from './registry'
import type { ElementKind } from '../../types'

const HIT_PADDING = 24
const OUTLINE_PAD = 8

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

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Drags of inner parts (a stats chip) bubble up here too; those are handled where they start.
    if (e.target !== e.currentTarget) return
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
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
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
