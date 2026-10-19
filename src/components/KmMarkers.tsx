import { Circle, Group, Label, Tag, Text } from 'react-konva'
import { useProjectedTrack, useTrackCumKm } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'
import { applyTransform, pointAt, posAtDistance } from '../utils/geometry'

const LABEL_SIZE = 20

// Kilometre marks along the visible route. Outside the route group, like waypoint labels,
// so rotating the route moves them with it but the text stays upright.
export default function KmMarkers() {
  const interval = useAppStore((s) => s.kmInterval)
  const range = useAppStore((s) => s.range)
  const transform = useAppStore((s) => s.routeTransform)
  const days = useAppStore((s) => s.routeDays)
  const color = useAppStore((s) => s.routeStyle.color)
  const fontFamily = useAppStore((s) => s.statsStyle.fontFamily)
  const projected = useProjectedTrack()
  const cum = useTrackCumKm()

  if (!interval || !projected || !cum || range.end <= range.start) return null

  const marks: { km: number; x: number; y: number; color: string }[] = []
  const last = cum[range.end]
  for (let km = Math.max(interval, Math.ceil(cum[range.start] / interval) * interval); km <= last; km += interval) {
    const pos = posAtDistance(cum, range.start, range.end, km)
    const day = days.find((d) => pos >= d.startIdx && pos <= d.endIdx + 1)
    if (day && !day.visible) continue
    const anchor = applyTransform(pointAt(projected, pos), transform)
    marks.push({ km, x: anchor.x, y: anchor.y, color: day?.color ?? color })
  }

  return (
    <>
      {marks.map((mark) => (
        <Group key={mark.km} x={mark.x} y={mark.y} listening={false}>
          <Circle radius={7} fill="#f3f2f2" stroke={mark.color} strokeWidth={3} shadowColor="#000000" shadowBlur={6} shadowOpacity={0.4} />
          <Label x={12} y={-LABEL_SIZE}>
            <Tag fill="#f3f2f2" cornerRadius={3} shadowColor="#000000" shadowBlur={6} shadowOpacity={0.3} />
            <Text text={`km ${mark.km}`} fontFamily={fontFamily} fontSize={LABEL_SIZE} fill="#2d2b2b" padding={5} />
          </Label>
        </Group>
      ))}
    </>
  )
}
