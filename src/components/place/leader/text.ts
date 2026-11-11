import type { Box } from '../../../utils/geometry'

export function toNearestNameEnd(name: Box): [number, number] {
  const middleY = name.y + name.h / 2
  const leftOfAnchor = name.x + name.w < 0
  const rightOfAnchor = name.x > 0
  if (leftOfAnchor) return [name.x + name.w, middleY]
  if (rightOfAnchor) return [name.x, middleY]
  const belowAnchor = name.y > 0
  return [name.x + name.w / 2, belowAnchor ? name.y : name.y + name.h]
}
