import { useRef } from 'react'
import { Circle, Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import { usePointAnimation } from '../core/animation/layers'
import useInlineTextEditor from '../hooks/useInlineTextEditor'
import { sketchPalette } from '../features/map/sketch/draw'
import { useAppStore } from '../store/useAppStore'
import { konvaFontStyle } from '../utils/fonts'
import { measureTextWidth } from '../utils/measureText'
import { leaderEnd, unionBox, type Box } from '../utils/leader'
import PinnedPhoto from './PinnedPhoto'
import { photoBox } from './photoMarker'
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
  const routeStyle = useAppStore((s) => s.routeStyle)
  // On the sketch map a photo is outlined in the paper's colour, cut out of the drawing.
  const outline = useAppStore((s) => (s.collage.bgKind === 'map' && s.map.kind === 'sketch' ? sketchPalette(s.map).paper : waypoint.color))
  const { hidden, edit } = useInlineTextEditor()
  const textRef = useRef<Konva.Text>(null)
  const leaderRef = useRef<Konva.Line>(null)
  const { dx, dy } = waypoint
  const shadow = waypoint.shadowEnabled ?? true
  const animation = usePointAnimation(waypoint.trackPos)

  // The whole label, its photo and its name, in its own pixels; the leader aims at its middle.
  const font = konvaFontStyle(waypoint.fontFamily)
  const lines = waypoint.text.split('\n')
  const textBox: Box = { x: 0, y: 0, w: Math.max(...lines.map((l) => measureTextWidth(l, waypoint.fontFamily, waypoint.fontSize, font))), h: lines.length * waypoint.fontSize }
  const gap = waypoint.fontSize * 0.4
  const pictured = photo ? photoBox(pointStyle, gap) : null
  // A photo without a name: the line goes to the photo alone.
  const named = waypoint.text.trim() !== ''
  const box = pictured ? (named ? unionBox(pictured, textBox) : pictured) : textBox
  const leaderWidth = Math.max(1.5, routeStyle.coreWidth / 2)
  const leader = (x: number, y: number) => {
    const end = leaderEnd({ ...box, x: box.x + x, y: box.y + y })
    return end ? [0, 0, ...end] : []
  }

  function startEditing(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    edit(e.target as Konva.Text, { value: waypoint.text, onCommit: (text) => updateWaypoint(waypoint.id, { text }) })
  }

  const onSelect = () => select({ kind: 'waypoint', id: waypoint.id })

  return (
    <Group x={anchor.x} y={anchor.y + animation.offsetY} opacity={animation.opacity}>
      <Line
        ref={leaderRef}
        points={leader(dx, dy)}
        stroke={waypoint.color}
        // Solid, dashed or dotted like the route, at half its width.
        strokeWidth={leaderWidth}
        dash={routeStyle.dotted ? [0.1, leaderWidth * 2.4] : routeStyle.dashed ? [leaderWidth * 3, leaderWidth * 2] : undefined}
        lineCap="round"
        opacity={0.85}
        shadowColor="#000000"
        shadowBlur={4}
        shadowOpacity={0.5}
        shadowEnabled={shadow}
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
          leaderRef.current?.points(leader(e.target.x(), e.target.y()))
        }}
        onDragEnd={(e) => updateWaypoint(waypoint.id, { dx: e.target.x(), dy: e.target.y() })}
      >
        {photo && (
          <PinnedPhoto photo={photo} style={pointStyle} color={outline} gap={gap} crop={waypoint.photoCrop} onCrop={(photoCrop) => updateWaypoint(waypoint.id, { photoCrop })} />
        )}
        {photo && pointStyle.marker === 'label' && named && (
          <Line
            points={[0, -8, measureTextWidth(lines[0], waypoint.fontFamily, waypoint.fontSize, font), -8]}
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
          shadowEnabled={shadow}
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
