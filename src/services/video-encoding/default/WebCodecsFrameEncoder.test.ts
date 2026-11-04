import { describe, expect, it } from 'vitest'
import { inBandAvcDescription } from './WebCodecsFrameEncoder'

const hex = (s: string) => Uint8Array.from(s.match(/../g)!, (b) => parseInt(b, 16))

// A sample as WebCodecs hands it out: NAL units, each after its 4-byte length.
function chunk(...nals: string[]) {
  const parts = nals.map(hex)
  const data = new Uint8Array(parts.reduce((n, p) => n + 4 + p.length, 0))
  let at = 0
  for (const p of parts) {
    new DataView(data.buffer).setUint32(at, p.length)
    data.set(p, at + 4)
    at += 4 + p.length
  }
  return { byteLength: data.length, copyTo: (dest: AllowSharedBufferSource) => (dest as Uint8Array).set(data) }
}

// Parameter sets of a Firefox 159 key frame (High profile, 1080×1920).
const SPS = '67640028ac2cac04403c797840000003004000000f036822114e'
const PPS = '68ce3c30'

describe('inBandAvcDescription', () => {
  it('builds the avcC from the SPS and PPS a key frame carries', () => {
    const out = inBandAvcDescription(chunk('0910', SPS, PPS, '06051a', '658884'))
    expect(out && Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('')).toBe(`01640028ffe1001a${SPS}010004${PPS}fdf8f800`)
  })

  it('leaves frames without parameter sets alone', () => {
    expect(inBandAvcDescription(chunk('658884'))).toBeUndefined()
  })
})
