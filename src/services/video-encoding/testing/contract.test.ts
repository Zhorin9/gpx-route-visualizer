import { describe, expect, it } from 'vitest'
import { runEncodingContract } from './contract'
import { FakeVideoEncodingService } from './FakeVideoEncodingService'

// jsdom has neither WebCodecs nor a drawing canvas; the default implementation runs the same
// contract in the browser (see docs/PLAN-6-7.md, "Serwis kodowania").
const frame = () => ({}) as HTMLCanvasElement

describe('encoding service contract', () => {
  it('holds for the fake service', async () => {
    const results = await runEncodingContract(new FakeVideoEncodingService(), frame)
    expect(results.map((r) => [r.format, r.ok, r.details])).toEqual([
      ['mp4', true, 'ok'],
      ['webm', true, 'ok'],
      ['gif', true, 'ok'],
    ])
  })

  it('skips what the browser cannot produce instead of failing', async () => {
    const results = await runEncodingContract(new FakeVideoEncodingService(['mp4']), frame)
    expect(results[0]).toMatchObject({ format: 'mp4', ok: true, details: expect.stringMatching(/pominięty/) })
  })
})
