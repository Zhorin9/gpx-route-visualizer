import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Line } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../core/formats/registry'
import { selectTrack } from '../../store/derived'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import useSettled from '../../hooks/useSettled'
import { fitMercator, projectWithFit } from '../../utils/gpx'
import { renderMapImage } from '../map/maplibre'
import { provideSharpener } from '../../utils/exportElement'
import { DEFAULT_MAP } from '../map/types'
import { DEFAULT_MAP_STICKER, LOOK_DRAWING, MAP_STICKER_KIND, STICKER_INK } from './model'
import { convexHull, grown } from './shape'

// Shares of the sticker's width, as on the style board.
const BORDER = 0.022
const HARD_SHADOW = 0.02
const ROUTE = 0.016
// Map pixels per frame pixel: sharp in a 2× file.
const MAP_SCALE = 2
const MAX_MAP_SIDE_PX = 4096

export default function MapStickerNode() {
  const sticker = useAppStore((s) => s.mapSticker)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const { w, h, safeZone } = FORMATS[aspectKey]
  const W = Math.round(w * (sticker.size ?? DEFAULT_MAP_STICKER.size))
  const margin = sticker.margin ?? DEFAULT_MAP_STICKER.margin

  const layout = useMemo(() => {
    const points = track?.points.slice(Math.floor(range.start), Math.ceil(range.end) + 1)
    if (!points || points.length < 2) return null
    // The box follows the route's own proportions, within reason.
    const unit = projectWithFit(points, { scale: 1, x0: 0, y0: 0 })
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let i = 0; i < unit.length; i += 2) {
      minX = Math.min(minX, unit[i]); maxX = Math.max(maxX, unit[i])
      minY = Math.min(minY, unit[i + 1]); maxY = Math.max(maxY, unit[i + 1])
    }
    const H = Math.round(W * Math.min(1.5, Math.max(0.6, (maxY - minY) / (maxX - minX || 1))))
    const fit = fitMercator(points, W, H, W * (margin + BORDER) * 1.4)
    const flat = projectWithFit(points, fit)
    const outline = grown(convexHull(flat), W * margin).flat()
    return { H, fit, flat: Array.from(flat), outline }
  }, [track, range.start, range.end, W, margin])

  const [map, setMap] = useState<HTMLCanvasElement | null>(null)
  const { styleId, palette } = sticker
  const wanted = useSettled(useMemo(() => layout && { layout, W, styleId, palette }, [layout, W, styleId, palette]))
  useEffect(() => {
    if (!wanted) return
    let live = true
    const settings = { ...DEFAULT_MAP, styleId: wanted.styleId, palette: wanted.palette, labels: false }
    // Offline the sticker keeps its land colour; the route still shows.
    renderMapImage({ settings, fit: wanted.layout.fit, transform: IDENTITY_TRANSFORM }, wanted.W, wanted.layout.H, MAP_SCALE)
      .then((canvas) => live && setMap(canvas))
      .catch(() => live && setMap(null))
    return () => {
      live = false
    }
  }, [wanted])

  const latest = useRef(wanted)
  latest.current = wanted
  useEffect(
    () =>
      provideSharpener({ kind: 'element', element: MAP_STICKER_KIND }, async (filePxPerFramePx) => {
        const want = latest.current
        if (!want) return () => {}
        const settings = { ...DEFAULT_MAP, styleId: want.styleId, palette: want.palette, labels: false }
        const scale = Math.min(filePxPerFramePx, MAX_MAP_SIDE_PX / Math.max(want.W, want.layout.H))
        if (scale <= MAP_SCALE) return () => {}
        const sharp = await renderMapImage({ settings, fit: want.layout.fit, transform: IDENTITY_TRANSFORM }, want.W, want.layout.H, scale).catch(() => null)
        if (!sharp) return () => {}
        let preview: HTMLCanvasElement | null = null
        setMap((current) => ((preview = current), sharp))
        return () => setMap((current) => (current === sharp ? preview : current))
      }),
    [],
  )

  if (!layout) return null
  const { H, flat, outline } = layout
  const drawing = LOOK_DRAWING[sticker.look ?? DEFAULT_MAP_STICKER.look]
  const edgeColor = { none: null, white: '#ffffff', ink: STICKER_INK }[sticker.edge ?? DEFAULT_MAP_STICKER.edge]
  const edgeWidth = edgeColor ? W * BORDER * 2 : 0
  const routeWidth = W * ROUTE * drawing.routeWidthFactor
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
      {drawing.routeHalo && (
        <Line points={flat} stroke={drawing.routeHalo} strokeWidth={routeWidth * 2.25} lineJoin="round" lineCap="round" listening={false} perfectDrawEnabled={false} />
      )}
      <Line points={flat} stroke={sticker.route} strokeWidth={routeWidth} lineJoin="round" lineCap="round" listening={false} perfectDrawEnabled={false} />
      <Circle x={flat[0]} y={flat[1]} radius={W * 0.02} fill={sticker.start} stroke="#ffffff" strokeWidth={W * 0.007} listening={false} />
    </DraggableElement>
  )
}
