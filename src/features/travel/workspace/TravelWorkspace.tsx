import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useTranslation } from 'react-i18next'
import i18n from '../../../i18n'
import CenterViewSwitch from '../../../components/CenterViewSwitch'
import { IconFit, IconLayers, IconMinus, IconPlus, IconRoute } from '../../../components/icons'
import { FORMATS } from '../../../core/formats/registry'
import { nextId } from '../../../store/defaults'
import { selectRouteParts } from '../../../store/derived'
import { useTrackFit } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { formatKm } from '../../../utils/format'
import { cumulativeDistanceKm } from '../../../utils/gpx'
import { vehicleFor } from '../../animation/vehicles'
import { asStyle, loadMapLibre } from '../../map/maplibre'
import { lngLatAt } from '../../map/model/placement'
import { buildStyle, creditFor } from '../../map/model/styles'
import { addStart, makeStop, moveStopTo, named, removeStop } from '../model/journey'
import { travelMode } from '../model/modes'
import { copyCoordinates, formatSpan } from '../panel/format'
import { placeAt } from '../providers/geocoding'
import { stopLetter, useTravelActions } from '../useTravel'
import FrameOutline from './FrameOutline'
import MapMenu, { type MenuItem } from './MapMenu'
import { addTripLayers, bendLine, lngLat, nearestLine, tripData, type Latest } from './tripLayers'
import { vehicleMarkerHtml } from './vehicleMarker'
import type { Stop } from '../../../types'
import './TravelWorkspace.css'

// A dragged stop waits this long for the pointer to rest before the leg is worked out again.
const DRAG_DELAY_MS = 400
// How long the pointer rests on the line before the hint on dragging it shows.
const LINE_HINT_MS = 600
// Height of the live preview in the corner; its width follows the format.
const PREVIEW_H = 176

const LOOKS = [
  { id: 'light', label: 'travel.workspace.looks.light', style: { styleId: 'positron', hillshade: false } },
  { id: 'topo', label: 'travel.workspace.looks.topo', style: { styleId: 'liberty', hillshade: true } },
  { id: 'satellite', label: 'travel.workspace.looks.satellite', style: { styleId: 'satellite', hillshade: false } },
] as const

type LookId = (typeof LOOKS)[number]['id']
// Remembered while the app is open, so leaving the tab and coming back keeps the look.
let rememberedLook: LookId = 'topo'

type Menu = { x: number; y: number; items: MenuItem[] }

const placeName = async (at: { lat: number; lon: number }) => (await placeAt(at, new AbortController().signal).catch(() => null))?.name ?? `${at.lat.toFixed(4)}, ${at.lon.toFixed(4)}`

// `aside`: width of the preview in the top right corner, which the places stay clear of.
function showPlaces(map: MapLibreMap, places: { lat: number; lon: number }[], aside: number) {
  if (!places.length) return
  if (places.length === 1) return void map.easeTo({ center: lngLat(places[0]), zoom: Math.max(map.getZoom(), 6) })
  const lons = places.map((s) => s.lon)
  const lats = places.map((s) => s.lat)
  const right = Math.min(aside + 40, map.getContainer().clientWidth * 0.4)
  map.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    // Clear of the controls on the left, the frame's label above it and the hint at the bottom.
    { padding: { top: 70, left: 76, right, bottom: 64 }, maxZoom: 12, duration: 600 },
  )
}

function pinElement(stop: Stop, letter: string, selected: boolean): HTMLElement {
  const element = document.createElement('div')
  element.className = stop.via ? 'trip-pin via' : selected ? 'trip-pin selected' : 'trip-pin'
  element.title = stop.via ? i18n.t('travel.workspace.viaPoint') : stop.name
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

function legLabelElement(path: string, outline: boolean, text: string): HTMLElement {
  const element = document.createElement('div')
  element.className = 'trip-leg-label'
  element.innerHTML = `<svg viewBox="-12 -12 24 24" width="16" height="16" aria-hidden="true"><path d="${path}" fill="${outline ? 'none' : 'currentColor'}" stroke="${outline ? 'currentColor' : 'none'}" stroke-width="1.6"/></svg>`
  element.append(text)
  return element
}

export default function TravelWorkspace({ preview }: { preview: (box: { width: number; height: number }) => ReactNode }) {
  const { t } = useTranslation()
  const { journey, change, addAt } = useTravelActions()
  const parts = useAppStore(selectRouteParts)
  const cache = useAppStore((s) => s.trackCache)
  const selection = useAppStore((s) => s.travelSelection)
  const insert = useAppStore((s) => s.travelInsert)
  const pick = useAppStore((s) => s.travelPick)
  const nextMode = useAppStore((s) => s.nextMode)
  const animation = useAppStore((s) => s.animation)
  const statsColor = useAppStore((s) => s.statsStyle.color)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const { selectTravel, setCenterView, setTravelInsert, setTravelPick } = useAppStore.getState()
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const transform = useAppStore((s) => s.routeTransform)
  const fit = useTrackFit()
  const ref = useRef<HTMLDivElement>(null)
  const lineHint = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [failed, setFailed] = useState(false)
  const [look, setLook] = useState<LookId>(rememberedLook)
  const [layersOpen, setLayersOpen] = useState(false)
  const [menu, setMenu] = useState<Menu | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const planned = useMemo(() => parts.filter((p) => p.plan), [parts])
  const selectedLeg = selection?.kind === 'leg' ? selection.index : null
  const highlight = insert ?? selectedLeg
  const data = useMemo(() => tripData(planned, cache, highlight), [planned, cache, highlight])
  const { w, h } = FORMATS[aspectKey]
  const frameW = w * slideCount
  const frameLabel = slideCount > 1 ? t('travel.workspace.carousel', { n: slideCount, aspect: aspectKey }) : t('travel.workspace.frame', { aspect: aspectKey })
  const stops = named(journey.stops)
  const frameCorners = fit
    ? [lngLatAt(fit, transform, { x: 0, y: 0 }), lngLatAt(fit, transform, { x: frameW, y: h })].map(([lon, lat]) => ({ lon, lat }))
    : null
  const previewBox = { width: Math.min(300, (PREVIEW_H * frameW) / h), height: PREVIEW_H }
  const aiming = insert != null || pick != null
  // The frame's corners and the preview's width for the map's own handlers.
  const viewRef = useRef({ frame: frameCorners, aside: previewBox.width })
  useEffect(() => {
    viewRef.current = { frame: frameCorners, aside: previewBox.width }
  })
  type Handlers = Latest & { addAt: typeof addAt; data: typeof data; select: typeof selectTravel; pick: number | null; aiming: boolean; nextMode: typeof nextMode }
  const latest = useRef<Handlers>({ journey, onChange: change, planned, cache, bentAt: 0, addAt, data, select: selectTravel, pick, aiming, nextMode })
  useEffect(() => {
    latest.current = { ...latest.current, journey, onChange: change, planned, cache, addAt, data, select: selectTravel, pick, aiming, nextMode }
  })

  // What a right click offers where it was made.
  function placeMenu(m: MapLibreMap, point: { x: number; y: number }, at: { lat: number; lon: number }) {
    const { journey: j, planned: legs, cache: points, onChange, addAt: add } = latest.current
    const count = named(j.stops).length
    const stop = async () => ({ ...at, name: await placeName(at), via: false })
    const nearest = legs.length ? nearestLine(point, legs.map((p) => (points[p.sourceKey] ?? []).filter((_, i, all) => i % Math.ceil(all.length / 300 || 1) === 0 || i === all.length - 1).map((q) => m.project(lngLat(q))))) : -1
    const items: MenuItem[] = [{ label: t('travel.workspace.menu.addEnd', { letter: stopLetter(count) }), run: async () => void add(await stop(), null) }]
    if (nearest >= 0) items.push({ label: t('travel.workspace.menu.insert', { from: stopLetter(nearest), to: stopLetter(nearest + 1) }), run: async () => void add(await stop(), nearest) })
    if (count > 0) items.push({ label: t('travel.workspace.menu.start'), run: async () => void onChange(addStart(j, { ...(await stop()), id: nextId(j.stops) }, latest.current.nextMode), 'add') })
    items.push({ label: t('travel.workspace.menu.copy'), run: () => copyCoordinates(at) })
    setMenu({ x: point.x, y: point.y, items })
  }

  function viaMenu(m: MapLibreMap, via: Stop) {
    const { x, y } = m.project(lngLat(via))
    setMenu({
      x,
      y,
      items: [
        { label: t('travel.workspace.via.remove'), run: () => void latest.current.onChange(removeStop(latest.current.journey, via.id), 'remove') },
        { label: t('travel.workspace.via.toStop'), run: async () => void latest.current.onChange(makeStop(latest.current.journey, via.id, await placeName(via)), 'stop') },
      ],
    })
  }

  // The map's handlers, attached once, open the newest menus.
  const menus = useRef({ placeMenu, viaMenu })
  useEffect(() => {
    menus.current = { placeMenu, viaMenu }
  })

  useEffect(() => {
    let created: MapLibreMap | null = null
    let cancelled = false
    let hintTimer: ReturnType<typeof setTimeout> | undefined
    loadMapLibre().then(
      ({ Map }) => {
        if (cancelled || !ref.current) return
        const m = new Map({ container: ref.current, style: { version: 8, sources: {}, layers: [] }, center: [15, 50], zoom: 3, attributionControl: false })
        created = m
        const cursor = (over: string) => (m.getCanvas().style.cursor = latest.current.aiming ? 'crosshair' : over)
        // The trip's layers go on every style the map takes.
        m.on('style.load', () => addTripLayers(m, latest.current.data))
        // A click on the line picks its leg; anywhere else adds a stop, or moves the one being placed.
        m.on('click', async (e) => {
          if (performance.now() - latest.current.bentAt < 300) return
          const { aiming: placing, pick: moving } = latest.current
          const hit = !placing && m.getLayer('trip-hit') ? m.queryRenderedFeatures(e.point, { layers: ['trip-hit'] })[0] : undefined
          if (hit) return latest.current.select({ kind: 'leg', index: Number(hit.properties?.leg) })
          const at = { lat: e.lngLat.lat, lon: e.lngLat.lng }
          if (moving != null) {
            useAppStore.getState().setTravelPick(null)
            return void latest.current.onChange(moveStopTo(latest.current.journey, moving, at, await placeName(at)), `place:${moving}`)
          }
          latest.current.addAt({ ...at, name: await placeName(at), via: false })
        })
        m.on('contextmenu', (e) => menus.current.placeMenu(m, e.point, { lat: e.lngLat.lat, lon: e.lngLat.lng }))
        m.on('mouseenter', 'trip-hit', () => cursor('grab'))
        m.on('mousemove', 'trip-hit', (e) => {
          const hint = lineHint.current
          if (!hint || latest.current.aiming) return
          hint.style.transform = `translate(${e.point.x}px, ${e.point.y}px)`
          if (hint.classList.contains('on')) return
          hint.classList.add('on')
          clearTimeout(hintTimer)
          hintTimer = setTimeout(() => hint.classList.add('show'), LINE_HINT_MS)
        })
        m.on('mouseleave', 'trip-hit', () => {
          cursor('')
          clearTimeout(hintTimer)
          lineHint.current?.classList.remove('on', 'show')
        })
        m.on('mousedown', 'trip-hit', (e) => {
          if (latest.current.aiming) return
          lineHint.current?.classList.remove('on', 'show')
          bendLine(m, e, latest)
        })
        setMap(m)
        // Opening the tab shows the whole trip.
        if (latest.current.journey.stops.length) m.once('load', () => showPlaces(m, [...latest.current.journey.stops, ...(viewRef.current.frame ?? [])], viewRef.current.aside))
      },
      () => setFailed(true),
    )
    return () => {
      cancelled = true
      clearTimeout(hintTimer)
      created?.remove()
    }
  }, [])

  useEffect(() => {
    if (map) map.getCanvas().style.cursor = aiming ? 'crosshair' : ''
  }, [map, aiming])

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
          if (stop.via) menus.current.viaMenu(map, stop)
          else selectTravel({ kind: 'stop', id: stop.id })
        })
        marker.on('drag', () => {
          clearTimeout(timer)
          timer = setTimeout(() => latest.current.onChange(moveStopTo(latest.current.journey, stop.id, moved()), `drag:${stop.id}`), DRAG_DELAY_MS)
        })
        marker.on('dragend', async () => {
          clearTimeout(timer)
          const at = moved()
          const name = stop.via ? undefined : await placeName(at)
          latest.current.onChange(moveStopTo(latest.current.journey, stop.id, at, name), `drag:${stop.id}`)
        })
        return marker
      })
      planned.forEach((part, leg) => {
        const points = cache[part.sourceKey] ?? []
        if (points.length < 3) return
        const mid = Math.floor(points.length / 2)
        const a = map.project(lngLat(points[Math.max(0, mid - 2)]))
        const b = map.project(lngLat(points[Math.min(points.length - 1, mid + 2)]))
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
        const vehicle = vehicleFor(part.vehicle)
        if (leg === highlight && part.plan) {
          const km = cumulativeDistanceKm(points)
          const ms = (points[points.length - 1].time ?? 0) - (points[0].time ?? 0)
          const icon = vehicleFor(travelMode(part.plan.mode).vehicle)
          const label = legLabelElement(icon.path, Boolean(icon.outline), `${formatKm(km[km.length - 1], 0)} · ${formatSpan(ms)}`)
          markers.current.push(new Marker({ element: label, anchor: 'bottom', offset: [0, -16] }).setLngLat(lngLat(points[mid])).addTo(map))
        }
        if (!vehicle.path) return
        const { html, art } = vehicleMarkerHtml(vehicle, animation, { style: statsColor, route: part.color || routeColor }, angle)
        const element = document.createElement('div')
        element.className = art ? 'trip-vehicle art' : 'trip-vehicle'
        element.innerHTML = html
        markers.current.push(new Marker({ element }).setLngLat(lngLat(points[mid])).addTo(map))
      })
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [map, journey, planned, cache, selectedStop, highlight, animation, statsColor, routeColor, selectTravel])

  // The view takes in the whole trip and the frame when a stop is added or removed, not while one is dragged.
  const count = journey.stops.length
  useEffect(() => {
    if (map && count) showPlaces(map, [...latest.current.journey.stops, ...(viewRef.current.frame ?? [])], viewRef.current.aside)
  }, [map, count])

  function onKeyDown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest('input, textarea, [role="menu"]')) return
    if (e.key === 'Escape') {
      setMenu(null)
      setLayersOpen(false)
      if (insert != null) setTravelInsert(null)
      if (pick != null) setTravelPick(null)
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStop != null) {
      void change(removeStop(journey, selectedStop), 'remove')
    } else if (e.key === 'f' || e.key === 'F') {
      if (map) showPlaces(map, journey.stops, previewBox.width)
    } else return
    e.preventDefault()
  }

  const hint = failed
    ? t('travel.workspace.mapFailed')
    : insert != null && stops[insert + 1]
      ? t('travel.workspace.hintInsert', { from: stopLetter(insert), to: stopLetter(insert + 1) })
      : t(journey.stops.length ? 'travel.workspace.hintEdit' : 'travel.workspace.hintAdd')
  const pickIndex = pick != null ? stops.findIndex((s) => s.id === pick) : -1

  return (
    <div className="map-workspace" onKeyDown={onKeyDown}>
      <div className="workspace-map">
        <div ref={ref} className="workspace-map-canvas" style={{ position: 'absolute', inset: 0 }} />
        {map && fit && <FrameOutline map={map} fit={fit} width={frameW} height={h} label={frameLabel} />}
        <div className="workspace-top">
          <CenterViewSwitch />
          <div className="workspace-layers">
            <button type="button" className="workspace-layers-btn" aria-expanded={layersOpen} aria-label={t('travel.workspace.layers')} onClick={() => setLayersOpen(!layersOpen)}>
              <IconLayers />
              {t(lookDef.label)}
            </button>
            {layersOpen && (
              <div className="workspace-layers-list" role="radiogroup" aria-label={t('travel.workspace.looksLabel')}>
                {LOOKS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={l.id === look}
                    onClick={() => {
                      rememberedLook = l.id
                      setLook(l.id)
                      setLayersOpen(false)
                    }}
                  >
                    {t(l.label)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="workspace-controls">
          <button type="button" title={t('travel.workspace.zoomIn')} aria-label={t('travel.workspace.zoomIn')} onClick={() => map?.zoomIn()}>
            <IconPlus />
          </button>
          <button type="button" title={t('travel.workspace.zoomOut')} aria-label={t('travel.workspace.zoomOut')} onClick={() => map?.zoomOut()}>
            <IconMinus />
          </button>
          <button
            type="button"
            title={`${t('travel.workspace.fitRoute')} (F)`}
            aria-label={t('travel.workspace.fitRoute')}
            disabled={!journey.stops.length}
            onClick={() => map && showPlaces(map, journey.stops, previewBox.width)}
          >
            <IconRoute />
          </button>
          <button
            type="button"
            title={t('travel.workspace.fitFrame')}
            aria-label={t('travel.workspace.fitFrame')}
            disabled={!frameCorners}
            onClick={() => map && frameCorners && showPlaces(map, frameCorners, previewBox.width)}
          >
            <IconFit />
          </button>
        </div>
        {pickIndex >= 0 && (
          <p className="workspace-banner" role="status">
            {t('travel.workspace.pickBanner', { letter: stopLetter(pickIndex) })}
          </p>
        )}
        <div ref={lineHint} className="workspace-line-hint" aria-hidden="true">
          <span className="workspace-line-dot" />
          <span className="workspace-line-text">{t('travel.workspace.lineHint')}</span>
        </div>
        {menu && <MapMenu x={menu.x} y={menu.y} label={t('travel.workspace.menu.label')} items={menu.items} onClose={closeMenu} />}
        <button type="button" className="workspace-preview" onClick={() => setCenterView('frame')} title={t('travel.workspace.toFrame')}>
          <span className="workspace-preview-frame" style={previewBox}>
            {preview(previewBox)}
          </span>
          <span className="workspace-preview-label">{t('travel.workspace.livePreview')}</span>
        </button>
        <p className="workspace-hint">{hint}</p>
        <small className="workspace-credit">{creditFor({ ...lookDef.style })}</small>
      </div>
    </div>
  )
}
