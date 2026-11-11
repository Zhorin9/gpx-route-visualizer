import { Circle, Line } from 'react-konva'
import { SOFT_SHADOW } from '../../../core/canvas/shadows'
import { clamp } from '../../../utils/math'
import { useProfileMarkerPos } from '../useProfile'
import { chartBottom, type ProfileChart } from './chart'

export default function PositionMarker({ chart, color }: { chart: ProfileChart; color: string }) {
  const trackPos = useProfileMarkerPos()
  if (trackPos == null) return null
  const col = chart.colAtTrack(trackPos)
  const nearest = clamp(Math.round(col), 0, chart.count - 1)
  const x = chart.x(col)
  return (
    <>
      <Line points={[x, chart.area.top, x, chartBottom(chart)]} stroke={color} strokeWidth={2} dash={[6, 5]} opacity={0.8} listening={false} />
      {Number.isFinite(chart.values[nearest]) && (
        <Circle x={x} y={chart.y(chart.values[nearest])} radius={7} fill={chart.colorAt(nearest)} stroke={color} strokeWidth={3} listening={false} {...SOFT_SHADOW} />
      )}
    </>
  )
}
