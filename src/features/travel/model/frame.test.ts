import { describe, expect, it } from 'vitest'
import { lngLatAt } from '../../map/model/placement'
import { fitMercator, mercatorX, mercatorY } from '../../../utils/gpx'
import { panFrame, scaleFrame } from './frame'

const fit = fitMercator(
  [
    { lat: 54.35, lon: 18.65, ele: 0, time: null },
    { lat: 50.06, lon: 19.94, ele: 0, time: null },
  ],
  1080,
  1920,
)
const turned = { x: 30, y: -40, scaleX: 1.2, scaleY: 1.2, rotation: 25 }
const merc = ([lon, lat]: [number, number]) => ({ x: mercatorX(lon), y: mercatorY(lat) })

describe('frame on the map', () => {
  it('moves every corner of the frame by the same shift on the map', () => {
    const shift = { x: 0.001, y: -0.0005 }
    const moved = panFrame(turned, fit, shift)
    for (const at of [{ x: 0, y: 0 }, { x: 1080, y: 1920 }]) {
      const before = merc(lngLatAt(fit, turned, at))
      const after = merc(lngLatAt(fit, moved, at))
      expect(after.x - before.x).toBeCloseTo(shift.x, 9)
      expect(after.y - before.y).toBeCloseTo(shift.y, 9)
    }
  })

  it('grows round its middle, which keeps showing the same place', () => {
    const middle = { x: 540, y: 960 }
    const grown = scaleFrame(turned, 2, middle)
    expect(merc(lngLatAt(fit, grown, middle)).x).toBeCloseTo(merc(lngLatAt(fit, turned, middle)).x, 9)
    const span = (t: typeof turned) => Math.abs(merc(lngLatAt(fit, t, { x: 1080, y: 0 })).x - merc(lngLatAt(fit, t, { x: 0, y: 0 })).x)
    // Rotation spreads the width over both axes; the ratio stays.
    expect(span(grown) / span(turned)).toBeCloseTo(2, 6)
  })
})
