import { Circle, Group, Text } from 'react-konva'
import { selectTrack } from '../store/derived'
import { useAppStore } from '../store/useAppStore'
import { applyTransform, pointAt } from '../utils/geometry'
import { PAPER } from '../utils/color'
import { fontWeight } from '../utils/fonts'
import { mapDots } from '../utils/series'
import type { RouteTransform } from '../types'

const R = 28

// Where the series' photos were taken, numbered as their slides: one dot per exported photo slide.
export default function SlideDots({ projected, transform }: { projected: ArrayLike<number>; transform: RouteTransform }) {
  const slides = useAppStore((s) => s.slides)
  const photos = useAppStore((s) => s.photos)
  const points = useAppStore((s) => selectTrack(s)?.points ?? null)
  const color = useAppStore((s) => s.routeStyle.color)
  const font = useAppStore((s) => s.statsStyle.fontFamily)
  useAppStore((s) => s.fontsVersion)
  if (slides.length < 2) return null
  const dots = mapDots(slides, new Map(photos.map((p) => [p.id, p])), points)

  return (
    <Group listening={false}>
      {dots.map(({ index, n }) => {
        const at = applyTransform(pointAt(projected, index), transform)
        return (
          <Group key={n} x={at.x} y={at.y}>
            <Circle radius={R} fill={color} stroke={PAPER} strokeWidth={6} />
            <Text
              text={String(n)}
              x={-R}
              y={-R}
              width={R * 2}
              height={R * 2}
              align="center"
              verticalAlign="middle"
              fontSize={30}
              fontFamily={font}
              fontStyle={String(fontWeight(font, true))}
              fill={PAPER}
            />
          </Group>
        )
      })}
    </Group>
  )
}
