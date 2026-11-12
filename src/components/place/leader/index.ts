import { intoPhotoMiddle } from './photo'
import { toNearestNameEnd } from './text'
import type { Box } from '../../../utils/geometry'

export interface LeaderElement {
  kind: 'photo' | 'text'
  box: Box
}

const STRATEGIES: Record<LeaderElement['kind'], (box: Box) => [number, number]> = { photo: intoPhotoMiddle, text: toNearestNameEnd }

export function leaderPoints(element: LeaderElement | null, dx: number, dy: number): number[] {
  if (!element) return []
  const { box } = element
  return [0, 0, ...STRATEGIES[element.kind]({ ...box, x: box.x + dx, y: box.y + dy })]
}
