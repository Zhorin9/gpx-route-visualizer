import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildLeg, travelMode } from './modes'
import type { TravelPlan } from '../../../types'

afterEach(() => vi.restoreAllMocks())

describe('ferry', () => {
  const plan = {
    mode: 'ferry',
    stops: [
      { id: 1, name: 'Hel', lat: 54.6, lon: 18.8 },
      { id: 2, name: 'Gdynia', lat: 54.52, lon: 18.55 },
    ],
  } as unknown as TravelPlan

  it('sails a dashed line between the stops without asking a routing service', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const points = await buildLeg(plan, { signal: new AbortController().signal }, 0)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(travelMode('ferry').line.dashed).toBe(true)
    expect(points[0]).toMatchObject({ lat: 54.6, lon: 18.8 })
    expect(points[points.length - 1]).toMatchObject({ lat: 54.52, lon: 18.55 })
  })

  it('takes about half an hour per 15 km', async () => {
    const points = await buildLeg(plan, { signal: new AbortController().signal }, 0)
    const minutes = (points[points.length - 1].time as number) / 60000
    expect(minutes).toBeGreaterThan(30)
    expect(minutes).toBeLessThan(40)
  })
})
