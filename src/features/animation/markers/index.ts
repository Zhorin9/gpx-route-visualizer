import type { AnimationSettings, MarkerColor, MarkerLook } from '../types'
import type { VehicleDef } from '../vehicles'
import { art, artShape } from './art'
import { badge, badgeShape } from './badge'
import { camper, camperShape } from './camper'
import { classic, classicShape } from './classic'
import { flat, flatShape } from './flat'
import { softShadow } from './shared'
import { side, sideShape } from './side'
import { sketch, sketchShape } from './sketch'

const CAR_LOOKS: Record<MarkerLook, { draw: (color: string) => string; shape: string }> = {
  art: { draw: art, shape: artShape },
  flat: { draw: flat, shape: flatShape },
  sketch: { draw: sketch, shape: sketchShape },
  badge: { draw: badge, shape: badgeShape },
  camper: { draw: camper, shape: camperShape },
  classic: { draw: classic, shape: classicShape },
  side: { draw: side, shape: sideShape },
}

export const MARKER_LOOKS = Object.keys(CAR_LOOKS) as MarkerLook[]

// Looks a vehicle other than the car has: its own illustration or its outline.
export const lookFits = (vehicle: VehicleDef, look: MarkerLook) => vehicle.id === 'car' || look === 'side' || (look === 'art' && Boolean(vehicle.art))

// Documents from before the looks: 'route' and 'mono' were today's outline in the line's colour or in black.
export function markerOf(a: Pick<AnimationSettings, 'vehicleLook' | 'vehicleColor'>): { look: MarkerLook; color: MarkerColor | undefined } {
  const look = a.vehicleLook as string | undefined
  if (look === 'route') return { look: 'side', color: 'route' }
  if (look === 'mono') return { look: 'side', color: '#111111' }
  return { look: (look as MarkerLook | undefined) ?? 'art', color: a.vehicleColor }
}

export function markerColor(color: MarkerColor | undefined, from: { style: string; route: string }): string {
  if (color === 'route') return from.route
  if (color == null || color === 'style') return from.style
  return color
}

export const markerShadowOn = (a: Pick<AnimationSettings, 'vehicleShadow'>, look: MarkerLook) => a.vehicleShadow ?? look === 'art'

// The car in the look, as SVG content of the 48 × 24 box; null where the vehicle is drawn as its outline.
export function markerArt(vehicle: VehicleDef, look: MarkerLook, color: string, shadow: boolean, ownArt: boolean): string | null {
  if (vehicle.id !== 'car') return look === 'art' && vehicle.art ? vehicle.art : null
  // An unchanged illustration keeps the paint it always had.
  if (look === 'art' && ownArt && vehicle.art) return vehicle.art
  const car = CAR_LOOKS[look]
  return (shadow ? softShadow(car.shape) : '') + car.draw(color)
}
