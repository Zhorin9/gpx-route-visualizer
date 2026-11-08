import { Group, Rect } from 'react-konva'
import { useLayerAnimation } from '../../core/animation/layers'
import { CHROME_ACCENT, SELECTION_OUTLINE } from '../../core/canvas/chrome'
import { SNAP_TARGET, snapDragEnd, snapDragMove } from '../../core/canvas/snapDrag'
import { useSlideAt, useStickerColor } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { UI_ONLY } from '../../utils/exportImage'
import SlideBox from '../SlideBox'
import IconGlyph from './IconGlyph'
import useIconLook from './useIconLook'
import type { TextNode } from '../../types'

const PAD = 8

// A text whose glyphs are an icon: x and y are its centre, fontSize its width.
export default function LooseIcon({ node }: { node: TextNode }) {
  const selected = useAppStore((s) => s.selection?.kind === 'text' && s.selection.id === node.id)
  const select = useAppStore((s) => s.select)
  const updateText = useAppStore((s) => s.updateText)
  const animation = useLayerAnimation('header')
  const slide = useSlideAt(node.x)
  const color = useStickerColor(slide) ?? node.color
  const { finish, paper } = useIconLook()
  if (!node.icon) return null
  const size = node.fontSize
  const onSelect = () => select({ kind: 'text', id: node.id })

  return (
    <SlideBox slide={slide}>
      <Group
        x={node.x}
        y={node.y + animation.offsetY}
        rotation={node.rotation}
        opacity={node.opacity * animation.opacity}
        name={SNAP_TARGET}
        draggable
        onMouseDown={onSelect}
        onTouchStart={onSelect}
        onDragMove={snapDragMove}
        onDragEnd={(e) => {
          snapDragEnd(e)
          updateText(node.id, { x: e.target.x(), y: e.target.y() - animation.offsetY })
        }}
      >
        {/* Catches clicks between the strokes. */}
        <Rect x={-size / 2} y={-size / 2} width={size} height={size} fill="transparent" />
        <IconGlyph icon={node.icon} size={size} finish={finish} color={color} paper={paper} />
        {selected && <Rect name={UI_ONLY} x={-size / 2 - PAD} y={-size / 2 - PAD} width={size + PAD * 2} height={size + PAD * 2} stroke={CHROME_ACCENT} {...SELECTION_OUTLINE} />}
      </Group>
    </SlideBox>
  )
}
