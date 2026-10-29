import type { ReactNode } from 'react'
import { Group } from 'react-konva'
import { FORMATS } from '../core/formats/registry'
import { useSlideBox } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

// Draws a slide's content into the box its wrapper leaves; the children keep their ribbon coordinates.
export default function SlideBox({ slide, children }: { slide: number; children: ReactNode }) {
  const { w, h } = FORMATS[useAppStore((s) => s.aspectKey)]
  const box = useSlideBox(slide) ?? { x: 0, y: 0, w, h, rotation: 0 }
  const scale = box.w / w
  return (
    <Group x={slide * w + box.x + box.w / 2} y={box.y + box.h / 2} offsetX={slide * w + w / 2} offsetY={h / 2} scaleX={scale} scaleY={scale} rotation={box.rotation}>
      {children}
    </Group>
  )
}
