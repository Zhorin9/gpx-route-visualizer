import { useMemo } from 'react'
import { Shape } from 'react-konva'
import type Konva from 'konva'
import type { RouteStyle } from '../../types'
import type { RouteColoring } from './coloring'
import type { RouteSegment } from './geometry'
import { colorRuns, type ColorRun } from './colorRuns'
import { coreDash } from './dash'

type PerPoint = Extract<RouteColoring, { kind: 'perPoint' }>

function tracePath(ctx: CanvasRenderingContext2D, points: readonly number[], run: ColorRun) {
  ctx.beginPath()
  ctx.moveTo(points[run.from * 2], points[run.from * 2 + 1])
  for (let i = run.from + 1; i <= run.to; i++) ctx.lineTo(points[i * 2], points[i * 2 + 1])
}

function runLength(points: readonly number[], run: ColorRun) {
  let length = 0
  for (let i = run.from + 1; i <= run.to; i++) {
    length += Math.hypot(points[i * 2] - points[i * 2 - 2], points[i * 2 + 1] - points[i * 2 - 1])
  }
  return length
}

export interface GradientRouteShapeProps {
  segment: RouteSegment
  style: RouteStyle
  coloring: PerPoint
}

// The same core-and-glow look as the solid route, coloured point by point.
// Konva lines take one stroke colour, so this draws the runs on the canvas itself.
export default function GradientRouteShape({ segment, style, coloring }: GradientRouteShapeProps) {
  const runs = useMemo(() => colorRuns(segment.positions, coloring.at), [segment.positions, coloring])
  const dash = coreDash(style, segment)

  function sceneFunc(context: Konva.Context, shape: Konva.Shape) {
    const ctx = context._context
    const { points } = segment
    const scale = shape.getAbsoluteScale()
    const blurScale = context.canvas.getPixelRatio() * Math.min(Math.abs(scale.x), Math.abs(scale.y))
    ctx.save()
    ctx.lineCap = segment.square ? 'square' : 'round'
    ctx.lineJoin = segment.square ? 'miter' : 'round'

    if (style.glowEnabled) {
      ctx.globalAlpha = 0.8
      ctx.lineWidth = style.glowWidth
      ctx.shadowBlur = style.glowBlur * blurScale
      for (const run of runs) {
        const color = coloring.glow.kind === 'uniform' ? coloring.glow.color : run.color
        ctx.strokeStyle = color
        ctx.shadowColor = color
        tracePath(ctx, points, run)
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      ctx.globalAlpha = 1
    }

    ctx.lineWidth = style.coreWidth
    if (dash) ctx.setLineDash(dash)
    // The dash pattern carries on across runs instead of restarting at every colour change.
    let offset = 0
    for (const run of runs) {
      ctx.lineDashOffset = -offset
      ctx.strokeStyle = run.color
      tracePath(ctx, points, run)
      ctx.stroke()
      if (dash) offset += runLength(points, run)
    }
    ctx.restore()
  }

  return <Shape sceneFunc={sceneFunc} listening={false} perfectDrawEnabled={false} />
}
