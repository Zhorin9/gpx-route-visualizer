import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { lngLatAt } from '../../map/model/placement'
import { panFrame, scaleFrame } from '../model/frame'
import { useAppStore } from '../../../store/useAppStore'
import { mercatorX, mercatorY, type MercatorFit } from '../../../utils/gpx'
import type { RouteTransform } from '../../../types'

// What the graphic shows, drawn on the planning map: the frame's outline, the rest of the map dimmed.
// Dragging its label moves the frame over the map, the corner scales it; both move the route on the graphic.
export default function FrameOutline({ map, fit, width, height, label }: { map: MapLibreMap; fit: MercatorFit; width: number; height: number; label: string }) {
  const transform = useAppStore((s) => s.routeTransform)
  const setRouteTransform = useAppStore((s) => s.setRouteTransform)
  // Drawn again as the map pans and zooms under it.
  const [, setMoved] = useState(0)
  useEffect(() => {
    const redraw = () => setMoved((n) => n + 1)
    map.on('move', redraw)
    return () => void map.off('move', redraw)
  }, [map])

  const corner = (x: number, y: number) => map.project(lngLatAt(fit, transform, { x, y }))
  const tl = corner(0, 0)
  const tr = corner(width, 0)
  const bl = corner(0, height)
  const w = Math.hypot(tr.x - tl.x, tr.y - tl.y)
  const h = Math.hypot(bl.x - tl.x, bl.y - tl.y)
  const angle = (Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180) / Math.PI

  // Follows the pointer from where it was pressed until it is let go.
  function track(e: ReactPointerEvent, move: (from: { x: number; y: number }, to: { x: number; y: number }, start: RouteTransform) => RouteTransform) {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const box = map.getContainer().getBoundingClientRect()
    const from = { x: e.clientX - box.left, y: e.clientY - box.top }
    const start = transform
    const onMove = (ev: PointerEvent) => setRouteTransform(move(from, { x: ev.clientX - box.left, y: ev.clientY - box.top }, start))
    const onUp = () => {
      target.removeEventListener('pointermove', onMove as EventListener)
      target.removeEventListener('pointerup', onUp)
    }
    target.addEventListener('pointermove', onMove as EventListener)
    target.addEventListener('pointerup', onUp)
  }

  // The map pixels the pointer moved, as a shift of the world in Web Mercator.
  function shift(from: { x: number; y: number }, to: { x: number; y: number }) {
    const a = map.unproject([from.x, from.y])
    const b = map.unproject([to.x, to.y])
    return { x: mercatorX(b.lng) - mercatorX(a.lng), y: mercatorY(b.lat) - mercatorY(a.lat) }
  }

  // The frame's middle on the map, which scaling keeps in place.
  const middle = { x: (bl.x + tr.x) / 2, y: (bl.y + tr.y) / 2 }

  return (
    <div className="frame-outline" style={{ left: tl.x, top: tl.y, width: w, height: h, transform: `rotate(${angle}deg)` }}>
      <button type="button" className="frame-outline-label" onPointerDown={(e) => track(e, (from, to, start) => panFrame(start, fit, shift(from, to)))}>
        {label} · przeciągnij
      </button>
      <span
        className="frame-outline-handle"
        role="slider"
        aria-label="Wielkość kadru na mapie"
        aria-valuenow={Math.round(w)}
        onPointerDown={(e) =>
          track(e, (from, to, start) => {
            const factor = Math.hypot(to.x - middle.x, to.y - middle.y) / Math.max(1, Math.hypot(from.x - middle.x, from.y - middle.y))
            return scaleFrame(start, Math.max(0.05, factor), { x: width / 2, y: height / 2 })
          })
        }
      />
    </div>
  )
}
