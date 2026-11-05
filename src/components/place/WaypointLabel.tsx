import { useState } from 'react'
import { Group } from 'react-konva'
import { usePointAnimation } from '../../core/animation/layers'
import { useAppStore } from '../../store/useAppStore'
import type { Point2D } from '../../utils/geometry'
import type { Waypoint } from '../../types'
import AnchorSymbol from './AnchorSymbol'
import LeaderLine from './LeaderLine'
import PinnedPhoto from './PinnedPhoto'
import PlaceName from './PlaceName'
import { placeLayout } from './placeLayout'

export interface WaypointLabelProps {
  waypoint: Waypoint
  anchor: Point2D
}

// Lives outside the route group on purpose: rotating or scaling the route
// moves the label with it, but the text itself stays upright and legible.
export default function WaypointLabel({ waypoint, anchor }: WaypointLabelProps) {
  const photo = useAppStore((s) => s.photos.find((p) => p.id === waypoint.photoId))
  const pointStyle = useAppStore((s) => s.pointStyle)
  const selected = useAppStore((s) => s.selection?.kind === 'waypoint' && s.selection.id === waypoint.id)
  const select = useAppStore((s) => s.select)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)
  const animation = usePointAnimation(waypoint.trackPos)
  const [dragged, setDragged] = useState<{ x: number; y: number } | null>(null)

  const layout = placeLayout(waypoint, photo, pointStyle)
  const offset = dragged ?? { x: waypoint.dx, y: waypoint.dy }
  const selectThis = () => select({ kind: 'waypoint', id: waypoint.id })

  return (
    <Group x={anchor.x} y={anchor.y + animation.offsetY} opacity={animation.opacity}>
      <LeaderLine element={layout.leader} offset={offset} color={waypoint.color} shadow={waypoint.shadowEnabled ?? true} />
      <AnchorSymbol kind={waypoint.kind} color={waypoint.color} />
      <Group
        x={offset.x}
        y={offset.y}
        draggable
        onMouseDown={selectThis}
        onTouchStart={selectThis}
        onDragMove={(e) => setDragged({ x: e.target.x(), y: e.target.y() })}
        onDragEnd={(e) => {
          updateWaypoint(waypoint.id, { dx: e.target.x(), dy: e.target.y() })
          setDragged(null)
        }}
      >
        {layout.marker && <PinnedPhoto pinned={layout.marker} waypoint={waypoint} />}
        <PlaceName waypoint={waypoint} layout={layout} selected={selected} />
      </Group>
    </Group>
  )
}
