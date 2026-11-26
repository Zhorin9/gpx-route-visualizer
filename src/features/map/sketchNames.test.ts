// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { drawSketch, type SketchFrame } from './sketch/draw'
import type { SketchShape } from './sketch/shape'

function recordingContext() {
  const written: { text: string; x: number; y: number }[] = []
  const ctx = new Proxy({} as Record<string | symbol, unknown>, {
    get: (target, key) => {
      if (key === 'fillText') return (text: string, x: number, y: number) => written.push({ text, x, y })
      if (key === 'measureText') return (text: string) => ({ width: text.length * 10 })
      if (key in target) return target[key]
      return () => undefined
    },
    set: (target, key, value) => {
      target[key] = value
      return true
    },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, written }
}

const shape: SketchShape = {
  water: [],
  shores: [],
  rivers: [],
  roads: [],
  places: [
    { name: 'Inside', at: [500, 600], kind: 'town' },
    { name: 'Outside', at: [1400, 600], kind: 'town' },
  ],
}

function frame(panX: number): SketchFrame {
  return {
    shape,
    ends: null,
    transform: { x: panX, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    width: 1080,
    height: 1350,
    slideWidth: 1080,
    short: 1080,
    palette: { paper: '#fff', ink: '#000', water: '#00f' },
    settings: { water: 'none', shores: false, roughness: 1, paper: false, lines: false, marks: 'icons' },
    names: true,
    seed: 1,
  }
}

describe('sketch names', () => {
  it('names only the towns on the frame, and a name moves with its dot when the map is dragged', () => {
    const before = recordingContext()
    drawSketch(before.ctx, frame(0), 1)
    const after = recordingContext()
    drawSketch(after.ctx, frame(-100), 1)
    expect(before.written.map((w) => w.text)).toEqual(['Inside'])
    expect(after.written[0].x).toBeCloseTo(before.written[0].x - 100)
  })
})
