import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import CenterViewSwitch from '../../../components/CenterViewSwitch'
import { FORMATS } from '../../../core/formats/registry'
import { selectRouteParts } from '../../../store/derived'
import { useTrackFit } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { artUrl } from '../../animation/vehicleArt'
import { vehicleFor, type VehicleDef } from '../../animation/vehicles'
import { asStyle, loadMapLibre } from '../../map/maplibre'
import { lngLatAt } from '../../map/model/placement'
import { buildStyle, creditFor } from '../../map/model/styles'
import { moveStopTo, named } from '../model/journey'
import PlaceSearch from '../panel/PlaceSearch'
import { placeAt } from '../providers/geocoding'
import { stopLetter, useTravelActions } from '../useTravel'
import FrameOutline from './FrameOutline'
import { addTripLayers, bendLine, lngLat, tripData, type Latest } from './tripLayers'
import type { Stop } from '../../../types'
import './TravelWorkspace.css'

export const TRAVEL_SEARCH_ID = 'travel-search'

// A dragged stop waits this long for the pointer to rest before the leg is worked out again.
const DRAG_DELAY_MS = 400
// Height of the live preview in the corner; its width follows the format.
const PREVIEW_H = 176

const LOOKS = [
  { id: 'light', label: 'Jasna', style: { styleId: 'positron', hillshade: false } },
  { id: 'topo', label: 'Topo', style: { styleId: 'liberty', hillshade: true } },
  { id: 'satellite', label: 'Satelita', style: { styleId: 'satellite', hillshade: false } },
] as const

type LookId = (typeof LOOKS)[number]['id']
// Remembered while the app is open, so leaving the tab and coming back keeps the look.
let rememberedLook: LookId = 'topo'

// Brings every stop into view; a single stop is shown close up.
function showPlaces(map: MapLibreMap, places: { lat: number; lon: number }[]) {
  if (!places.length) return
  if (places.length === 1) return void map.easeTo({ center: lngLat(places[0]), zoom: Math.max(map.getZoom(), 6) })
  const lons = places.map((s) => s.lon)
  const lats = places.map((s) => s.lat)
  map.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    // Clear of the buttons on the left, the frame's label above it and the hints at the bottom.
    { padding: { top: 60, left: 170, right: 60, bottom: 90 }, maxZoom: 12, duration: 600 },
  )
}

function pinElement(stop: Stop, letter: string, selected: boolean): HTMLElement {
  const element = document.createElement('div')
  element.className = stop.via ? 'trip-pin via' : selected ? 'trip-pin selected' : 'trip-pin'
  element.title = stop.via ? 'Punkt pośredni' : stop.name
  if (!stop.via) {
    const dot = document.createElement('span')
    dot.className = 'trip-pin-dot'
    dot.textContent = letter
    const name = document.createElement('span')
    name.className = 'trip-pin-name'
    name.textContent = stop.name
    element.append(dot, name)
  }
  return element
}

// The leg's vehicle in a ring at the middle of its line, pointing the way it goes.
// An illustrated vehicle shows its picture; the others their outline.
function vehicleElement(vehicle: VehicleDef, angle: number, flip: boolean): HTMLElement {
  const element = document.createElement('div')
  element.className = vehicle.art ? 'trip-vehicle art' : 'trip-vehicle'
  const turn = `transform:rotate(${angle}deg)${flip ? ' scaleY(-1)' : ''}`
  element.innerHTML = vehicle.art
    ? `<img src="${artUrl(vehicle.art)}" width="34" height="17" alt="" style="${turn}">`
    : `<svg viewBox="-12 -12 24 24" width="18" height="18" style="${turn}"><path d="${vehicle.path}" fill="currentColor"/></svg>`
  return element
}

// The Podróż tab's workspace: a large map with the trip, the frame of the graphic laid on it and
// a live preview of the graphic in the corner.
export default function TravelWorkspace({ preview }: { preview: (box: { width: number; height: number }) => ReactNode }) {
  const { journey, change, addAt } = useTravelActions()
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const selection = useAppStore((s) => s.travelSelection)
  const selectTravel = useAppStore((s) => s.selectTravel)
  const setCenterView = useAppStore((s) => s.setCenterView)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const transform = useAppStore((s) => s.routeTransform)
  const fit = useTrackFit()
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [failed, setFailed] = useState(false)
  const [look, setLook] = useState<LookId>(rememberedLook)

  const planned = useMemo(() => parts.filter((p) => p.plan), [parts])
  const selectedLeg = selection?.kind === 'leg' ? selection.index : null
  const data = useMemo(() => tripData(planned, cache, selectedLeg), [planned, cache, selectedLeg])
  const { w, h } = FORMATS[aspectKey]
  const frameW = w * slideCount
  const frameLabel = slideCount > 1 ? `Karuzela ${slideCount} × ${aspectKey}` : `Kadr ${aspectKey}`
  const stops = named(journey.stops)
  const frameCorners = fit
    ? [lngLatAt(fit, transform, { x: 0, y: 0 }), lngLatAt(fit, transform, { x: frameW, y: h })].map(([lon, lat]) => ({ lon, lat }))
    : null
  // The frame's corners for the map's own handlers.
  const frameRef = useRef(frameCorners)
  useEffect(() => {
    frameRef.current = frameCorners
  })
  const latest = useRef<Latest & { addAt: typeof addAt; data: typeof data; select: typeof selectTravel }>({ journey, onChange: change, planned, cache, bentAt: 0, addAt, data, select: selectTravel })
  useEffect(() => {
    latest.current = { ...latest.current, journey, onChange: change, planned, cache, addAt, data, select: selectTravel }
  })

  useEffect(() => {
    let created: MapLibreMap | null = null
    let cancelled = false
    loadMapLibre().then(
      ({ Map }) => {
        if (cancelled || !ref.current) return
        const m = new Map({ container: ref.current, style: { version: 8, sources: {}, layers: [] }, center: [15, 50], zoom: 3, attributionControl: false })
        created = m
        // The trip's layers go on every style the map takes.
        m.on('style.load', () => addTripLayers(m, latest.current.data))
        // A click on the line picks its leg; anywhere else adds a stop named after the place there.
        m.on('click', async (e) => {
          if (performance.now() - latest.current.bentAt < 300) return
          const hit = m.getLayer('trip-hit') ? m.queryRenderedFeatures(e.point, { layers: ['trip-hit'] })[0] : undefined
          if (hit) return latest.current.select({ kind: 'leg', index: Number(hit.properties?.leg) })
          const at = { lat: e.lngLat.lat, lon: e.lngLat.lng }
          const place = await placeAt(at, new AbortController().signal).catch(() => null)
          latest.current.addAt({ ...at, name: place?.name ?? `${at.lat.toFixed(4)}, ${at.lon.toFixed(4)}`, via: false })
        })
        m.on('mouseenter', 'trip-hit', () => (m.getCanvas().style.cursor = 'grab'))
        m.on('mouseleave', 'trip-hit', () => (m.getCanvas().style.cursor = ''))
        m.on('mousedown', 'trip-hit', (e) => bendLine(m, e, latest))
        setMap(m)
        // Opening the tab shows the whole trip.
        const stops = latest.current.journey.stops
        if (stops.length) m.once('load', () => showPlaces(m, [...stops, ...(frameRef.current ?? [])]))
      },
      () => setFailed(true),
    )
    return () => {
      cancelled = true
      created?.remove()
    }
  }, [])

  // Jasna, Topo or Satelita: the planning map only; the graphic's background is set in Tło.
  const lookDef = LOOKS.find((l) => l.id === look) ?? LOOKS[1]
  useEffect(() => {
    if (!map) return
    let stale = false
    buildStyle({ ...lookDef.style, palette: null, labels: true }).then(
      (style) => !stale && map.setStyle(asStyle(style)),
      () => !stale && setFailed(true),
    )
    return () => {
      stale = true
    }
  }, [map, lookDef])

  useEffect(() => {
    if (map?.isStyleLoaded()) addTripLayers(map, data)
  }, [map, data])

  // A pin per stop; the line follows a dragged pin after a short rest, and once more where it is let go.
  const markers = useRef<Marker[]>([])
  const selectedStop = selection?.kind === 'stop' ? selection.id : null
  useEffect(() => {
    if (!map) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    loadMapLibre().then(({ Marker }) => {
      if (cancelled) return
      markers.current.forEach((m) => m.remove())
      const letters = new Map(named(journey.stops).map((s, i) => [s.id, stopLetter(i)]))
      markers.current = journey.stops.map((stop) => {
        const marker = new Marker({ element: pinElement(stop, letters.get(stop.id) ?? '', stop.id === selectedStop), draggable: true, anchor: stop.via ? 'center' : 'left', offset: stop.via ? [0, 0] : [-12, 0] })
          .setLngLat(lngLat(stop))
          .addTo(map)
        const moved = () => ({ lat: marker.getLngLat().lat, lon: marker.getLngLat().lng })
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation()
          if (!stop.via) selectTravel({ kind: 'stop', id: stop.id })
        })
        marker.on('drag', () => {
          clearTimeout(timer)
          timer = setTimeout(() => latest.current.onChange(moveStopTo(latest.current.journey, stop.id, moved()), `drag:${stop.id}`), DRAG_DELAY_MS)
        })
        marker.on('dragend', async () => {
          clearTimeout(timer)
          const at = moved()
          const place = stop.via ? null : await placeAt(at, new AbortController().signal).catch(() => null)
          latest.current.onChange(moveStopTo(latest.current.journey, stop.id, at, place?.name), `drag:${stop.id}`)
        })
        return marker
      })
      // Each leg's vehicle at the middle of its line.
      planned.forEach((part) => {
        const points = cache[part.sourceKey] ?? []
        if (points.length < 3) return
        const mid = Math.floor(points.length / 2)
        const a = map.project(lngLat(points[Math.max(0, mid - 2)]))
        const b = map.project(lngLat(points[Math.min(points.length - 1, mid + 2)]))
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
        const vehicle = vehicleFor(part.vehicle)
        if (!vehicle.path) return
        const west = vehicle.flipWhenWest && Math.abs(angle) > 90
        markers.current.push(new Marker({ element: vehicleElement(vehicle, angle, west) }).setLngLat(lngLat(points[mid])).addTo(map))
      })
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [map, journey, planned, cache, selectedStop, selectTravel])


  // The view takes in the whole trip and the frame when a stop is added or removed, not while one is dragged.
  const count = journey.stops.length
  useEffect(() => {
    if (map && count) showPlaces(map, [...latest.current.journey.stops, ...(frameRef.current ?? [])])
  }, [map, count])
  const previewBox = { width: Math.min(300, (PREVIEW_H * frameW) / h), height: PREVIEW_H }

  return (
    <div className="map-workspace">
      <div className="workspace-toolbar">
        <CenterViewSwitch />
        <PlaceSearch
          inputId={TRAVEL_SEARCH_ID}
          label="Szukaj miejsca lub współrzędnych"
          near={stops[stops.length - 1] ?? null}
          onPick={(place) => addAt({ name: place.name, lat: place.lat, lon: place.lon, via: false })}
        />
        <div className="workspace-looks" role="radiogroup" aria-label="Wygląd mapy">
          {LOOKS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={l.id === look}
              className={l.id === look ? 'tag tag-accent' : 'tag tag-outline'}
              onClick={() => {
                rememberedLook = l.id
                setLook(l.id)
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <span className="workspace-format">
          {frameLabel} · {w}×{h} px
        </span>
      </div>

      <div className="workspace-map">
        <div ref={ref} className="workspace-map-canvas" style={{ position: 'absolute', inset: 0 }} />
        {map && fit && <FrameOutline map={map} fit={fit} width={frameW} height={h} label={frameLabel} />}
        <div className="workspace-zoom">
          <button type="button" aria-label="Przybliż" onClick={() => map?.zoomIn()}>
            +
          </button>
          <button type="button" aria-label="Oddal" onClick={() => map?.zoomOut()}>
            −
          </button>
        </div>
        <div className="workspace-fit">
          <button type="button" disabled={!journey.stops.length} onClick={() => map && showPlaces(map, journey.stops)}>
            Dopasuj do trasy
          </button>
          <button
            type="button"
            disabled={!frameCorners}
            onClick={() => map && frameCorners && showPlaces(map, frameCorners)}
          >
            Dopasuj do kadru
          </button>
        </div>
        <button type="button" className="workspace-preview" onClick={() => setCenterView('frame')} title="Przejdź do kadru">
          <span className="workspace-preview-frame" style={previewBox}>
            {preview(previewBox)}
          </span>
          <span className="workspace-preview-label">Podgląd na żywo</span>
        </button>
        <div className="workspace-hints">
          <span>Kliknij mapę, aby dodać przystanek</span>
          <span className="text-muted">Przeciągnij pinezkę, aby ją przesunąć</span>
          <span className="text-muted">Przeciągnij linię, aby dodać punkt pośredni</span>
          <span className="text-muted workspace-credit">{failed ? 'Mapa się nie wczytała, sprawdź połączenie' : creditFor({ ...lookDef.style })}</span>
        </div>
      </div>
    </div>
  )
}
