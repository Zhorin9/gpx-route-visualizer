import { useEffect, useState } from 'react'
import { Circle, Image as KonvaImage, Path } from 'react-konva'
import type { RouteGeometry } from '../../../core/route/geometry'
import { useProvidedColoring, useWorldView } from '../../../core/route/providers'
import { selectRouteParts } from '../../../store/derived'
import { useProjectedTrack } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
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

function VehiclePicture({ art, x, y, rotation, length }: { art: string; x: number; y: number; rotation: number; length: number }) {
  const picture = usePicture(art)
  if (!picture) return null
  return <KonvaImage image={picture} x={x} y={y} width={length} height={length / 2} offsetX={length / 2} offsetY={length / 4} rotation={rotation} listening={false} />
}

// What travels at the tip of the line while it is being drawn: a glowing dot or a vehicle
// pointing the way, in the colour under it. Each part of the route may have its own.
export default function RouteHeadMarker({ geometry }: { geometry: RouteGeometry }) {
  const enabled = useAppStore((s) => s.animation.headDot)
  const fallback = useAppStore((s) => s.animation.vehicle)
  const routeColor = useAppStore((s) => s.routeStyle.color)
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
  const color = coloring?.kind === 'perPoint' ? coloring.at(head.pos) : parts.length > 1 && part ? part.color : routeColor
  const vehicle = vehicleFor(part?.vehicle ?? fallback)

  if (vehicle.art) return <VehiclePicture art={vehicle.art} x={head.x} y={head.y} rotation={headingAt(projected, head.pos)} length={size * ART_PER_SIZE} />

  if (!vehicle.path) {
    return (
      <>
        <Circle x={head.x} y={head.y} radius={size * 1.8} fill={color} opacity={0.35} shadowColor={color} shadowBlur={glowBlur * 1.2} shadowOpacity={1} listening={false} />
        <Circle x={head.x} y={head.y} radius={size} fill="#ffffff" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={1} listening={false} />
      </>
    )
  }

  const { rotation, flip } = vehiclePose(vehicle, headingAt(projected, head.pos), turn)
  const scale = size / UNITS_PER_SIZE
  const pose = { x: head.x, y: head.y, data: vehicle.path, rotation, scaleX: scale, scaleY: flip ? -scale : scale, strokeScaleEnabled: false, listening: false }
  // A white edge keeps the marker readable on any background; the glow follows the route's.
  return vehicle.outline ? (
    <>
      <Path {...pose} stroke="#ffffff" strokeWidth={6} lineCap="round" lineJoin="round" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={0.8} />
      <Path {...pose} stroke={color} strokeWidth={3} lineCap="round" lineJoin="round" />
    </>
  ) : (
    <Path {...pose} fill={color} stroke="#ffffff" strokeWidth={2} lineJoin="round" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={0.8} />
  )
}
