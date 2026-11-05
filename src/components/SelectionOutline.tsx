import { useEffect, useRef } from 'react'
import { Rect } from 'react-konva'
import type Konva from 'konva'
import type { RefObject } from 'react'
import { CHROME_ACCENT, SELECTION_OUTLINE } from '../core/canvas/chrome'
import { UI_ONLY } from '../utils/exportImage'

export interface SelectionOutlineProps {
  targetRef: RefObject<Konva.Shape | null>
  visible: boolean
  color?: string
}

// Copies the target's x/y/rotation, so it must sit in the target's parent.
export default function SelectionOutline({ targetRef, visible, color = CHROME_ACCENT }: SelectionOutlineProps) {
  const rectRef = useRef<Konva.Rect>(null)

  useEffect(() => {
    const rect = rectRef.current
    const target = targetRef.current
    if (!rect) return
    if (!visible || !target) {
      rect.visible(false)
      return
    }
    const self = target.getSelfRect()
    const pad = 6
    rect.setAttrs({
      x: target.x(),
      y: target.y(),
      rotation: target.rotation(),
      offsetX: -self.x + pad,
      offsetY: -self.y + pad,
      width: self.width + pad * 2,
      height: self.height + pad * 2,
      visible: true,
    })
    rect.getLayer()?.batchDraw()
  })

  return (
    <Rect
      ref={rectRef}
      name={UI_ONLY}
      stroke={color}
      {...SELECTION_OUTLINE}
      visible={false}
    />
  )
}
