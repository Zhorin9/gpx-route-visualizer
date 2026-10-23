import type { GpxPoint, LineKind, RouteOption, Stop, TravelModeId, TravelPlan, VehicleId } from '../../../types'
import { nearestRoad, nearestStation } from '../providers/geocoding'
import { RouteError, routingProvider, type RouteProfile } from '../providers/routing'
import { greatCircle, straightLines, withEstimatedTime } from './lines'

export interface BuildContext {
  profile?: string
  options?: readonly RouteOption[]
  signal: AbortSignal
  // Id of the chosen route service; the default when absent.
  router?: string
}

// A way of travelling a leg: how its line is made and how it looks by default.
export interface TravelMode {
  id: TravelModeId
  label: string
  // Default marker at the head of the animated line.
  vehicle: VehicleId
  line: { dashed: boolean }
  // The shapes a leg can take, the default first.
  lines: LineKind[]
  // For estimated times when the line comes without them.
  avgSpeedKmh: number
  // Heights in the points are the ground's, so climbing counts.
  groundElevation: boolean
  profiles?: { id: RouteProfile; label: string }[]
  // What a leg of this mode can keep away from (motorways, tolls), as switches in the panel.
  options?: { id: RouteOption; label: string }[]
  // Needs the route service, so the network.
  online: boolean
  build: (stops: Stop[], ctx: BuildContext) => Promise<GpxPoint[]>
}

const routed =
  (fallback: RouteProfile, snapToRoads = false) =>
  async (stops: Stop[], { profile, options = [], signal, router }: BuildContext) => {
    const route = (at: Stop[]) => routingProvider(router).route({ stops: at, profile: (profile as RouteProfile | undefined) ?? fallback, options }, signal)
    try {
      return await route(stops)
    } catch (err) {
      // A town's point is often its car-free old town: once more from the nearest main streets.
      if (!snapToRoads || !(err instanceof RouteError) || !err.noTrack) throw err
      const snapped = await Promise.all(stops.map(async (s) => ({ ...s, ...(await nearestRoad(s, signal).then((r) => (r ? { lat: r.lat, lon: r.lon } : null))) })))
      return route(snapped)
    }
  }

// Rails, from the station nearest each stop (a town's centre is rarely on the tracks). The rail
// profile's own times are a cyclist's, so the train's are estimated from its average speed.
async function byRail(stops: Stop[], ctx: BuildContext): Promise<GpxPoint[]> {
  const stations = await Promise.all(
    stops.map(async (stop) => {
      const station = await nearestStation(stop, ctx.signal)
      if (!station) throw new RouteError(`Brak stacji kolejowej w pobliżu: ${stop.via ? 'punkt pośredni' : stop.name}.`)
      return { ...stop, lat: station.lat, lon: station.lon }
    }),
  )
  const points = await routingProvider(ctx.router).route({ stops: stations, profile: 'rail', options: [] }, ctx.signal)
  return points.map((p) => ({ ...p, time: null }))
}

const modes: TravelMode[] = []

export function registerTravelMode(mode: TravelMode): void {
  const i = modes.findIndex((m) => m.id === mode.id)
  if (i >= 0) modes.splice(i, 1, mode)
  else modes.push(mode)
}

export function travelModes(): readonly TravelMode[] {
  return modes
}

export function travelMode(id: TravelModeId): TravelMode {
  return modes.find((m) => m.id === id) ?? modes[0]
}

export const BUILT_IN_MODES: TravelMode[] = [
  {
    id: 'car',
    label: 'Auto',
    vehicle: 'car',
    line: { dashed: false },
    avgSpeedKmh: 80,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    options: [
      { id: 'avoid_motorways', label: 'Unikaj autostrad i dróg ekspresowych' },
      { id: 'avoid_toll', label: 'Unikaj płatnych odcinków' },
      { id: 'avoid_unpaved', label: 'Unikaj dróg gruntowych' },
    ],
    online: true,
    build: routed('car', true),
  },
  {
    id: 'bike',
    label: 'Rower',
    vehicle: 'bike',
    line: { dashed: false },
    avgSpeedKmh: 18,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    profiles: [
      { id: 'trekking', label: 'Trekking' },
      { id: 'road', label: 'Szosa' },
      { id: 'mtb', label: 'MTB' },
    ],
    online: true,
    build: routed('trekking'),
  },
  {
    id: 'plane',
    label: 'Samolot',
    vehicle: 'plane',
    line: { dashed: true },
    avgSpeedKmh: 750,
    groundElevation: false,
    lines: ['arc', 'straight'],
    online: false,
    build: async (stops) => greatCircle(stops),
  },
  {
    id: 'foot',
    label: 'Pieszo',
    vehicle: 'walker',
    line: { dashed: false },
    avgSpeedKmh: 4.5,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    online: true,
    build: routed('hiking'),
  },
  {
    id: 'train',
    label: 'Pociąg',
    vehicle: 'train',
    line: { dashed: false },
    avgSpeedKmh: 95,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    online: true,
    build: byRail,
  },
]

export const LINE_LABELS: Record<LineKind, string> = { road: 'po drodze', straight: 'prosta', arc: 'łuk' }

export const lineOf = (plan: Pick<TravelPlan, 'mode' | 'line'>): LineKind => plan.line ?? travelMode(plan.mode).lines[0]

// Heights come from the ground only for a line along roads or rails.
export const onGround = (plan: Pick<TravelPlan, 'mode' | 'line'>) => travelMode(plan.mode).groundElevation && lineOf(plan) === 'road'

// The leg's line with times from `start`: the service's own estimate, else an even speed for the mode.
// A straight line or an arc needs no network; only a line along roads asks the mode's service.
export async function buildLeg(plan: TravelPlan, ctx: BuildContext, start: number): Promise<GpxPoint[]> {
  const mode = travelMode(plan.mode)
  const line = lineOf(plan)
  const points = line === 'road' ? await mode.build(plan.stops, ctx) : line === 'arc' ? greatCircle(plan.stops) : straightLines(plan.stops)
  if (points.every((p) => p.time != null)) return points.map((p) => ({ ...p, time: start + (p.time as number) }))
  return withEstimatedTime(points, mode.avgSpeedKmh, start)
}
