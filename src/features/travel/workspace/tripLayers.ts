import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import type { RefObject } from 'react'
import { CHROME_ACCENT } from '../../../core/canvas/chrome'
import { insertVia, legPlans, type Journey } from '../model/journey'
import { lineOf } from '../model/modes'
import type { GpxPoint, TrackPart } from '../../../types'
import { kmBetween, nearestIndex, type LatLon } from '../../../utils/gpx'

// Line colours on the planning map: the trip in ink, the leg being edited in the accent.
const INK = '#24351f'

export const lngLat = (p: { lat: number; lon: number }): [number, number] => [p.lon, p.lat]

const nearestTo = (points: GpxPoint[], at: LatLon) => nearestIndex(points, (p) => kmBetween(p, at)) ?? 0

function dashOf(part: TrackPart): 'solid' | 'dotted' | 'dashed' {
  if (!part.plan) return 'solid'
  if (lineOf(part.plan) !== 'road') return 'dashed'
  return part.plan.mode === 'bike' || part.plan.mode === 'foot' ? 'dotted' : 'solid'
}

// The leg nearest a point on screen: the least distance from the point to any of its segments.
export function nearestLine(at: { x: number; y: number }, lines: { x: number; y: number }[][]): number {
  let best = -1
  let bestD = Infinity
  lines.forEach((line, i) => {
    for (let k = 0; k + 1 < line.length; k++) {
      const a = line[k]
      const b = line[k + 1]
      const len = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
      const t = len ? Math.max(0, Math.min(1, ((at.x - a.x) * (b.x - a.x) + (at.y - a.y) * (b.y - a.y)) / len)) : 0
      const d = Math.hypot(at.x - (a.x + t * (b.x - a.x)), at.y - (a.y + t * (b.y - a.y)))
      if (d < bestD) [best, bestD] = [i, d]
    }
  })
  return best
}

// `highlight`: the leg picked or being split; the others fade behind it.
export function tripData(planned: TrackPart[], cache: Record<string, GpxPoint[]>, highlight: number | null) {
  return {
    type: 'FeatureCollection' as const,
    features: planned.map((p, leg) => ({
      type: 'Feature' as const,
      properties: { leg, dash: dashOf(p), selected: leg === highlight, dim: highlight != null && leg !== highlight },
      geometry: { type: 'LineString' as const, coordinates: (cache[p.sourceKey] ?? []).map(lngLat) },
    })),
  }
}

// Added again whenever the map's style is swapped.
export function addTripLayers(map: MapLibreMap, data: ReturnType<typeof tripData>) {
  if (map.getSource('trip')) return void (map.getSource('trip') as GeoJSONSource).setData(data)
  map.addSource('trip', { type: 'geojson', data })
  const color = ['case', ['get', 'selected'], CHROME_ACCENT, INK] as unknown as string
  const opacity = ['case', ['get', 'dim'], 0.35, 1] as unknown as number
  const width = (w: number) => ['case', ['get', 'selected'], w + 1.5, w] as unknown as number
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const
  // A pale casing keeps the line readable on a satellite photo.
  map.addLayer({ id: 'trip-casing', type: 'line', source: 'trip', paint: { 'line-color': '#f3f2f2', 'line-width': width(7), 'line-opacity': ['case', ['get', 'dim'], 0.25, 0.7] as unknown as number }, layout })
  map.addLayer({ id: 'trip-solid', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'solid'], paint: { 'line-color': color, 'line-width': width(4), 'line-opacity': opacity }, layout })
  map.addLayer({ id: 'trip-dotted', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'dotted'], paint: { 'line-color': color, 'line-width': width(4), 'line-opacity': opacity, 'line-dasharray': [0.25, 2.25] }, layout })
  map.addLayer({ id: 'trip-dashed', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'dashed'], paint: { 'line-color': color, 'line-width': width(3), 'line-opacity': opacity, 'line-dasharray': [3.7, 2.7] }, layout: { 'line-join': 'round' } })
  map.addLayer({ id: 'trip-hit', type: 'line', source: 'trip', paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 16 } })
}

// The newest trip for the map's own event handlers, which are attached once.
export interface Latest {
  journey: Journey
  onChange: (j: Journey, label: string) => void
  planned: TrackPart[]
  cache: Record<string, GpxPoint[]>
  // When the line was last let go: the click that follows the drag adds no stop.
  bentAt: number
}

export function bendLine(m: MapLibreMap, e: MapLayerMouseEvent, latest: RefObject<Latest>) {
  const leg = Number(e.features?.[0]?.properties?.leg)
  // A pin lies on the line; dragging it moves the stop, not the line.
  if (!Number.isFinite(leg) || (e.originalEvent.target as HTMLElement).closest('.trip-pin')) return
  e.preventDefault()
  m.getCanvas().style.cursor = 'grabbing'
  m.once('mouseup', (end) => {
    m.getCanvas().style.cursor = ''
    latest.current.bentAt = performance.now()
    // A click on the line, not a drag, leaves it as it is.
    if (Math.hypot(end.point.x - e.point.x, end.point.y - e.point.y) < 5) return
    const { journey: j, planned, cache, onChange } = latest.current
    const part = planned[leg]
    const plan = legPlans(j)[leg]
    if (!part || !plan) return
    const line = cache[part.sourceKey] ?? []
    const at = { lat: end.lngLat.lat, lon: end.lngLat.lng }
    const where = nearestTo(line, at)
    // After the stops of the leg that the line reaches before this point.
    const after = plan.stops.slice(1, -1).filter((s) => nearestTo(line, s) < where).length
    onChange(insertVia(j, leg, after, { id: Math.max(0, ...j.stops.map((s) => s.id)) + 1, name: '', ...at, via: true }), 'via')
  })
}
