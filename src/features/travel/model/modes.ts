import type { GpxPoint, LineKind, RouteOption, Stop, TravelModeId, TravelPlan, VehicleId } from '../../../types'
import { nearestRoad, nearestStation } from '../providers/geocoding'
import { RouteError, routingProvider, type RouteProfile } from '../providers/routing'
import { greatCircle, straightLines, withEstimatedTime } from './lines'
import i18n, { type TKey } from '../../../i18n'

export interface BuildContext {
  profile?: string
  options?: readonly RouteOption[]
  signal: AbortSignal
  // Absent: the default service.
  router?: string
}

export interface TravelMode {
  id: TravelModeId
  label: TKey
  vehicle: VehicleId
  line: { dashed: boolean }
  // The default first.
  lines: LineKind[]
  // For estimated times when the line comes without them.
  avgSpeedKmh: number
  // Heights in the points are the ground's, so climbing counts.
  groundElevation: boolean
  profiles?: { id: RouteProfile; label: TKey }[]
  options?: { id: RouteOption; label: TKey }[]
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

// From the stations nearest the stops; the rail profile's times are a cyclist's, so the train's are estimated.
async function byRail(stops: Stop[], ctx: BuildContext): Promise<GpxPoint[]> {
  const stations = await Promise.all(
    stops.map(async (stop) => {
      const station = await nearestStation(stop, ctx.signal)
      if (!station) throw new RouteError(i18n.t('travel.errors.noStation', { place: stop.via ? i18n.t('travel.errors.viaPoint') : stop.name }))
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
    label: 'travel.modes.car',
    vehicle: 'car',
    line: { dashed: false },
    avgSpeedKmh: 80,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    options: [
      { id: 'avoid_motorways', label: 'travel.options.avoidMotorways' },
      { id: 'avoid_toll', label: 'travel.options.avoidToll' },
      { id: 'avoid_unpaved', label: 'travel.options.avoidUnpaved' },
    ],
    online: true,
    build: routed('car', true),
  },
  {
    id: 'bike',
    label: 'travel.modes.bike',
    vehicle: 'bike',
    line: { dashed: false },
    avgSpeedKmh: 18,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    profiles: [
      { id: 'trekking', label: 'travel.profiles.trekking' },
      { id: 'road', label: 'travel.profiles.road' },
      { id: 'mtb', label: 'travel.profiles.mtb' },
    ],
    online: true,
    build: routed('trekking'),
  },
  {
    id: 'plane',
    label: 'travel.modes.plane',
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
    label: 'travel.modes.foot',
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
    label: 'travel.modes.train',
    vehicle: 'train',
    line: { dashed: false },
    avgSpeedKmh: 95,
    groundElevation: true,
    lines: ['road', 'straight', 'arc'],
    online: true,
    build: byRail,
  },
]

export const LINE_LABELS: Record<LineKind, TKey> = { road: 'travel.lineLabels.road', straight: 'travel.lineLabels.straight', arc: 'travel.lineLabels.arc' }

export const lineOf = (plan: Pick<TravelPlan, 'mode' | 'line'>): LineKind => plan.line ?? travelMode(plan.mode).lines[0]

export const onGround = (plan: Pick<TravelPlan, 'mode' | 'line'>) => travelMode(plan.mode).groundElevation && lineOf(plan) === 'road'

export async function buildLeg(plan: TravelPlan, ctx: BuildContext, start: number): Promise<GpxPoint[]> {
  const mode = travelMode(plan.mode)
  const line = lineOf(plan)
  const points = line === 'road' ? await mode.build(plan.stops, ctx) : line === 'arc' ? greatCircle(plan.stops) : straightLines(plan.stops)
  if (points.every((p) => p.time != null)) return points.map((p) => ({ ...p, time: start + (p.time as number) }))
  return withEstimatedTime(points, mode.avgSpeedKmh, start)
}
