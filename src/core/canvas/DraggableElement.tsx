import { useRef, type ReactNode } from 'react'
import { Group, Rect } from 'react-konva'
import type Konva from 'konva'
import SlideBox from '../../components/SlideBox'
import { useSlideAt } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { UI_ONLY } from '../../utils/exportImage'
import { elementNodeId } from '../../utils/exportElement'
import { useLayerAnimation } from '../animation/layers'
import { CHROME_ACCENT, SELECTION_OUTLINE } from './chrome'
import { canvasElement } from './registry'
import { SNAP_BOX, SNAP_TARGET, snapDragEnd, snapDragMove } from './snapDrag'
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
  takesDrag?: (evt: MouseEvent | TouchEvent) => boolean
  children: ReactNode
}

// Children draw in a width × height box with the origin at its top-left corner.
export default function DraggableElement({ kind, width, height, defaultX, defaultY, rotation = 0, takesDrag, children }: DraggableElementProps) {
  const dragTaken = useRef(false)
  const placement = useAppStore((s) => s.placements[kind])
  const selected = useAppStore((s) => s.selection?.kind === 'element' && s.selection.element === kind)
  const select = useAppStore((s) => s.select)
  const setPlacement = useAppStore((s) => s.setPlacement)
  const animation = useLayerAnimation(canvasElement(kind)?.animationTrack ?? 'stats')

  const x = placement?.x ?? defaultX
  const y = placement?.y ?? defaultY
  const slide = useSlideAt(x)
  const onSelect = () => select({ kind: 'element', element: kind })

  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    if (e.target !== e.currentTarget || !takesDrag?.(e.evt)) return
    dragTaken.current = true
    e.target.stopDrag()
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (dragTaken.current) {
      dragTaken.current = false
      return
    }
    snapDragEnd(e)
    // Drags of inner parts (a stats chip) bubble up here too; those are handled where they start.
    if (e.target !== e.currentTarget) return
    setPlacement(kind, { x: e.target.x() - width / 2, y: e.target.y() - height / 2 - animation.offsetY })
  }

  return (
    <SlideBox slide={slide} id={elementNodeId({ kind: 'element', element: kind })}>
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
        onDragStart={handleDragStart}
        onDragMove={snapDragMove}
        onDragEnd={handleDragEnd}
      >
        <Rect x={-HIT_PADDING} y={-HIT_PADDING} width={width + HIT_PADDING * 2} height={height + HIT_PADDING * 2} fill="#000" opacity={0} />
        <Rect name={SNAP_BOX} width={width} height={height} listening={false} />
        {children}
        {selected && (
          <Rect
            name={UI_ONLY}
            x={-OUTLINE_PAD}
            y={-OUTLINE_PAD}
            width={width + OUTLINE_PAD * 2}
            height={height + OUTLINE_PAD * 2}
            stroke={CHROME_ACCENT}
            {...SELECTION_OUTLINE}
          />
        )}
      </Group>
    </SlideBox>
  )
}
