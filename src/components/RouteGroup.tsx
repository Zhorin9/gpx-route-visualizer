import { memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Group, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useForcedGhost } from '../core/animation/layers'
import { CHROME_ACCENT } from '../core/canvas/chrome'
import { SNAP_BOX, SNAP_TARGET, snapDragEnd, snapDragMove } from '../core/canvas/snapDrag'
import { styleColoring, type RouteColoring } from '../core/route/coloring'
import { useStickerColor } from '../store/selectors'
import { routeDecorations, useProvidedColoring, useWorldView } from '../core/route/providers'
import RoutePainter from '../core/route/RoutePainter'
import { useRouteGeometry } from '../core/route/useRouteGeometry'
import { composeView, steadyStyle } from '../core/route/view'
import { useProjectedTrack } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { UI_ONLY } from '../utils/exportImage'
import { applyTransform, nearestPointOnPolyline, pointAt } from '../utils/geometry'
import { flatBounds } from '../utils/gpx'
import KmMarkers from './KmMarkers'
import SlideDots from './SlideDots'
import WaypointLabel from './place/WaypointLabel'
import type { RouteStyle, RouteTransform } from '../types'

const HIT_PADDING = 30

function readTransform(node: Konva.Node): RouteTransform {
  return { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
}

interface RouteLineProps {
  style: RouteStyle
  coloring: RouteColoring
  editable: boolean
  hitListening: boolean
  onHit: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  groupRef: RefObject<Konva.Group | null>
  transformerRef: RefObject<Konva.Transformer | null>
}

function RouteLine({ style, coloring, editable, hitListening, onHit, groupRef, transformerRef }: RouteLineProps) {
  const geometry = useRouteGeometry()
  const { active } = geometry

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    tr.nodes(editable && groupRef.current ? [groupRef.current] : [])
    tr.getLayer()?.batchDraw()
  }, [editable, active, groupRef, transformerRef])

  // The strokes alone are too thin to grab; listens only while needed, so the photo underneath stays clickable.
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

  return (
    <>
      {hitBox && <Rect {...hitBox} fill="#000" opacity={0} listening={hitListening} onClick={onHit} onTap={onHit} />}
      {/* The drawn route, without the padded hit box, is what others line up with. */}
      <Group name={SNAP_BOX}>
        <RoutePainter segments={geometry.segments} style={style} coloring={coloring} />
        {routeDecorations().map((Decoration, i) => (
          <Decoration key={i} geometry={geometry} />
        ))}
      </Group>
    </>
  )
}

function RouteGroup() {
  const ownStyle = useAppStore((s) => s.routeStyle)
  const sticker = useStickerColor(0)
  const savedStyle = useMemo(() => (sticker ? { ...ownStyle, color: sticker } : ownStyle), [ownStyle, sticker])
  const forcedGhost = useForcedGhost()
  const view = useWorldView()
  const zoom = view?.zoom ?? 1
  // The camera enlarges the route, not its strokes: widths stay as set.
  const style = useMemo(
    () => steadyStyle(forcedGhost && !savedStyle.remainingVisible ? { ...savedStyle, remainingVisible: true } : savedStyle, zoom),
    [forcedGhost, savedStyle, zoom],
  )
  const transform = composeView(useAppStore((s) => s.routeTransform), view)
  // Moving the route by hand sets where it sits in the static view, so not while the camera moves it.
  const editable = useAppStore((s) => s.routeEditable) && !view
  const adding = useAppStore((s) => s.addingWaypoint)
  const range = useAppStore((s) => s.range)
  const waypoints = useAppStore((s) => s.waypoints)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  const addWaypoint = useAppStore((s) => s.addWaypoint)

  const projected = useProjectedTrack()
  const provided = useProvidedColoring()
  const coloring = useMemo(() => provided ?? styleColoring(style), [provided, style])

  const groupRef = useRef<Konva.Group>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

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
        name={SNAP_TARGET}
        draggable={editable}
        onDragMove={(e) => {
          snapDragMove(e)
          syncTransform(e)
        }}
        onDragEnd={(e) => {
          snapDragEnd(e)
          syncTransform(e)
        }}
        onTransform={syncTransform}
        onTransformEnd={syncTransform}
      >
        <RouteLine
          style={style}
          coloring={coloring}
          editable={editable}
          hitListening={adding || editable}
          onHit={handleHitClick}
          groupRef={groupRef}
          transformerRef={transformerRef}
        />
      </Group>

      {projected &&
        waypoints
          .filter((wp) => wp.trackPos >= range.start && wp.trackPos <= range.end)
          .map((wp) => (
          <WaypointLabel key={wp.id} waypoint={wp} anchor={applyTransform(pointAt(projected, wp.trackPos), transform)} />
        ))}

      <KmMarkers />
      {projected && <SlideDots projected={projected} transform={transform} />}

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

export default memo(RouteGroup)
