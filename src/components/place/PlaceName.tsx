import { useRef } from 'react'
import { Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import useInlineTextEditor from '../../hooks/useInlineTextEditor'
import { useAppStore } from '../../store/useAppStore'
import { konvaFontStyle } from '../../utils/fonts'
import type { Waypoint } from '../../types'
import SelectionOutline from '../SelectionOutline'
import type { PlaceLayout } from './placeLayout'
import { TEXT_SHADOW } from '../../core/canvas/shadows'

const PRINT_INK = '#2b2620'
const RULE_GAP = 8

function writtenOnMarker(area: NonNullable<PlaceLayout['nameOnMarker']>, fontSize: number) {
  return {
    x: area.x,
    y: area.y,
    width: area.w,
    height: area.h,
    fontSize: Math.min(fontSize, area.h * 0.75),
    fill: PRINT_INK,
    align: 'center',
    verticalAlign: 'middle',
    wrap: 'none',
    ellipsis: true,
  }
}

function standingFree(waypoint: Waypoint) {
  return { fontSize: waypoint.fontSize, fill: waypoint.color, ...TEXT_SHADOW, shadowEnabled: waypoint.shadowEnabled ?? true }
}

export default function PlaceName({ waypoint, layout, selected }: { waypoint: Waypoint; layout: PlaceLayout; selected: boolean }) {
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const { hidden, edit } = useInlineTextEditor()
  const textRef = useRef<Konva.Text>(null)
  const area = layout.nameOnMarker

  function startEditing(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    edit(e.target as Konva.Text, { value: waypoint.text, onCommit: (text) => updateWaypoint(waypoint.id, { text }) })
  }

  return (
    <Group y={area?.top} rotation={area?.rotation}>
      {layout.underlined && <Line points={[0, -RULE_GAP, layout.name.w, -RULE_GAP]} stroke={waypoint.color} strokeWidth={1.5} listening={false} />}
      <Text
        ref={textRef}
        text={waypoint.text}
        fontFamily={waypoint.fontFamily}
        fontStyle={konvaFontStyle(waypoint.fontFamily)}
        {...(area ? writtenOnMarker(area, waypoint.fontSize) : standingFree(waypoint))}
        perfectDrawEnabled={false}
        visible={!hidden}
        onDblClick={startEditing}
        onDblTap={startEditing}
      />
      <SelectionOutline targetRef={textRef} visible={selected && !hidden} />
    </Group>
  )
}
