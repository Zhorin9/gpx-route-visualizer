import { describe, expect, it } from 'vitest'
import { BUILT_IN_VEHICLES, headingAt, vehiclePose } from './vehicles'

// A side view (the bike) mirrors heading west; the illustrated car, plane and train are seen from above and just turn.
const bike = BUILT_IN_VEHICLES.find((v) => v.id === 'bike')!
const car = BUILT_IN_VEHICLES.find((v) => v.id === 'car')!
const plane = BUILT_IN_VEHICLES.find((v) => v.id === 'plane')!

// A straight line of 11 points, 20 px apart, from (100, 100) in the given direction.
function line(dx: number, dy: number): number[] {
  return Array.from({ length: 11 }, (_, i) => [100 + dx * 20 * i, 100 + dy * 20 * i]).flat()
}

describe('vehicle heading', () => {
  it('points along straight lines in the four directions, also at the very start', () => {
    for (const [dx, dy, angle] of [[1, 0, 0], [0, 1, 90], [-1, 0, 180], [0, -1, -90]]) {
      expect(headingAt(line(dx, dy), 6.5)).toBeCloseTo(angle)
      expect(headingAt(line(dx, dy), 0)).toBeCloseTo(angle)
    }
  })

  it('looks past a small zigzag of GPS points', () => {
    const flat = line(1, 0)
    flat[17] += 6
    expect(Math.abs(headingAt(flat, 9))).toBeLessThan(5)
  })

  it('mirrors a bike heading west instead of turning it upside down, but turns a car seen from above', () => {
    expect(vehiclePose(bike, 180, 0)).toEqual({ rotation: 180, flip: true })
    expect(vehiclePose(car, 180, 0).flip).toBe(false)
    expect(vehiclePose(bike, 10, 0)).toEqual({ rotation: 10, flip: false })
    // A route turned half round on the frame: east in the route runs west on screen.
    expect(vehiclePose(bike, 0, 180).flip).toBe(true)
    expect(vehiclePose(plane, 180, 0).flip).toBe(false)
  })
})
