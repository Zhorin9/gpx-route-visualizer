import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Line, Text } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../core/formats/registry'
import { selectRouteDays, selectRouteParts, selectTrack } from '../../store/derived'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import useSettled from '../../hooks/useSettled'
import { fitMercator, projectWithFit } from '../../utils/gpx'
import { renderMapImage } from '../map/maplibre'
import { provideSharpener } from '../../utils/exportElement'
import { DEFAULT_MAP } from '../map/types'
import { DEFAULT_MAP_STICKER, LOOK_DRAWING, MAP_STICKER_KIND, STICKER_INK } from './model'
import { convexHull, grown } from './shape'
import { labelSpan } from './labels'

// Shares of the sticker's width, as on the style board.
const BORDER = 0.022
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

export default function MapStickerNode() {
  const sticker = useAppStore((s) => s.mapSticker)
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

  const layout = useMemo(() => {
    const lo = Math.floor(range.start)
    const hi = Math.ceil(range.end)
    const points = track?.points.slice(lo, hi + 1)
    if (!track || !points || points.length < 2) return null
    const dayLo = day ? Math.max(lo, day.startIdx) : lo
    const dayHi = day ? Math.min(hi, day.endIdx) : hi
    const [focusLo, focusHi] = dayHi > dayLo ? [dayLo, dayHi] : [lo, hi]
    const focus = track.points.slice(focusLo, focusHi + 1)
    // The box follows the route's own proportions, within reason.
    const unit = projectWithFit(focus, { scale: 1, x0: 0, y0: 0 })
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let i = 0; i < unit.length; i += 2) {
      minX = Math.min(minX, unit[i]); maxX = Math.max(maxX, unit[i])
      minY = Math.min(minY, unit[i + 1]); maxY = Math.max(maxY, unit[i + 1])
    }
    const H = Math.round(W * Math.min(1.5, Math.max(0.6, (maxY - minY) / (maxX - minX || 1))))
    const fit = fitMercator(focus, W, H, W * (margin + BORDER) * 1.4)
    const flat = Array.from(projectWithFit(points, fit))
    const between = (a: number, b: number) => flat.slice((a - lo) * 2, (b - lo + 1) * 2)
    const outline = grown(convexHull(between(focusLo, focusHi)), W * margin).flat()
    const legs = parts
      .map((part) => {
        const inFocus = !day || (part.startIdx >= day.startIdx && part.endIdx <= day.endIdx)
        const joinedToPrevious = !day || !inFocus
        return { part, inFocus, a: Math.max(lo, joinedToPrevious ? part.startIdx - 1 : part.startIdx), b: Math.min(hi, part.endIdx) }
      })
      .filter(({ a, b }) => b > a)
      .map(({ a, b, part, inFocus }) => ({ id: part.id, points: between(a, b), dashed: part.dashed, inFocus }))
    return { H, fit, outline, legs, start: between(focusLo, focusLo), focusLo, focusHi, at: (index: number) => between(index, index) }
  }, [track, range.start, range.end, W, margin, day, parts])

  const [map, setMap] = useState<HTMLCanvasElement | null>(null)
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
      .then((canvas) => live && !sharpShown.current && setMap(canvas))
      .catch(() => live && !sharpShown.current && setMap(null))
    return () => {
      live = false
    }
  }, [wanted])

  const latest = useRef(current)
  latest.current = current
  useEffect(
    () =>
      provideSharpener({ kind: 'element', element: MAP_STICKER_KIND }, async (filePxPerFramePx) => {
        const want = latest.current
        if (!want) return () => {}
        const settings = { ...DEFAULT_MAP, styleId: want.styleId, palette: want.palette, labels: false }
        const scale = Math.min(Math.max(filePxPerFramePx, MAP_SCALE), MAX_MAP_SIDE_PX / Math.max(want.W, want.layout.H))
        const sharp = await renderMapImage({ settings, fit: want.layout.fit, transform: IDENTITY_TRANSFORM }, want.W, want.layout.H, scale).catch(() => null)
        if (!sharp) return () => {}
        let preview: HTMLCanvasElement | null = null
        sharpShown.current = true
        setMap((current) => ((preview = current), sharp))
        return () => {
          sharpShown.current = false
          setMap((current) => (current === sharp ? preview : current))
        }
      }),
    [],
  )

  if (!layout) return null
  const { H, outline, legs } = layout
  const labelSize = W * LABEL_SIZE
  const labels = sticker.labels
    ? waypoints
        .filter((wp) => wp.kind !== 'icon' && wp.text.trim() && Math.round(wp.trackPos) >= layout.focusLo && Math.round(wp.trackPos) <= layout.focusHi)
        .map((wp) => {
          const [x, y] = layout.at(Math.round(wp.trackPos))
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
    ctx.moveTo(outline[0], outline[1])
    for (let i = 2; i < outline.length; i += 2) ctx.lineTo(outline[i], outline[i + 1])
    ctx.closePath()
  }

  return (
    <DraggableElement
      kind={MAP_STICKER_KIND}
      width={W}
      height={H}
      defaultX={w - (safeZone?.right ?? 0) - W - w * 0.06}
      defaultY={h - Math.min(bottomInset(aspectKey), (safeZone?.bottom ?? 0) + w * 0.06) - H}
    >
      {sticker.shadow === 'hard' && (
        <Line points={outline} closed x={W * HARD_SHADOW} y={W * HARD_SHADOW} fill={STICKER_INK} stroke={STICKER_INK} strokeWidth={edgeWidth} lineJoin="round" listening={false} />
      )}
      {/* The edge, rounded by its joins, casts the sticker's shadow. */}
      <Line
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
      <Group clipFunc={clip} listening={false}>
        <Line points={outline} closed fill={sticker.palette.land} />
        {map && <KonvaImage image={map} width={W} height={H} />}
      </Group>
      {drawing.contourShare > 0 && <Line points={outline} closed stroke={STICKER_INK} strokeWidth={W * drawing.contourShare} lineJoin="round" listening={false} />}
      {otherDaysOpacity > 0 && (
        <Group clipFunc={clip} opacity={otherDaysOpacity} listening={false}>
          {legs.filter((leg) => !leg.inFocus).map((leg) => (
            <Line key={leg.id} points={leg.points} stroke={sticker.route} strokeWidth={routeWidth} dash={leg.dashed ? [routeWidth * 2, routeWidth * 1.6] : undefined} lineJoin="round" lineCap="round" perfectDrawEnabled={false} />
          ))}
        </Group>
      )}
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
    </DraggableElement>
  )
}
