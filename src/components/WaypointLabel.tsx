import { useRef } from 'react'
import { Circle, Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import { usePointAnimation } from '../core/animation/layers'
import useInlineTextEditor from '../hooks/useInlineTextEditor'
import { useAppStore } from '../store/useAppStore'
import { konvaFontStyle } from '../utils/fonts'
import { measureTextWidth } from '../utils/measureText'
import PinnedPhoto from './PinnedPhoto'
import SelectionOutline from './SelectionOutline'
import type { Point2D } from '../utils/geometry'
import type { Waypoint } from '../types'

export interface WaypointLabelProps {
  waypoint: Waypoint
  // Anchor on the route, already in stage coordinates.
  anchor: Point2D
}

const PEAK_SHAPE = [-9, 7, 0, -9, 9, 7]
const PASS_SHAPE = [-11, 7, -4, -5, 0, 1, 4, -7, 11, 7]

// Lives outside the route group on purpose: rotating or scaling the route
// moves the label with it, but the text itself stays upright and legible.
export default function WaypointLabel({ waypoint, anchor }: WaypointLabelProps) {
  const isSelected = useAppStore((s) => s.selection?.kind === 'waypoint' && s.selection.id === waypoint.id)
  const select = useAppStore((s) => s.select)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const photo = useAppStore((s) => (waypoint.photoId == null ? undefined : s.photos.find((p) => p.id === waypoint.photoId)))
  const pointStyle = useAppStore((s) => s.pointStyle)
  const { hidden, edit } = useInlineTextEditor()
  const textRef = useRef<Konva.Text>(null)
  const leaderRef = useRef<Konva.Line>(null)
  const { dx, dy } = waypoint
  const animation = usePointAnimation(waypoint.trackPos)

  function startEditing(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    edit(e.target as Konva.Text, { value: waypoint.text, onCommit: (text) => updateWaypoint(waypoint.id, { text }) })
  }

  const onSelect = () => select({ kind: 'waypoint', id: waypoint.id })

  return (
    <Group x={anchor.x} y={anchor.y + animation.offsetY} opacity={animation.opacity}>
      <Line
        ref={leaderRef}
        points={[0, 0, dx, dy + waypoint.fontSize / 2]}
        stroke={waypoint.color}
        strokeWidth={1.5}
        opacity={0.7}
        shadowColor="#000000"
        shadowBlur={4}
        shadowOpacity={0.5}
        listening={false}
      />
      {waypoint.kind === 'point' ? (
        <Circle radius={6} fill={waypoint.color} stroke="#000000" strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
      ) : (
        <Line
          points={waypoint.kind === 'peak' ? PEAK_SHAPE : PASS_SHAPE}
          closed
          fill={waypoint.color}
          stroke="#000000"
          strokeWidth={1.5}
          lineJoin="round"
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
      <Group
        x={dx}
        y={dy}
        draggable
        onMouseDown={onSelect}
        onTouchStart={onSelect}
        onDragMove={(e) => {
          leaderRef.current?.points([0, 0, e.target.x(), e.target.y() + waypoint.fontSize / 2])
        }}
        onDragEnd={(e) => updateWaypoint(waypoint.id, { dx: e.target.x(), dy: e.target.y() })}
      >
        {photo && <PinnedPhoto photo={photo} style={pointStyle} color={waypoint.color} gap={waypoint.fontSize * 0.4} />}
        {photo && pointStyle.marker === 'label' && (
          <Line
            points={[0, -8, measureTextWidth(waypoint.text.split('\n')[0], waypoint.fontFamily, waypoint.fontSize, konvaFontStyle(waypoint.fontFamily)), -8]}
            stroke={waypoint.color}
            strokeWidth={1.5}
            listening={false}
          />
        )}
        <Text
          ref={textRef}
          text={waypoint.text}
          fontFamily={waypoint.fontFamily}
          fontStyle={konvaFontStyle(waypoint.fontFamily)}
          fontSize={waypoint.fontSize}
          fill={waypoint.color}
          shadowColor="#000000"
          shadowBlur={8}
          shadowOpacity={0.6}
          perfectDrawEnabled={false}
          visible={!hidden}
          onDblClick={startEditing}
          onDblTap={startEditing}
        />
        <SelectionOutline targetRef={textRef} visible={isSelected && !hidden} />
      </Group>
    </Group>
  )
}
