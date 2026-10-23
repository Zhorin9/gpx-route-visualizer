import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import type { RefObject } from 'react'
import { insertVia, legPlans, type Journey } from '../model/journey'
import { lineOf } from '../model/modes'
import type { GpxPoint, TrackPart } from '../../../types'

// Line colours on the planning map: the trip in ink, the leg being edited in the accent.
const INK = '#24351f'
const ACCENT = '#b68235'

export const lngLat = (p: { lat: number; lon: number }): [number, number] => [p.lon, p.lat]

// Index of the point of `points` nearest to `at` (degrees, longitude shrunk with latitude).
export function nearestIndex(points: GpxPoint[], at: { lat: number; lon: number }): number {
  const k = Math.cos((at.lat * Math.PI) / 180) ** 2
  let best = 0
  let bestD = Infinity
  points.forEach((p, i) => {
    const d = (p.lat - at.lat) ** 2 + (p.lon - at.lon) ** 2 * k
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

// How a leg's line is drawn: a road solid, a bike dotted, a flight or straight line dashed.
function dashOf(part: TrackPart): 'solid' | 'dotted' | 'dashed' {
  if (!part.plan) return 'solid'
  if (lineOf(part.plan) !== 'road') return 'dashed'
  return part.plan.mode === 'bike' || part.plan.mode === 'foot' ? 'dotted' : 'solid'
}

export function tripData(planned: TrackPart[], cache: Record<string, GpxPoint[]>, selectedLeg: number | null) {
  return {
    type: 'FeatureCollection' as const,
    features: planned.map((p, leg) => ({
      type: 'Feature' as const,
      properties: { leg, dash: dashOf(p), selected: leg === selectedLeg },
      geometry: { type: 'LineString' as const, coordinates: (cache[p.sourceKey] ?? []).map(lngLat) },
    })),
  }
}

// The trip's source and layers; added again whenever the map's style is swapped (Jasna, Topo, Satelita).
export function addTripLayers(map: MapLibreMap, data: ReturnType<typeof tripData>) {
  if (map.getSource('trip')) return void (map.getSource('trip') as GeoJSONSource).setData(data)
  map.addSource('trip', { type: 'geojson', data })
  const color = ['case', ['get', 'selected'], ACCENT, INK] as unknown as string
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const
  // A pale casing keeps the line readable on a satellite photo.
  map.addLayer({ id: 'trip-casing', type: 'line', source: 'trip', paint: { 'line-color': '#f3f2f2', 'line-width': 7, 'line-opacity': 0.7 }, layout })
  map.addLayer({ id: 'trip-solid', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'solid'], paint: { 'line-color': color, 'line-width': 4 }, layout })
  map.addLayer({ id: 'trip-dotted', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'dotted'], paint: { 'line-color': color, 'line-width': 4, 'line-dasharray': [0.25, 2.25] }, layout })
  map.addLayer({ id: 'trip-dashed', type: 'line', source: 'trip', filter: ['==', ['get', 'dash'], 'dashed'], paint: { 'line-color': color, 'line-width': 3, 'line-dasharray': [3.7, 2.7] }, layout: { 'line-join': 'round' } })
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

// Dragging the line places a via point where the pointer is let go.
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
    const where = nearestIndex(line, at)
    // After the stops of the leg that the line reaches before this point.
    const after = plan.stops.slice(1, -1).filter((s) => nearestIndex(line, s) < where).length
    onChange(insertVia(j, leg, after, { id: Math.max(0, ...j.stops.map((s) => s.id)) + 1, name: '', ...at, via: true }), 'via')
  })
}
