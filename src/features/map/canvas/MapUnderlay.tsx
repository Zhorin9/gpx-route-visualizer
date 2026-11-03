import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useShallow } from 'zustand/react/shallow'
import { FORMATS } from '../../../core/formats/registry'
import { useViewTransform } from '../../../core/route/view'
import { useTrackFit } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { ensureFontLoaded } from '../../../utils/fonts'
import { asStyle, loadMapLibre, publishMapScene, styleKey } from '../maplibre'
import { mapCamera } from '../model/placement'
import { buildStyle, mapFilter } from '../model/styles'
import { drawSketch } from '../sketch/draw'
import { sketchFrame } from '../sketch/frame'
import { mapTone } from '../store'

// The live map under the frame in the editor. It follows the route as drawn (moved, turned,
// scaled, and the camera of the animation) and tells the export what it shows.
function LiveMap({ previewScale }: { previewScale: number }) {
  const settings = useAppStore((s) => s.map)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  const fit = useTrackFit()
  const transform = useViewTransform()
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  // The style last drawn in full, and one that failed to load.
  const [shown, setShown] = useState('')
  const [failed, setFailed] = useState('')
  const { w, h } = FORMATS[aspectKey]
  const width = w * slideCount

  useLayoutEffect(() => publishMapScene({ settings, fit, transform }))
  useEffect(() => () => publishMapScene(null), [])

  useEffect(() => {
    let created: MapLibreMap | null = null
    let cancelled = false
    loadMapLibre().then(
      ({ Map }) => {
        if (cancelled || !ref.current) return
        created = new Map({ container: ref.current, style: { version: 8, sources: {}, layers: [] }, interactive: false, attributionControl: false, fadeDuration: 0 })
        setMap(created)
      },
      () => setFailed('maplibre'),
    )
    return () => {
      cancelled = true
      created?.remove()
    }
  }, [])

  // The style depends on these settings only; dimming and blur are CSS.
  const { styleId, palette, labels, hillshade } = settings
  const key = styleKey(settings)
  useEffect(() => {
    if (!map) return
    let stale = false
    buildStyle({ styleId, palette, labels, hillshade }).then(
      (style) => {
        if (stale) return
        map.setStyle(asStyle(style))
        map.once('idle', () => setShown(key))
      },
      () => !stale && setFailed(key),
    )
    return () => {
      stale = true
    }
  }, [map, key, styleId, palette, labels, hillshade])

  // Resizing rebuilds the map's canvas, so only when the frame's size changes; moving it is cheap.
  useEffect(() => {
    map?.resize()
  }, [map, width, h, previewScale])
  const { center, zoom, bearing } = mapCamera(fit, transform, { x: width / 2, y: h / 2 }, previewScale)
  const [lon, lat] = center
  useEffect(() => {
    map?.jumpTo({ center: [lon, lat], zoom, bearing })
  }, [map, lon, lat, zoom, bearing])

  const dark = mapTone(settings) === 'dark'
  const status = failed === key || failed === 'maplibre' ? 'error' : shown === key ? 'ready' : 'loading'
  return (
    <div
      className="map-underlay"
      style={{ width: width * previewScale, height: h * previewScale, background: settings.palette?.land ?? (dark ? '#2b2c30' : '#ecebe7') }}
      aria-hidden="true"
    >
      {/* Sized inline: MapLibre's own stylesheet makes its container relative. */}
      <div ref={ref} className="map-underlay-map" style={{ position: 'absolute', inset: 0, filter: mapFilter(settings, previewScale) }} />
      {settings.dim !== 0 && <div className="map-underlay-dim" style={{ background: settings.dim > 0 ? '#000' : '#fff', opacity: Math.abs(settings.dim) }} />}
      {status !== 'ready' && <span className={dark ? 'map-status dark' : 'map-status'}>{status === 'error' ? 'Mapa niedostępna, sprawdź połączenie' : 'Wczytuję mapę…'}</span>}
    </div>
  )
}

// The sketch, drawn by us: the route's OSM features fetched once, then the same pixels every time.
function SketchMap({ previewScale }: { previewScale: number }) {
  const state = useAppStore(
    useShallow((s) => ({ routeSource: s.routeSource, trackCache: s.trackCache, aspectKey: s.aspectKey, slides: s.slides, map: s.map, sketchLayers: s.sketchLayers })),
  )
  const loadSketchLayers = useAppStore((s) => s.loadSketchLayers)
  useAppStore((s) => s.fontsVersion)
  const fit = useTrackFit()
  const transform = useViewTransform()
  const ref = useRef<HTMLCanvasElement>(null)
  const frame = sketchFrame(state, fit, transform)
  const ratio = previewScale * (window.devicePixelRatio || 1)

  useLayoutEffect(() => publishMapScene({ settings: state.map, fit, transform }))
  useEffect(() => () => publishMapScene(null), [])
  useEffect(() => loadSketchLayers(), [loadSketchLayers, state.routeSource, state.trackCache])
  // Names are drawn in Caveat; canvas text won't wait for it.
  useEffect(() => {
    ensureFontLoaded('Caveat').then(() => useAppStore.getState().bumpFontsVersion())
  }, [])

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.canvas.width = Math.round(frame.width * ratio)
    ctx.canvas.height = Math.round(frame.height * ratio)
    drawSketch(ctx, frame, ratio)
  })

  return <canvas ref={ref} className="map-underlay" style={{ width: frame.width * previewScale, height: frame.height * previewScale }} aria-hidden="true" />
}

export default function MapUnderlay({ previewScale }: { previewScale: number }) {
  const on = useAppStore((s) => s.collage.bgKind === 'map')
  const sketch = useAppStore((s) => s.map.kind === 'sketch')
  if (!on) return null
  return sketch ? <SketchMap previewScale={previewScale} /> : <LiveMap previewScale={previewScale} />
}
