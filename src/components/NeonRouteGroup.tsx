import { useEffect, useMemo, useRef } from 'react'
import { Group, Line, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { schematicLines } from '../store/derived'
import { useProjectedTrack, useRouteLines } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { UI_ONLY } from '../utils/exportImage'
import { applyTransform, decimate, nearestPointOnPolyline, pointAt } from '../utils/geometry'
import { schematicizeRoute } from '../utils/schematicRoute'
import { flatBounds } from '../utils/gpx'
import KmMarkers from './KmMarkers'
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
  const days = useAppStore((s) => s.routeDays)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const addWaypoint = useAppStore((s) => s.addWaypoint)

  const projected = useProjectedTrack()
  const { active, completed, remaining } = useRouteLines()
  const schematic = style.shape === 'schematic' ? schematicLines(active, style.schematicSimplify) : null

  // Several GPX files: every visible day is its own line with its own colour and dash.
  const dayLines = useMemo(() => {
    if (days.length < 2 || !projected) return null
    return days
      .filter((d) => d.visible)
      .map((day) => {
        const from = Math.max(range.start, day.startIdx)
        const to = Math.min(range.end, day.endIdx)
        const line = to > from ? decimate(projected, from, to) : []
        const points = style.shape === 'schematic' && line.length >= 4 ? schematicizeRoute(line, { simplify: style.schematicSimplify }) : line
        return { day, points }
      })
  }, [days, projected, range.start, range.end, style.shape, style.schematicSimplify])

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
  const coreProps = {
    stroke: style.color,
    strokeWidth: style.coreWidth,
    dash: style.dashed ? [style.coreWidth * 3, style.coreWidth * 2] : undefined,
    listening: false,
    perfectDrawEnabled: false,
  }
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

        {dayLines ? (
          dayLines.map(({ day, points }) => {
            if (points.length < 4) return null
            const cap = style.shape === 'schematic' ? square : round
            return (
              <Group key={day.id}>
                {style.glowEnabled && <Line points={points} {...glowProps} stroke={day.color} shadowColor={day.color} {...cap} />}
                <Line
                  points={points}
                  {...coreProps}
                  stroke={day.color}
                  dash={day.dashed ? [style.coreWidth * 3, style.coreWidth * 2] : undefined}
                  {...cap}
                />
              </Group>
            )
          })
        ) : schematic ? (
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

      <KmMarkers />

      {editable && (
        <Transformer
          ref={transformerRef}
          name={UI_ONLY}
          rotateEnabled
          rotationSnaps={[0, 90, 180, 270]}
          anchorStroke="#b68235"
          anchorFill="#ffffff"
          borderStroke="#b68235"
          borderDash={[6, 4]}
        />
      )}
    </>
  )
}
