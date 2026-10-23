import type { VehicleId } from '../../types'
import { CAR_ART, PLANE_ART, TRAIN_ART } from './vehicleArt'

// A marker at the head of the animated line.
export interface VehicleDef {
  id: VehicleId
  label: string
  // SVG path in a 24 × 24 box centred on (0, 0), pointing east. Empty for the dot.
  path: string
  // Drawn as lines (a bike, a walker) rather than a filled shape.
  outline?: boolean
  // Cars and bikes flip instead of turning upside down when heading west.
  flipWhenWest: boolean
  // A colour illustration seen from above (vehicleArt.ts), drawn instead of the path on the frame.
  art?: string
}

const vehicles: VehicleDef[] = []

export function registerVehicle(def: VehicleDef): void {
  const i = vehicles.findIndex((v) => v.id === def.id)
  if (i >= 0) vehicles.splice(i, 1, def)
  else vehicles.push(def)
}

export function vehicleList(): readonly VehicleDef[] {
  return vehicles
}

// The dot is the first entry, so an unknown id draws what the animation always drew.
export function vehicleFor(id: VehicleId | undefined): VehicleDef {
  return vehicles.find((v) => v.id === id) ?? vehicles[0]
}

export const BUILT_IN_VEHICLES: VehicleDef[] = [
  { id: 'dot', label: 'Kropka', path: '', flipWhenWest: false },
  {
    id: 'plane',
    label: 'Samolot',
    path: 'M12 0C12-.8 11-1.3 10-1.3H3L-3-10H-5.5L-1.5-1.3H-7L-9.5-4.5H-11.5L-10 0L-11.5 4.5H-9.5L-7 1.3H-1.5L-5.5 10H-3L3 1.3H10C11 1.3 12 .8 12 0Z',
    flipWhenWest: false,
    art: PLANE_ART,
  },
  {
    id: 'train',
    label: 'Pociąg',
    path: 'M-12 4V-6Q-12-7-11-7H5Q9-7 11-3L12 0V4Z M-9-5V-1H-4V-5Z M-2-5V-1H3V-5Z M5-5V-1H9L8-3.5Q7-5 5.5-5Z M-9.6 5.5A2 2 0 1 0-5.6 5.5A2 2 0 1 0-9.6 5.5Z M5.4 5.5A2 2 0 1 0 9.4 5.5A2 2 0 1 0 5.4 5.5Z',
    // Seen from above it turns any way without standing on its head.
    flipWhenWest: false,
    art: TRAIN_ART,
  },
  {
    id: 'car',
    label: 'Auto',
    path: 'M-11 3V-1Q-11-2.5-9.5-2.8L-6-3.3L-3.5-7H4L7.5-3.3L10.5-2.5Q12-2 12 0V3Z M-9.1 3A2.6 2.6 0 1 0-3.9 3A2.6 2.6 0 1 0-9.1 3Z M4.9 3A2.6 2.6 0 1 0 10.1 3A2.6 2.6 0 1 0 4.9 3Z',
    flipWhenWest: false,
    art: CAR_ART,
  },
  {
    id: 'bike',
    label: 'Rower',
    path: 'M-11 3A4.5 4.5 0 1 0-2 3A4.5 4.5 0 1 0-11 3Z M2 3A4.5 4.5 0 1 0 11 3A4.5 4.5 0 1 0 2 3Z M-6.5 3L-2-5H4.5L6.5 3 M-6.5 3H0L-2-5 M0 3L4.5-5L3.5-7.5H5.5 M-3.5-6H-.5',
    outline: true,
    flipWhenWest: true,
  },
  {
    id: 'walker',
    label: 'Piechur',
    path: 'M-.8-8A1.8 1.8 0 1 0 2.8-8A1.8 1.8 0 1 0-.8-8Z M.6-5.8L-.5 1L3 8 M-.5 1L-4 8 M.3-4.5L3.5-.5 M.3-4.5L-3-.5 M5-5L6 8',
    outline: true,
    flipWhenWest: true,
  },
  {
    id: 'boat',
    label: 'Statek',
    path: 'M-11 2H11L8 6H-8Z M-1 .5V-10L8 .5Z M-2 .5V-8L-8 .5Z',
    flipWhenWest: true,
  },
]

// How far behind the head the direction is taken from, in frame pixels: far enough that GPS
// jitter on a bend doesn't make the marker twitch, close enough to follow real turns.
const HEADING_SPAN = 40

// Point `distance` pixels along the projected line from fractional index `pos`, backwards when negative.
function along(flat: ArrayLike<number>, pos: number, distance: number): { x: number; y: number } {
  const count = flat.length / 2
  const i = Math.max(0, Math.min(count - 1, Math.floor(pos)))
  const t = pos - i
  const next = Math.min(count - 1, i + 1)
  let x = flat[i * 2] + (flat[next * 2] - flat[i * 2]) * t
  let y = flat[i * 2 + 1] + (flat[next * 2 + 1] - flat[i * 2 + 1]) * t
  const step = distance < 0 ? -1 : 1
  let left = Math.abs(distance)
  for (let k = step < 0 ? i : next; k >= 0 && k < count && left > 0; k += step) {
    const dx = flat[k * 2] - x
    const dy = flat[k * 2 + 1] - y
    const d = Math.hypot(dx, dy)
    if (d >= left) return { x: x + (dx / d) * left, y: y + (dy / d) * left }
    left -= d
    x = flat[k * 2]
    y = flat[k * 2 + 1]
  }
  return { x, y }
}

// Direction of travel at `pos` in degrees (0 = east, clockwise on screen), from a point a little behind.
// At the very start, where nothing lies behind, from the head to a point a little ahead.
export function headingAt(flat: ArrayLike<number>, pos: number): number {
  const head = along(flat, pos, 0)
  let from = along(flat, pos, -HEADING_SPAN)
  let to = head
  if (Math.hypot(head.x - from.x, head.y - from.y) < HEADING_SPAN / 4) {
    from = head
    to = along(flat, pos, HEADING_SPAN)
  }
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

// Rotation and mirroring that point the marker along `heading`; `turn` is the rotation of the
// route on the frame. A marker that flips stays upright going west: it mirrors instead.
export function vehiclePose(def: VehicleDef, heading: number, turn: number): { rotation: number; flip: boolean } {
  const onScreen = (((heading + turn) % 360) + 360) % 360
  return { rotation: heading, flip: def.flipWhenWest && onScreen > 90 && onScreen < 270 }
}
