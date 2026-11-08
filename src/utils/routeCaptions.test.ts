import { describe, expect, it } from 'vitest'
import { routeCaptions } from './routeCaptions'

// One degree of latitude is about 111 km.
const line = (lats: number[]) => lats.map((lat) => ({ lat, lon: 20, ele: 0, time: null }))

describe('route captions', () => {
  it('writes start and finish apart, and the halfway distance where it falls', () => {
    const points = line([50, 50.5, 51, 51.5, 52])
    const captions = routeCaptions(points, { start: 0, end: 4 }, 'metric')
    expect(captions).toEqual([
      { trackPos: 0, text: 'START' },
      { trackPos: 4, text: 'META' },
      { trackPos: 2, text: '111 km' },
    ])
  })

  it('writes one caption for a loop', () => {
    const points = line([50, 50.5, 51, 50.5, 50])
    expect(routeCaptions(points, { start: 0, end: 4 }, 'metric')[0]).toEqual({ trackPos: 0, text: 'START / META' })
    expect(routeCaptions(points, { start: 0, end: 4 }, 'metric')).toHaveLength(2)
  })
})
