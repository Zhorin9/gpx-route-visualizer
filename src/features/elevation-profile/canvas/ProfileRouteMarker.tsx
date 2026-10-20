import { Circle } from 'react-konva'
import { useRouteHead } from '../../../core/route/providers'
import { useProjectedTrack } from '../../../store/selectors'
import { useAppStore } from '../../../store/useAppStore'
import { pointAt } from '../../../utils/geometry'
import { useProfileMarkerPos } from '../useProfile'

// The point on the route that matches the line on the elevation chart. While the animation
// plays, its own glowing head marks the place instead.
export default function ProfileRouteMarker() {
  const enabled = useAppStore((s) => s.profile.enabled && s.profile.marker)
  const color = useAppStore((s) => s.routeStyle.color)
  const ring = useAppStore((s) => s.statsStyle.color)
  const projected = useProjectedTrack()
  const pos = useProfileMarkerPos()
  const animating = useRouteHead() != null
  if (!enabled || animating || pos == null || !projected) return null
  const p = pointAt(projected, pos)
  return <Circle x={p.x} y={p.y} radius={9} fill={color} stroke={ring} strokeWidth={3.5} shadowColor="#000000" shadowBlur={8} shadowOpacity={0.5} listening={false} />
}
