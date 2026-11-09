import { useEffect, useState } from 'react'
import { Circle, Image as KonvaImage, Path } from 'react-konva'
import type { RouteGeometry } from '../../../core/route/geometry'
import { useProvidedColoring, useWorldView } from '../../../core/route/providers'
import { selectRouteParts } from '../../../store/derived'
import { useProjectedTrack } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { lookFits, markerArt, markerColor, markerOf, markerShadowOn } from '../markers'
import { artUrl } from '../vehicleArt'
import { headingAt, vehicleFor, vehiclePose } from '../vehicles'

// The marker spans 24 path units; at the default head size it is about 40 px long.
const UNITS_PER_SIZE = 5
// An illustrated vehicle is this many head sizes long (about 60 px at the default size).
const ART_PER_SIZE = 7

// Illustrations decoded once and kept; the marker shows once its picture has loaded.
const pictures = new Map<string, HTMLImageElement>()

function usePicture(art: string): HTMLImageElement | null {
  const [, setLoaded] = useState(0)
  let picture = pictures.get(art)
  if (!picture) {
    picture = new window.Image()
    picture.src = artUrl(art)
    pictures.set(art, picture)
  }
  useEffect(() => {
    if (picture.complete) return
    const loaded = () => setLoaded((n) => n + 1)
    picture.addEventListener('load', loaded)
    return () => picture.removeEventListener('load', loaded)
  }, [picture])
  return picture.complete && picture.naturalWidth ? picture : null
}

function VehiclePicture({ art, x, y, rotation, length, mirror }: { art: string; x: number; y: number; rotation: number; length: number; mirror: boolean }) {
  const picture = usePicture(art)
  if (!picture) return null
  return <KonvaImage image={picture} x={x} y={y} width={length} height={length / 2} offsetX={length / 2} offsetY={length / 4} rotation={rotation} scaleX={mirror ? -1 : 1} listening={false} />
}

export default function RouteHeadMarker({ geometry }: { geometry: RouteGeometry }) {
  const enabled = useAppStore((s) => s.animation.headDot)
  const fallback = useAppStore((s) => s.animation.vehicle)
  const settings = useAppStore((s) => s.animation)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const styleColor = useAppStore((s) => s.statsStyle.color)
  const glowBlur = useAppStore((s) => s.routeStyle.glowBlur)
  const turn = useAppStore((s) => s.routeTransform.rotation)
  // Inside the route group, which the camera enlarges: the marker keeps its size on screen.
  const size = useAppStore((s) => s.animation.headSize) / (useWorldView()?.zoom ?? 1)
  const parts = useAppStore(selectRouteParts)
  const projected = useProjectedTrack()
  const coloring = useProvidedColoring()
  const head = geometry.head
  if (!enabled || !head || !projected) return null

  const part = parts.find((p) => head.pos >= p.startIdx && head.pos < p.endIdx + 1)
  const lineColor = coloring?.kind === 'perPoint' ? coloring.at(head.pos) : parts.length > 1 && part ? part.color : routeColor
  const vehicle = vehicleFor(part?.vehicle ?? fallback)
  const marker = markerOf(settings)
  const look = lookFits(vehicle, marker.look) ? marker.look : vehicle.art ? 'art' : 'side'
  const heading = headingAt(projected, head.pos)
  const scale = settings.vehicleScale ?? 1
  // Upright: level on the frame, facing the way it goes.
  const west = Math.cos(((heading + turn) * Math.PI) / 180) < 0
  const upright = look === 'badge' || Boolean(settings.vehicleUpright)

  const art = look === 'side' ? null : markerArt(vehicle, look, markerColor(marker.color, { style: styleColor, route: lineColor }), markerShadowOn(settings, look), marker.color == null)
  if (art) {
    return <VehiclePicture art={art} x={head.x} y={head.y} rotation={upright ? -turn : heading} mirror={upright && west && look !== 'badge'} length={size * ART_PER_SIZE * scale} />
  }

  if (!vehicle.path) {
    return (
      <>
        <Circle x={head.x} y={head.y} radius={size * 1.8} fill={lineColor} opacity={0.35} shadowColor={lineColor} shadowBlur={glowBlur * 1.2} shadowOpacity={1} listening={false} />
        <Circle x={head.x} y={head.y} radius={size} fill="#ffffff" shadowColor={lineColor} shadowBlur={glowBlur} shadowOpacity={1} listening={false} />
      </>
    )
  }

  // An outline with no colour picked keeps the line's, as it always had.
  const color = marker.color == null ? lineColor : markerColor(marker.color, { style: styleColor, route: lineColor })
  const pose = upright ? { rotation: -turn, flip: false } : vehiclePose(vehicle, heading, turn)
  const unit = (size * scale) / UNITS_PER_SIZE
  const mirror = upright && west
  const path = { x: head.x, y: head.y, data: vehicle.path, rotation: pose.rotation, scaleX: mirror ? -unit : unit, scaleY: pose.flip ? -unit : unit, strokeScaleEnabled: false, listening: false }
  // A white edge keeps the marker readable on any background; the glow follows the route's.
  return vehicle.outline ? (
    <>
      <Path {...path} stroke="#ffffff" strokeWidth={6} lineCap="round" lineJoin="round" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={0.8} />
      <Path {...path} stroke={color} strokeWidth={3} lineCap="round" lineJoin="round" />
    </>
  ) : (
    <Path {...path} fill={color} stroke="#ffffff" strokeWidth={2} lineJoin="round" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={0.8} />
  )
}
