import { describe, expect, it } from 'vitest'
import { convexHull, grown, type Pt } from './shape'

// Even-odd ray cast; points on the edge count as inside enough for a grown hull.
function inside([x, y]: Pt, poly: Pt[]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

describe('map sticker shape', () => {
  const route = [0, 0, 40, 10, 80, 0, 70, 50, 90, 90, 30, 70, 10, 40, 45, 45]

  it('keeps every point of the route inside the grown outline', () => {
    const outline = grown(convexHull(route), 12)
    for (let i = 0; i < route.length; i += 2) expect(inside([route[i], route[i + 1]], outline)).toBe(true)
  })

  it('outlines only the outer points', () => {
    const hull = convexHull(route)
    expect(hull).not.toContainEqual([45, 45])
    expect(hull).not.toContainEqual([40, 10])
  })
})
