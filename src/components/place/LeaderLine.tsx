import { Line } from 'react-konva'
import { dashPattern } from '../../core/route/dash'
import { useAppStore } from '../../store/useAppStore'
import type { RouteStyle } from '../../types'
import { leaderPoints, type LeaderElement } from './leader'

interface LeaderLineProps {
  element: LeaderElement | null
  offset: { x: number; y: number }
  color: string
  shadow: boolean
}

const halfRouteWidth = (route: RouteStyle) => Math.max(1.5, route.coreWidth / 2)

export default function LeaderLine({ element, offset, color, shadow }: LeaderLineProps) {
  const route = useAppStore((s) => s.routeStyle)
  const width = halfRouteWidth(route)
  return (
    <Line
      points={leaderPoints(element, offset.x, offset.y)}
      stroke={color}
      strokeWidth={width}
      dash={dashPattern(route, width)}
      lineCap="round"
      opacity={0.85}
      shadowColor="#000000"
      shadowBlur={4}
      shadowOpacity={0.5}
      shadowEnabled={shadow}
      listening={false}
    />
  )
}
