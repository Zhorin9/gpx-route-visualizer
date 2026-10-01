import { useEffect, useMemo, useRef } from 'react'
import { Group, Line, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { schematicLines } from '../store/derived'
import { useProjectedTrack, useRouteLines } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { UI_ONLY } from '../utils/exportImage'
import { applyTransform, nearestPointOnPolyline, pointAt } from '../utils/geometry'
import { flatBounds } from '../utils/gpx'
import WaypointLabel from './WaypointLabel'
import type { RouteTransform } from '../types'

const HIT_PADDING = 30

function readTransform(node: Konva.Node): RouteTransform {
  return { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
}

export default function NeonRouteGroup() {
  const style = useAppStore((s) => s.routeStyle)
  const transform = useAppStore((s) => s.routeTransform)
  const editable = useAppStore((s) => s.routeEditable)
  const adding = useAppStore((s) => s.addingWaypoint)
  const range = useAppStore((s) => s.range)
  const waypoints = useAppStore((s) => s.waypoints)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const addWaypoint = useAppStore((s) => s.addWaypoint)

  const projected = useProjectedTrack()
  const { active, completed, remaining } = useRouteLines()
  const schematic = style.shape === 'schematic' ? schematicLines(active, style.schematicSimplify) : null

  const groupRef = useRef<Konva.Group>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    tr.nodes(editable && groupRef.current ? [groupRef.current] : [])
    tr.getLayer()?.batchDraw()
  }, [editable, active])

  // Invisible rect over the route's bounds: the strokes alone are too thin to
  // reliably grab. Only listens while needed, so it doesn't block the photo underneath.
  const hitBox = useMemo(() => {
    if (active.length < 4) return null
    const b = flatBounds(active)
    return {
      x: b.minX - HIT_PADDING,
      y: b.minY - HIT_PADDING,
      width: b.maxX - b.minX + HIT_PADDING * 2,
      height: b.maxY - b.minY + HIT_PADDING * 2,
    }
  }, [active])

  function handleHitClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!adding || !projected || !groupRef.current) return
    const pos = groupRef.current.getRelativePointerPosition()
    if (!pos) return
    const hit = nearestPointOnPolyline(projected, pos.x, pos.y, range.start, range.end)
    if (hit) addWaypoint(hit.pos)
    e.cancelBubble = true
  }

  const syncTransform = (e: Konva.KonvaEventObject<Event>) => setRouteTransform(readTransform(e.target))

  const glowProps = {
    stroke: style.color,
    strokeWidth: style.glowWidth,
    opacity: 0.8,
    shadowColor: style.color,
    shadowBlur: style.glowBlur,
    shadowOpacity: 1,
    listening: false,
    perfectDrawEnabled: false,
  }
  const coreProps = { stroke: style.color, strokeWidth: style.coreWidth, listening: false, perfectDrawEnabled: false }
  const round = { lineCap: 'round', lineJoin: 'round' } as const
  const square = { lineCap: 'square', lineJoin: 'miter' } as const

  return (
    <>
      <Group
        ref={groupRef}
        {...transform}
        draggable={editable}
        onDragMove={syncTransform}
        onDragEnd={syncTransform}
        onTransform={syncTransform}
        onTransformEnd={syncTransform}
      >
        {hitBox && (
          <Rect
            {...hitBox}
            fill="#000"
            opacity={0}
            listening={adding || editable}
            onClick={handleHitClick}
            onTap={handleHitClick}
          />
        )}

        {schematic ? (
          <>
            {style.glowEnabled && schematic.length > 0 && <Line points={schematic} {...glowProps} {...square} />}
            {schematic.length > 0 && <Line points={schematic} {...coreProps} {...square} />}
          </>
        ) : (
          <>
            {style.remainingVisible && remaining.length > 2 && (
              <Line
                points={remaining}
                stroke={style.remainingColor}
                strokeWidth={style.remainingWidth}
                opacity={style.remainingOpacity}
                dash={style.remainingDashed ? [style.remainingWidth * 4, style.remainingWidth * 2] : undefined}
                listening={false}
                perfectDrawEnabled={false}
                {...round}
              />
            )}
            {style.glowEnabled && completed.length > 2 && <Line points={completed} {...glowProps} {...round} />}
            {completed.length > 2 && <Line points={completed} {...coreProps} {...round} />}
          </>
        )}
      </Group>

      {projected &&
        waypoints
          .filter((wp) => wp.trackPos >= range.start && wp.trackPos <= range.end)
          .map((wp) => (
          <WaypointLabel key={wp.id} waypoint={wp} anchor={applyTransform(pointAt(projected, wp.trackPos), transform)} />
        ))}

      {editable && (
        <Transformer
          ref={transformerRef}
          name={UI_ONLY}
          rotateEnabled
          rotationSnaps={[0, 90, 180, 270]}
          anchorStroke="#4f9dff"
          anchorFill="#ffffff"
          borderStroke="#4f9dff"
          borderDash={[6, 4]}
        />
      )}
    </>
  )
}
