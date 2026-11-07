import { useEffect, useMemo, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Line } from 'react-konva'
import DraggableElement from '../../core/canvas/DraggableElement'
import { FORMATS, bottomInset } from '../../core/formats/registry'
import { selectTrack } from '../../store/derived'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import { fitMercator, projectWithFit } from '../../utils/gpx'
import { renderMapImage } from '../map/maplibre'
import { DEFAULT_MAP } from '../map/types'
import { MAP_STICKER_KIND } from './model'
import { convexHull, grown } from './shape'

// Shares of the frame's width, as on the style board.
const WIDTH = 0.46
const MARGIN = 0.07
const BORDER = 0.022
const ROUTE = 0.016
// Map pixels per frame pixel: sharp in a 2× file.
const MAP_SCALE = 2

export default function MapStickerNode() {
  const sticker = useAppStore((s) => s.mapSticker)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const { w, h, safeZone } = FORMATS[aspectKey]
  const W = Math.round(w * WIDTH)

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
    const fit = fitMercator(points, W, H, W * (MARGIN + BORDER) * 1.4)
    const flat = projectWithFit(points, fit)
    const outline = grown(convexHull(flat), W * MARGIN).flat()
    return { H, fit, flat: Array.from(flat), outline }
  }, [track, range.start, range.end, W])

  const [map, setMap] = useState<HTMLCanvasElement | null>(null)
  const { styleId, palette } = sticker
  useEffect(() => {
    if (!layout) return
    let live = true
    const settings = { ...DEFAULT_MAP, styleId, palette, labels: false }
    // Offline the sticker keeps its land colour; the route still shows.
    renderMapImage({ settings, fit: layout.fit, transform: IDENTITY_TRANSFORM }, W, layout.H, MAP_SCALE)
      .then((canvas) => live && setMap(canvas))
      .catch(() => live && setMap(null))
    return () => {
      live = false
    }
  }, [layout, W, styleId, palette])

  if (!layout) return null
  const { H, flat, outline } = layout
  const border = W * BORDER
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
      {/* The white edge, rounded by its joins, casts the sticker's shadow. */}
      <Line
        points={outline}
        closed
        fill="#ffffff"
        stroke="#ffffff"
        strokeWidth={border * 2}
        lineJoin="round"
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
      <Line points={flat} stroke={sticker.route} strokeWidth={W * ROUTE} lineJoin="round" lineCap="round" listening={false} perfectDrawEnabled={false} />
      <Circle x={flat[0]} y={flat[1]} radius={W * 0.02} fill={sticker.start} stroke="#ffffff" strokeWidth={W * 0.007} listening={false} />
    </DraggableElement>
  )
}
