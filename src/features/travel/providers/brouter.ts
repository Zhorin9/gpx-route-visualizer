import type { GpxPoint, Stop } from '../../../types'
import i18n from '../../../i18n'
import { cached, rateLimited, RouteError, type RouteProfile, type RouteRequest, type RoutingProvider } from './routing'

const URL_BASE = 'https://brouter.de/brouter'

const PROFILES: Record<RouteProfile, string> = {
  car: 'car-fast',
  trekking: 'trekking',
  road: 'fastbike',
  mtb: 'mtb',
  hiking: 'hiking-mountain',
  rail: 'rail',
}

interface BRouterAnswer {
  features?: {
    geometry: { coordinates: [number, number, number?][] }
    properties: { times?: number[]; 'total-time'?: string }
  }[]
}

// What the public instance answers when it gives up, in words a person can act on.
function explain(status: number, text: string): string {
  if (/no track found/i.test(text)) return i18n.t('travel.errors.noConnection')
  if (/watchdog|killed/i.test(text)) return i18n.t('travel.errors.tooLong')
  if (/not mapped|island|no route/i.test(text)) return i18n.t('travel.errors.noRoad')
  if (status === 429 || /limit/i.test(text)) return i18n.t('travel.errors.tooManyRequests')
  return i18n.t('travel.errors.noAnswer')
}

export function parseBRouter(answer: BRouterAnswer, start: number): GpxPoint[] {
  const feature = answer.features?.[0]
  if (!feature || feature.geometry.coordinates.length < 2) throw new RouteError(i18n.t('travel.errors.noRoad'))
  const { times } = feature.properties
  return feature.geometry.coordinates.map(([lon, lat, ele], i) => ({
    lat,
    lon,
    ele: ele ?? 0,
    time: times?.[i] != null ? start + times[i] * 1000 : null,
  }))
}

// Options are the profile's own switches (car-fast has avoid_toll, avoid_motorways, avoid_unpaved).
async function route({ stops, profile, options }: RouteRequest, signal: AbortSignal): Promise<GpxPoint[]> {
  const lonlats = stops.map((s: Stop) => `${s.lon.toFixed(6)},${s.lat.toFixed(6)}`).join('|')
  const switches = options.map((o) => `&profile:${o}=1`).join('')
  const url = `${URL_BASE}?lonlats=${lonlats}&profile=${PROFILES[profile]}&alternativeidx=0&format=geojson${switches}`
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (signal.aborted) throw err
    throw new RouteError(i18n.t('travel.errors.offline'))
  }
  if (!response.ok) {
    const text = await response.text()
    throw new RouteError(explain(response.status, text), /no track found/i.test(text))
  }
  return parseBRouter(await response.json(), 0)
}

export const brouter: RoutingProvider = {
  id: 'brouter',
  label: 'BRouter',
  terms: 'Publiczna instancja brouter.de, bez klucza, z umiarkowanym limitem zapytań.',
  profiles: PROFILES,
  route: cached(rateLimited(route, 1000)),
}
