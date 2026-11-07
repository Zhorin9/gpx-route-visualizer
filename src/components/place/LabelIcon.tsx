import { Group, Rect } from 'react-konva'
import { CHROME_ACCENT, SELECTION_OUTLINE } from '../../core/canvas/chrome'
import { UI_ONLY } from '../../utils/exportImage'
import IconGlyph from './IconGlyph'
import useIconLook from './useIconLook'
import type { IconId } from './icons'

const PAD = 6

// A place's icon where its name would stand: the box's top-left is where the name's would be.
export default function LabelIcon({ icon, size, color, selected }: { icon: IconId; size: number; color: string; selected: boolean }) {
  const look = useIconLook()
  return (
    <Group>
      {/* Catches clicks between the strokes, so the icon drags like a name. */}
      <Rect width={size} height={size} fill="transparent" />
      <Group x={size / 2} y={size / 2} listening={false}>
        <IconGlyph icon={icon} size={size} color={color} {...look} />
      </Group>
      {selected && <Rect name={UI_ONLY} x={-PAD} y={-PAD} width={size + PAD * 2} height={size + PAD * 2} stroke={CHROME_ACCENT} {...SELECTION_OUTLINE} />}
    </Group>
  )
}
