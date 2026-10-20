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
          stroke={color}
          strokeWidth={style.glowWidth}
          opacity={0.8}
          shadowColor={color}
          shadowBlur={style.glowBlur}
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

// The route's look: a core line, an optional glow under it and a ghost of the part
// not yet drawn. Same look whatever the colours come from.
export default function RoutePainter({ segments, style, coloring }: RoutePainterProps) {
  return (
    <>
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
