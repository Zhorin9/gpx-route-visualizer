import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Line, Rect, Text } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../core/formats/registry'
import { selectRouteDays, selectRouteParts, selectTrack } from '../../store/derived'
import { useRangeStats } from '../../store/selectors'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import useSettled from '../../hooks/useSettled'
import { renderMapImage } from '../map/maplibre'
import { provideSharpener } from '../../utils/exportElement'
import { DEFAULT_MAP } from '../map/types'
import { DEFAULT_MAP_STICKER, LOOK_DRAWING, STICKER_INK, resolvedShape, stickerKind, type MapSticker } from './model'
import { BORDER, panLimit, stickerLayout } from './layout'
import { stageHandle } from '../../utils/exportImage'
import type { MercatorFit } from '../../utils/gpx'
import useCountryRings from './useCountryRings'
import { usePanningSticker } from './panMode'
import { labelSpan } from './labels'

// Shares of the sticker's width, as on the style board.
const HARD_SHADOW = 0.02
const ROUTE = 0.016
// Map pixels per frame pixel: sharp in a 2× file.
const MAP_SCALE = 2
const MAX_MAP_SIDE_PX = 4096
const OTHER_DAYS_OPACITY = 0.22
const LABEL_SIZE = 0.034

const measureCanvas = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')

function textWidth(text: string, fontFamily: string, fontSize: number, letterSpacing: number): number {
  if (!measureCanvas) return text.length * fontSize * 0.6
  measureCanvas.font = `${fontSize}px "${fontFamily}"`
  return measureCanvas.measureText(text).width + letterSpacing * text.length
}

interface RenderedMap {
  canvas: HTMLCanvasElement
  fit: MercatorFit
}

export default function MapStickerNode({ sticker }: { sticker: MapSticker }) {
  const kind = stickerKind(sticker.id)
  const updateMapSticker = useAppStore((s) => s.updateMapSticker)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const { w, h, safeZone } = FORMATS[aspectKey]
  const W = Math.round(w * (sticker.size ?? DEFAULT_MAP_STICKER.size))
  const margin = sticker.margin ?? DEFAULT_MAP_STICKER.margin

  const days = useAppStore(selectRouteDays)
  const parts = useAppStore(selectRouteParts)
  const waypoints = useAppStore((s) => s.waypoints)
  const scope = sticker.scope ?? DEFAULT_MAP_STICKER.scope
  const day = scope.kind === 'day' ? days[scope.day] : undefined
  const otherDaysOpacity = scope.kind === 'day' && scope.only ? 0 : OTHER_DAYS_OPACITY

  const lo = Math.floor(range.start)
  const hi = Math.ceil(range.end)
  const distanceKm = useRangeStats()?.distanceKm ?? 0
  const shape = resolvedShape(sticker.shape ?? DEFAULT_MAP_STICKER.shape, distanceKm)
  const country = useCountryRings(track?.points, lo, hi, shape === 'country')
  const countryRings = country?.rings ?? null

  const zoom = sticker.zoom ?? 1
  const panning = usePanningSticker((p) => p.id === sticker.id)
  const [panDraft, setPanDraft] = useState<{ x: number; y: number } | null>(null)
  const pan = panDraft ?? sticker.pan ?? DEFAULT_MAP_STICKER.pan
  const layout = useMemo(
    () => (track ? stickerLayout({ points: track.points, lo, hi, day, parts, W, margin, countryRings, zoom, pan: { x: pan.x, y: pan.y } }) : null),
    [track, lo, hi, W, margin, day, parts, countryRings, zoom, pan.x, pan.y],
  )

  const [map, setMap] = useState<RenderedMap | null>(null)
  const sharpShown = useRef(false)
  const { styleId, palette } = sticker
  const current = useMemo(() => layout && { layout, W, styleId, palette }, [layout, W, styleId, palette])
  const wanted = useSettled(current)
  useEffect(() => {
    if (!wanted) return
    let live = true
    const settings = { ...DEFAULT_MAP, styleId: wanted.styleId, palette: wanted.palette, labels: false }
    // Offline the sticker keeps its land colour; the route still shows.
    renderMapImage({ settings, fit: wanted.layout.fit, transform: IDENTITY_TRANSFORM }, wanted.W, wanted.layout.H, MAP_SCALE)
      .then((canvas) => live && !sharpShown.current && setMap({ canvas, fit: wanted.layout.fit }))
      .catch(() => live && !sharpShown.current && setMap(null))
    return () => {
      live = false
    }
  }, [wanted])

  const latest = useRef(current)
  latest.current = current
  useEffect(
    () =>
      provideSharpener({ kind: 'element', element: kind }, async (filePxPerFramePx) => {
        const want = latest.current
        if (!want) return () => {}
        const settings = { ...DEFAULT_MAP, styleId: want.styleId, palette: want.palette, labels: false }
        const scale = Math.min(Math.max(filePxPerFramePx, MAP_SCALE), MAX_MAP_SIDE_PX / Math.max(want.W, want.layout.H))
        const sharp = await renderMapImage({ settings, fit: want.layout.fit, transform: IDENTITY_TRANSFORM }, want.W, want.layout.H, scale).catch(() => null)
        if (!sharp) return () => {}
        const shown = { canvas: sharp, fit: want.layout.fit }
        let preview: RenderedMap | null = null
        sharpShown.current = true
        setMap((current) => ((preview = current), shown))
        return () => {
          sharpShown.current = false
          setMap((current) => (current === shown ? preview : current))
        }
      }),
    [kind],
  )

  function panWithPointer(evt: MouseEvent | TouchEvent): boolean {
    const altDrag = evt instanceof MouseEvent && evt.altKey
    if (zoom <= 1 || !(altDrag || panning)) return false
    const start = 'touches' in evt ? (evt.touches[0] ?? evt.changedTouches[0]) : evt
    if (!start) return false
    const startX = start.clientX
    const startY = start.clientY
    const from = sticker.pan ?? DEFAULT_MAP_STICKER.pan
    const framePx = 1 / (stageHandle.current?.scaleX() ?? 1)
    const limit = panLimit(zoom)
    const panAt = (e: PointerEvent) => ({
      x: Math.min(limit, Math.max(-limit, from.x - ((e.clientX - startX) * framePx) / (W * zoom))),
      y: Math.min(limit, Math.max(-limit, from.y - ((e.clientY - startY) * framePx) / ((layout?.H ?? W) * zoom))),
    })
    const move = (e: PointerEvent) => setPanDraft(panAt(e))
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', stop)
      setPanDraft(null)
    }
    const end = (e: PointerEvent) => {
      stop()
      updateMapSticker(sticker.id, { pan: panAt(e) })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', stop)
    return true
  }

  if (!layout) return null
  const { H, outlines, legs, fit, cut } = layout
  const labelSize = W * LABEL_SIZE
  const labels = sticker.labels
    ? waypoints
        .filter((wp) => wp.kind !== 'icon' && wp.text.trim() && Math.round(wp.trackPos) >= layout.focusLo && Math.round(wp.trackPos) <= layout.focusHi)
        .map((wp) => ({ wp, at: layout.at(Math.round(wp.trackPos)) }))
        .filter(({ at: [x, y] }) => !layout.cut || (x >= 0 && x <= W && y >= 0 && y <= layout.H))
        .map(({ wp, at: [x, y] }) => {
          const text = wp.text.trim().toLocaleUpperCase()
          const spacing = labelSize * 0.04
          const span = labelSpan(x, textWidth(text, wp.fontFamily, labelSize, spacing), labelSize * 0.55, -W * margin, W * (1 + margin))
          return { id: wp.id, x, y, text, fontFamily: wp.fontFamily, spacing, left: span.left }
        })
    : []
  const drawing = LOOK_DRAWING[sticker.look ?? DEFAULT_MAP_STICKER.look]
  const edgeColor = { none: null, white: '#ffffff', ink: STICKER_INK }[sticker.edge ?? DEFAULT_MAP_STICKER.edge]
  const edgeWidth = edgeColor ? W * BORDER * 2 : 0
  const routeWidth = W * ROUTE * drawing.routeWidthFactor
  const labelColor = sticker.labelColor ?? DEFAULT_MAP_STICKER.labelColor
  const clip = (ctx: { beginPath: () => void; moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void; closePath: () => void }) => {
    ctx.beginPath()
    for (const outline of outlines) {
      ctx.moveTo(outline[0], outline[1])
      for (let i = 2; i < outline.length; i += 2) ctx.lineTo(outline[i], outline[i + 1])
      ctx.closePath()
    }
  }

  return (
    <DraggableElement
      kind={kind}
      rotation={sticker.rotation ?? 0}
      takesDrag={panWithPointer}
      width={W}
      height={H}
      defaultX={w - (safeZone?.right ?? 0) - W - w * 0.06}
      defaultY={h - Math.min(bottomInset(aspectKey), (safeZone?.bottom ?? 0) + w * 0.06) - H}
    >
      {sticker.shadow === 'hard' &&
        outlines.map((outline, i) => (
          <Line key={`hard-${i}`} points={outline} closed x={W * HARD_SHADOW} y={W * HARD_SHADOW} fill={STICKER_INK} stroke={STICKER_INK} strokeWidth={edgeWidth} lineJoin="round" listening={false} />
        ))}
      {/* The edge, rounded by its joins, casts the sticker's shadow. */}
      {outlines.map((outline, i) => (
      <Line
        key={`edge-${i}`}
        points={outline}
        closed
        fill={edgeColor ?? sticker.palette.land}
        stroke={edgeColor ?? undefined}
        strokeWidth={edgeWidth}
        lineJoin="round"
        shadowEnabled={sticker.shadow === 'soft'}
        shadowColor="#000000"
        shadowBlur={W * 0.04}
        shadowOffsetY={W * 0.025}
        shadowOpacity={0.35}
        listening={false}
      />
      ))}
      <Group clipFunc={clip} listening={false}>
        <Rect width={W} height={H} fill={sticker.palette.land} />
        {map && (
          <KonvaImage
            image={map.canvas}
            x={(map.fit.x0 - fit.x0) * fit.scale}
            y={(map.fit.y0 - fit.y0) * fit.scale}
            width={(W * fit.scale) / map.fit.scale}
            height={(H * fit.scale) / map.fit.scale}
          />
        )}
      </Group>
      {drawing.contourShare > 0 &&
        outlines.map((outline, i) => <Line key={`contour-${i}`} points={outline} closed stroke={STICKER_INK} strokeWidth={W * drawing.contourShare} lineJoin="round" listening={false} />)}
      {otherDaysOpacity > 0 && (
        <Group clipFunc={clip} opacity={otherDaysOpacity} listening={false}>
          {legs.filter((leg) => !leg.inFocus).map((leg) => (
            <Line key={leg.id} points={leg.points} stroke={sticker.route} strokeWidth={routeWidth} dash={leg.dashed ? [routeWidth * 2, routeWidth * 1.6] : undefined} lineJoin="round" lineCap="round" perfectDrawEnabled={false} />
          ))}
        </Group>
      )}
      <Group listening={false} {...(cut ? { clipX: 0, clipY: 0, clipWidth: W, clipHeight: H } : null)}>
      {drawing.routeHalo &&
        legs.filter((leg) => leg.inFocus).map((leg) => (
          <Line key={`halo-${leg.id}`} points={leg.points} stroke={drawing.routeHalo ?? undefined} strokeWidth={routeWidth * 2.25} lineJoin="round" lineCap="round" listening={false} perfectDrawEnabled={false} />
        ))}
      {legs.filter((leg) => leg.inFocus).map((leg) => (
        <Line key={leg.id} points={leg.points} stroke={sticker.route} strokeWidth={routeWidth} dash={leg.dashed ? [routeWidth * 2, routeWidth * 1.6] : undefined} lineJoin="round" lineCap="round" listening={false} perfectDrawEnabled={false} />
      ))}
      <Circle x={layout.start[0]} y={layout.start[1]} radius={W * 0.02} fill={sticker.start} stroke="#ffffff" strokeWidth={W * 0.007} listening={false} />
      {labels.map((label) => {
        const arm = labelSize * 0.28
        const cross = [label.x - arm, label.y - arm, label.x + arm, label.y + arm, label.x, label.y, label.x + arm, label.y - arm, label.x - arm, label.y + arm]
        const text = { x: label.left, y: label.y - labelSize / 2, text: label.text, fontSize: labelSize, fontFamily: label.fontFamily, letterSpacing: label.spacing, listening: false }
        return (
          <Group key={label.id} listening={false}>
            {drawing.labelHalo && <Text {...text} fill={drawing.labelHalo} stroke={drawing.labelHalo} strokeWidth={labelSize * 0.14} lineJoin="round" />}
            <Line points={cross} stroke={labelColor} strokeWidth={W * 0.0055} lineCap="round" />
            <Text {...text} fill={labelColor} />
          </Group>
        )
      })}
      </Group>
    </DraggableElement>
  )
}
