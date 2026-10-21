import { useEffect, useMemo, useRef } from 'react'
import { Group, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useForcedGhost } from '../core/animation/layers'
import { CHROME_ACCENT } from '../core/canvas/chrome'
import { styleColoring } from '../core/route/coloring'
import { routeDecorations, useProvidedColoring } from '../core/route/providers'
import RoutePainter from '../core/route/RoutePainter'
import { useRouteGeometry } from '../core/route/useRouteGeometry'
import { useProjectedTrack } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { UI_ONLY } from '../utils/exportImage'
import { applyTransform, nearestPointOnPolyline, pointAt } from '../utils/geometry'
import { flatBounds } from '../utils/gpx'
import KmMarkers from './KmMarkers'
import WaypointLabel from './WaypointLabel'
import type { RouteTransform } from '../types'

const HIT_PADDING = 30

function readTransform(node: Konva.Node): RouteTransform {
  return { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
}

// The route on the frame: moving, scaling and rotating it, adding places by clicking it.
// What is drawn comes from the geometry, how it looks from the painter.
export default function RouteGroup() {
  const savedStyle = useAppStore((s) => s.routeStyle)
  const forcedGhost = useForcedGhost()
  const style = useMemo(() => (forcedGhost && !savedStyle.remainingVisible ? { ...savedStyle, remainingVisible: true } : savedStyle), [forcedGhost, savedStyle])
  const transform = useAppStore((s) => s.routeTransform)
  const editable = useAppStore((s) => s.routeEditable)
  const adding = useAppStore((s) => s.addingWaypoint)
  const range = useAppStore((s) => s.range)
  const waypoints = useAppStore((s) => s.waypoints)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const addWaypoint = useAppStore((s) => s.addWaypoint)

  const projected = useProjectedTrack()
  const geometry = useRouteGeometry()
  const provided = useProvidedColoring()
  const coloring = useMemo(() => provided ?? styleColoring(style), [provided, style])
  const { active } = geometry

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
        <RoutePainter segments={geometry.segments} style={style} coloring={coloring} />
        {routeDecorations().map((Decoration, i) => (
          <Decoration key={i} geometry={geometry} />
        ))}
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
          anchorStroke={CHROME_ACCENT}
          anchorFill="#ffffff"
          borderStroke={CHROME_ACCENT}
          borderDash={[6, 4]}
        />
      )}
    </>
  )
}
