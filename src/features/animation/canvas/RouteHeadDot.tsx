import { Circle } from 'react-konva'
import type { RouteGeometry } from '../../../core/route/geometry'
import { useProvidedColoring } from '../../../core/route/providers'
import { useAppStore } from '../../../store/useAppStore'

// Glowing point at the tip of the line while it is being drawn, in the colour under it.
export default function RouteHeadDot({ geometry }: { geometry: RouteGeometry }) {
  const enabled = useAppStore((s) => s.animation.headDot)
  const size = useAppStore((s) => s.animation.headSize)
  const routeColor = useAppStore((s) => s.routeStyle.color)
  const glowBlur = useAppStore((s) => s.routeStyle.glowBlur)
  const coloring = useProvidedColoring()
  const head = geometry.head
  if (!enabled || !head) return null
  const color = coloring?.kind === 'perPoint' ? coloring.at(head.pos) : routeColor
  return (
    <>
      <Circle x={head.x} y={head.y} radius={size * 1.8} fill={color} opacity={0.35} shadowColor={color} shadowBlur={glowBlur * 1.2} shadowOpacity={1} listening={false} />
      <Circle x={head.x} y={head.y} radius={size} fill="#ffffff" shadowColor={color} shadowBlur={glowBlur} shadowOpacity={1} listening={false} />
    </>
  )
}
