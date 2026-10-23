import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { rangeStats, selectRouteParts, selectTrack } from '../../store/derived'
import { useAppStore } from '../../store/useAppStore'
import { cumulativeDistanceKm, parseGpxText, toGpxText } from '../../utils/gpx'
import { registerTravel } from '.'
import { addStop, journeyOf, legPlans, removeStop, type Journey } from './model/journey'
import { greatCircle } from './model/lines'
import { parseBRouter } from './providers/brouter'
import { parsePhoton } from './providers/geocoding'
import type { Stop } from '../../types'

const GDANSK = { lat: 54.352, lon: 18.6466 }
const ISTANBUL = { lat: 41.0082, lon: 28.9784 }

const stop = (id: number, name: string, at: { lat: number; lon: number }, via = false): Stop => ({ id, name, ...at, via })

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

describe('great circle', () => {
  it('is as long as the haversine distance and passes the arc midpoint', () => {
    const arc = greatCircle([GDANSK, ISTANBUL])
    const cum = cumulativeDistanceKm(arc)
    const direct = haversineKm(GDANSK, ISTANBUL)
    expect(Math.abs(cum[cum.length - 1] - direct) / direct).toBeLessThan(0.005)
    // The arc's middle is equally far from both ends.
    const mid = arc[Math.round(arc.length / 2)]
    expect(Math.abs(haversineKm(mid, GDANSK) - haversineKm(mid, ISTANBUL))).toBeLessThan(15)
    expect(arc[0]).toMatchObject(GDANSK)
    expect(arc[arc.length - 1].lat).toBeCloseTo(ISTANBUL.lat, 6)
  })

  it('crosses the antimeridian without a line across the world', () => {
    const arc = greatCircle([{ lat: 35.68, lon: 139.69 }, { lat: 34.05, lon: -118.24 }])
    for (let i = 1; i < arc.length; i++) expect(Math.abs(arc[i].lon - arc[i - 1].lon)).toBeLessThan(5)
    expect(arc[arc.length - 1].lon).toBeCloseTo(-118.24 + 360, 4)
  })
})

describe('journey', () => {
  const a = stop(1, 'A', { lat: 50, lon: 19 })
  const b = stop(2, 'B', { lat: 51, lon: 19 })
  const c = stop(3, 'C', { lat: 52, lon: 19 })
  const via = stop(4, 'v', { lat: 50.5, lon: 19.2 }, true)
  const trip: Journey = { stops: [a, via, b, c], legs: [{ mode: 'car' }, { mode: 'plane' }] }

  it('splits the stops into one leg per pair of named stops, with the via points inside', () => {
    expect(legPlans(trip).map((l) => [l.mode, l.stops.map((s) => s.name).join('')])).toEqual([
      ['car', 'AvB'],
      ['plane', 'BC'],
    ])
  })

  it('joins two legs into one when the stop between them goes', () => {
    const joined = removeStop(trip, b.id)
    expect(joined.legs).toEqual([{ mode: 'car' }])
    expect(legPlans(joined)[0].stops.map((s) => s.name).join('')).toBe('AvC')
    // The first stop takes its leg with it, and the via point can't start the trip.
    expect(removeStop(trip, a.id)).toEqual({ stops: [b, c], legs: [{ mode: 'plane' }] })
  })

  it('reads the trip back from the planned parts of the route', () => {
    const parts = legPlans(trip).map((plan, i) => ({ id: i + 1, name: '', color: '', dashed: false, visible: true, sourceKey: '', plan }))
    expect(journeyOf(parts, null)).toEqual(trip)
    expect(addStop(journeyOf([], a), b, 'bike')).toEqual({ stops: [a, b], legs: [{ mode: 'bike' }] })
  })
})

describe('providers', () => {
  it('reads a BRouter answer with heights and times', () => {
    const points = parseBRouter(
      {
        features: [
          {
            geometry: { coordinates: [[18.6466, 54.352, 8], [18.6465, 54.3521, 9]] },
            properties: { times: [0, 1.5] },
          },
        ],
      },
      1000,
    )
    expect(points).toEqual([
      { lat: 54.352, lon: 18.6466, ele: 8, time: 1000 },
      { lat: 54.3521, lon: 18.6465, ele: 9, time: 2500 },
    ])
    expect(() => parseBRouter({ features: [] }, 0)).toThrow(/drogi/)
  })

  it('reads Photon places with their region', () => {
    const places = parsePhoton({
      features: [{ geometry: { coordinates: [18.654, 54.348] }, properties: { name: 'Gdańsk', state: 'województwo pomorskie', country: 'Polska' } }],
    })
    expect(places).toEqual([{ name: 'Gdańsk', detail: 'województwo pomorskie, Polska', lat: 54.348, lon: 18.654 }])
  })
})

describe('planned trip on the route', () => {
  const initial = useAppStore.getState()
  const get = () => useAppStore.getState()
  beforeAll(registerTravel)
  beforeEach(() => useAppStore.setState(initial, true))

  const gdansk = stop(1, 'Gdańsk', GDANSK)
  const istanbul = stop(2, 'Stambuł', ISTANBUL)
  const flight: Journey = { stops: [gdansk, istanbul], legs: [{ mode: 'plane' }] }

  it('keeps a lone first stop outside the route until the second one comes', async () => {
    await get().setJourney({ stops: [gdansk], legs: [] }, 'add')
    expect(get().draftStop).toEqual(gdansk)
    expect(get().routeSource).toBeNull()
    expect(get().past).toHaveLength(0)
    await get().setJourney(addStop(journeyOf([], get().draftStop), istanbul, 'plane'), 'add')
    expect(get().draftStop).toBeNull()
    expect(get().waypoints.map((w) => w.text)).toEqual(['Gdańsk', 'Stambuł'])
  })

  it('turns a flight into a route with a title, labels at both ends and no climbing', async () => {
    await get().setJourney(flight, 'add')
    const parts = selectRouteParts(get())
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ name: 'Gdańsk → Stambuł', groundElevation: false, estimatedTime: true })
    expect(get().routeStyle.dashed).toBe(true)
    expect(get().texts.find((t) => t.role === 'title')?.text).toBe('Gdańsk → Stambuł')
    expect(get().waypoints.map((w) => [w.text, w.trackPos])).toEqual([
      ['Gdańsk', 0],
      ['Stambuł', parts[0].endIdx],
    ])
    const track = selectTrack(get())
    const stats = rangeStats(track, get().range, [], parts)
    expect(stats?.elevationGainM).toBe(0)
    expect(stats?.estimatedTime).toBe(true)
    // ~1 640 km at 750 km/h.
    expect((stats?.durationMs ?? 0) / 3_600_000).toBeCloseTo(haversineKm(GDANSK, ISTANBUL) / 750, 1)
    get().undo()
    expect(get().routeSource).toBeNull()
  })

  it('keeps an unchanged leg, builds a new one and merges legs when the middle stop goes', async () => {
    const warsaw = stop(3, 'Warszawa', { lat: 52.23, lon: 21.01 })
    await get().setJourney({ stops: [gdansk, warsaw], legs: [{ mode: 'car', line: 'straight' }] }, 'add')
    const first = selectRouteParts(get())[0]
    await get().setJourney({ stops: [gdansk, warsaw, istanbul], legs: [{ mode: 'car', line: 'straight' }, { mode: 'plane' }] }, 'add')
    const [kept, flown] = selectRouteParts(get())
    expect(kept.sourceKey).toBe(first.sourceKey)
    expect(flown.plan?.mode).toBe('plane')
    expect(new Set([kept.color, flown.color]).size).toBe(2)
    expect(get().waypoints.map((w) => w.text)).toEqual(['Gdańsk', 'Warszawa', 'Stambuł'])

    await get().setJourney(removeStop(journeyOf(get().routeSource!.parts, null), warsaw.id), 'remove')
    expect(selectRouteParts(get()).map((p) => p.name)).toEqual(['Gdańsk → Stambuł'])
    expect(get().waypoints.map((w) => w.text)).toEqual(['Gdańsk', 'Stambuł'])
  })

  it('draws a leg the route service has no road for as a straight line and says so', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('operation killed by thread-priority-watchdog', { status: 400 }))
    await get().setJourney({ stops: [gdansk, istanbul], legs: [{ mode: 'car' }] }, 'add')
    fetch.mockRestore()
    expect(selectRouteParts(get())[0].plan).toMatchObject({ mode: 'car', line: 'straight' })
    expect(get().travelError).toMatch(/Gdańsk → Stambuł: Odcinek jest za długi/)
  })

  it('places a flight to the start before the GPX file', async () => {
    const file = new File(['<gpx><trk><trkseg><trkpt lat="41" lon="29"><ele>10</ele></trkpt><trkpt lat="41.01" lon="29"><ele>30</ele></trkpt></trkseg></trk></gpx>'], 'a.gpx')
    await get().loadGpxFile(file)
    await get().setJourney(flight, 'add', { atStart: true })
    const parts = selectRouteParts(get())
    expect(parts.map((p) => Boolean(p.plan))).toEqual([true, false])
    // Climbing counts on the ground only, not from the flight's zero height up to the file's first point.
    const stats = rangeStats(selectTrack(get()), get().range, [parts[1].startIdx], parts)
    expect(stats?.elevationGainM).toBe(20)
  })
})

describe('GPX export', () => {
  it('writes a file that reads back the same', () => {
    const points = greatCircle([GDANSK, ISTANBUL], 200).map((p, i) => ({ ...p, ele: i, time: 1_700_000_000_000 + i * 1000 }))
    const back = parseGpxText(toGpxText('Gdańsk – Stambuł & co', points))
    expect(back.name).toBe('Gdańsk – Stambuł & co')
    expect(back.points).toHaveLength(points.length)
    expect(back.points[3]).toEqual({ lat: +points[3].lat.toFixed(6), lon: +points[3].lon.toFixed(6), ele: 3, time: points[3].time })
  })
})

describe('route options and the train', () => {
  const initial = useAppStore.getState()
  const get = () => useAppStore.getState()
  beforeAll(registerTravel)
  beforeEach(() => useAppStore.setState(initial, true))

  const line = (from: [number, number], to: [number, number]) =>
    new Response(JSON.stringify({ features: [{ geometry: { coordinates: [[...from, 10], [...to, 20]] }, properties: { times: [0, 3600] } }] }))
  const gdansk = stop(1, 'Gdańsk', GDANSK)
  const warsaw = stop(2, 'Warszawa', { lat: 52.2297, lon: 21.0122 })

  it('asks the route service to keep away from tolls and builds the leg again when the option changes', async () => {
    const urls: string[] = []
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      urls.push(String(url))
      return line([18.65, 54.35], [21.01, 52.23])
    })
    await get().setJourney({ stops: [gdansk, warsaw], legs: [{ mode: 'car' }] }, 'add')
    const first = selectRouteParts(get())[0].sourceKey
    await get().setJourney({ stops: [gdansk, warsaw], legs: [{ mode: 'car', options: ['avoid_toll'] }] }, 'options')
    fetch.mockRestore()
    expect(urls[0]).not.toContain('avoid_toll')
    expect(urls[1]).toContain('profile:avoid_toll=1')
    expect(selectRouteParts(get())[0].sourceKey).not.toBe(first)
    expect(journeyOf(get().routeSource!.parts, null).legs).toEqual([{ mode: 'car', options: ['avoid_toll'] }])
  })

  it('goes by rail between the stations nearest the stops, at the train\'s own pace', async () => {
    const urls: string[] = []
    const station = (lon: number, lat: number, name: string) =>
      new Response(JSON.stringify({ features: [{ geometry: { coordinates: [lon, lat] }, properties: { name } }] }))
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url)
      urls.push(u)
      if (u.includes('railway:station')) return u.includes('lat=54') ? station(18.6442, 54.3564, 'Gdańsk Główny') : station(21.0034, 52.2288, 'Warszawa Centralna')
      return line([18.6442, 54.3564], [21.0034, 52.2288])
    })
    await get().setJourney({ stops: [gdansk, warsaw], legs: [{ mode: 'train' }] }, 'add')
    fetch.mockRestore()
    expect(urls.find((u) => u.includes('brouter'))).toContain('lonlats=18.644200,54.356400|21.003400,52.228800&profile=rail')
    const part = selectRouteParts(get())[0]
    expect(part.plan?.mode).toBe('train')
    expect(part.vehicle).toBe('train')
    // Not the rail profile's hour for 160 km: the train's 95 km/h.
    const points = get().trackCache[part.sourceKey]
    const hours = ((points[1].time ?? 0) - (points[0].time ?? 0)) / 3_600_000
    expect(hours).toBeCloseTo(cumulativeDistanceKm(points)[1] / 95, 2)
  })
})
