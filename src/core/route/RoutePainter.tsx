import { Fragment } from 'react'
import { Line } from 'react-konva'
import type { RouteStyle } from '../../types'
import type { RouteColoring } from './coloring'
import type { RouteSegment } from './geometry'
import { coreDash } from './dash'
import GradientRouteShape from './GradientRouteShape'

export interface RoutePainterProps {
  segments: RouteSegment[]
  style: RouteStyle
  coloring: RouteColoring
}

const ROUND = { lineCap: 'round', lineJoin: 'round' } as const
const SQUARE = { lineCap: 'square', lineJoin: 'miter' } as const

function Ghost({ segment, style }: { segment: RouteSegment; style: RouteStyle }) {
  if (!style.remainingVisible) return null
  const w = style.remainingWidth
  return (
    <Line
      points={segment.points}
      stroke={style.remainingColor}
      strokeWidth={w}
      opacity={style.remainingOpacity}
      dash={style.remainingDashed ? [w * 4, w * 2] : undefined}
      listening={false}
      perfectDrawEnabled={false}
      {...ROUND}
    />
  )
}

function SolidStroke({ segment, style, color }: { segment: RouteSegment; style: RouteStyle; color: string }) {
  const caps = segment.square ? SQUARE : ROUND
  return (
    <>
      {style.glowEnabled && (
        <Line
          points={segment.points}
          stroke={style.glowColor ?? color}
          strokeWidth={style.glowWidth}
          opacity={style.glowOpacity}
          shadowColor={style.glowColor ?? color}
          shadowBlur={style.glowBlur}
          shadowEnabled={style.glowBlur > 0}
          shadowOpacity={1}
          listening={false}
          perfectDrawEnabled={false}
          {...caps}
        />
      )}
      <Line
        points={segment.points}
        stroke={color}
        strokeWidth={style.coreWidth}
        dash={coreDash(style, segment)}
        listening={false}
        perfectDrawEnabled={false}
        {...caps}
      />
    </>
  )
}

// The shifted copy, then the outline: under every drawn segment, so a joint never covers the line before it.
function Casing({ segments, style }: { segments: RouteSegment[]; style: RouteStyle }) {
  const casing = style.casing
  if (!casing) return null
  const drawn = segments.filter((s) => s.role !== 'remaining' && s.points.length >= 4)
  const line = (segment: RouteSegment, i: number, offset: boolean) => (
    <Line
      key={i}
      points={segment.points}
      x={offset ? casing.dx : 0}
      y={offset ? casing.dy : 0}
      stroke={casing.color}
      strokeWidth={style.coreWidth + casing.width}
      listening={false}
      perfectDrawEnabled={false}
      {...(segment.square ? SQUARE : ROUND)}
    />
  )
  return (
    <>
      {casing.dx || casing.dy ? drawn.map((s, i) => line(s, i, true)) : null}
      {drawn.map((s, i) => line(s, i + drawn.length, false))}
    </>
  )
}

export default function RoutePainter({ segments, style, coloring }: RoutePainterProps) {
  return (
    <>
      <Casing segments={segments} style={style} />
      {segments.map((segment, i) => {
        if (segment.points.length < 4) return null
        if (segment.role === 'remaining') return <Ghost key={i} segment={segment} style={style} />
        return (
          <Fragment key={i}>
            {coloring.kind === 'solid' ? (
              <SolidStroke segment={segment} style={style} color={coloring.color(segment)} />
            ) : (
              <GradientRouteShape segment={segment} style={style} coloring={coloring} />
            )}
          </Fragment>
        )
      })}
    </>
  )
}
