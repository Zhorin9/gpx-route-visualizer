// A place found by name or by a point on the map.
export interface Place {
  name: string
  // Region and country, to tell two places of the same name apart.
  detail: string
  lat: number
  lon: number
}

interface PhotonAnswer {
  features?: {
    geometry: { coordinates: [number, number] }
    properties: { name?: string; city?: string; state?: string; country?: string; street?: string; housenumber?: string }
  }[]
}

const URL_BASE = 'https://photon.komoot.io'
// Names as they are on the spot (Warszawa). Without it Photon follows the browser's language and
// an English browser gets Warsaw; Polish itself is not one of the languages it offers.
const LOCAL_NAMES = '&lang=default'

// A city and its district of the same name read alike; one of them is enough.
const distinct = (places: Place[]) => places.filter((p, i) => places.findIndex((q) => q.name === p.name && q.detail === p.detail) === i)

// `locality`: named by the town it lies in rather than by the street or shop at the point.
export function parsePhoton(answer: PhotonAnswer, locality = false): Place[] {
  return distinct(
    (answer.features ?? []).flatMap(({ geometry, properties: p }) => {
      const name = (locality ? p.city : undefined) ?? p.name ?? (p.street ? [p.street, p.housenumber].filter(Boolean).join(' ') : p.city)
      if (!name) return []
      const detail = [p.city !== name ? p.city : undefined, p.state, p.country].filter(Boolean).join(', ')
      return [{ name, detail, lat: geometry.coordinates[1], lon: geometry.coordinates[0] }]
    }),
  )
}

interface NominatimPlace {
  name: string
  display_name: string
  lat: string
  lon: string
}

// The region and country from the address, without the postcode.
export function parseNominatim(answer: NominatimPlace[]): Place[] {
  return distinct(
    answer.map((p) => {
      const parts = p.display_name.split(', ').slice(1).filter((part) => !/\d/.test(part) && part !== p.name)
      return { name: p.name || p.display_name.split(', ')[0], detail: parts.slice(-2).join(', '), lat: Number(p.lat), lon: Number(p.lon) }
    }),
  )
}

async function ask<T>(url: string, signal: AbortSignal, parse: (answer: T) => Place[]): Promise<Place[]> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Wyszukiwarka miejsc nie odpowiedziała.')
  return parse(await response.json())
}

// Photon (komoot): no key, made for suggestions while typing. Places near `near` come first.
export function searchPlaces(query: string, near: { lat: number; lon: number } | null, signal: AbortSignal): Promise<Place[]> {
  const bias = near ? `&lat=${near.lat.toFixed(4)}&lon=${near.lon.toFixed(4)}` : ''
  return ask(`${URL_BASE}/api/?q=${encodeURIComponent(query)}&limit=8${bias}${LOCAL_NAMES}`, signal, parsePhoton).then((places) => places.slice(0, 6))
}

// Nominatim knows the Polish names of foreign places (Stambuł, Kolonia) that Photon doesn't.
// Its rules allow no search-as-you-type, so it runs only when asked, one request at a time.
export function searchPlacesExact(query: string, signal: AbortSignal): Promise<Place[]> {
  return ask(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=6&accept-language=pl`, signal, parseNominatim)
}

// A point on the nearest main street (primary to tertiary) within about 3 km, for a car that can't
// start from a pedestrian square in the middle of town.
export async function nearestRoad(at: { lat: number; lon: number }, signal: AbortSignal): Promise<Place | null> {
  const tags = ['trunk', 'primary', 'secondary', 'tertiary'].map((t) => `&osm_tag=highway:${t}`).join('')
  const url = `${URL_BASE}/reverse?lat=${at.lat.toFixed(5)}&lon=${at.lon.toFixed(5)}${tags}&radius=3&limit=1${LOCAL_NAMES}`
  return (await ask(url, signal, (answer: PhotonAnswer) => parsePhoton(answer)))[0] ?? null
}

// The railway station nearest a place, within about 15 km; null when there is none.
export async function nearestStation(at: { lat: number; lon: number }, signal: AbortSignal): Promise<Place | null> {
  const url = `${URL_BASE}/reverse?lat=${at.lat.toFixed(5)}&lon=${at.lon.toFixed(5)}&osm_tag=railway:station&radius=15&limit=1${LOCAL_NAMES}`
  return (await ask(url, signal, (answer: PhotonAnswer) => parsePhoton(answer)))[0] ?? null
}

export async function placeAt(at: { lat: number; lon: number }, signal: AbortSignal): Promise<Place | null> {
  return (await ask(`${URL_BASE}/reverse?lat=${at.lat.toFixed(5)}&lon=${at.lon.toFixed(5)}${LOCAL_NAMES}`, signal, (answer: PhotonAnswer) => parsePhoton(answer, true)))[0] ?? null
}
