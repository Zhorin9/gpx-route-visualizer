import { describe, expect, it } from 'vitest'
import { applyTransform } from '../../utils/geometry'
import { composeView } from '../../core/route/view'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { DEFAULT_CAMERA, flyoverCamera, followCamera, type CameraContext } from './model/camera'

// The head runs along a diagonal across a 1080 × 1920 frame, with a GPS wobble.
const headAt = (p: number) => ({ x: 100 + 880 * p + Math.sin(p * 400) * 6, y: 200 + 1500 * p })

const ctx = (progress: number, settings = DEFAULT_CAMERA): CameraContext => ({
  progress,
  headAt,
  focus: { x: 540, y: 960 },
  duration: 6,
  settings,
})

// Where the head lands on screen under the camera.
function onScreen(c: CameraContext) {
  const view = (c.settings.mode === 'flyover' ? flyoverCamera : followCamera).viewAt(c)
  return applyTransform(headAt(c.progress), composeView(IDENTITY_TRANSFORM, view))
}

describe('camera', () => {
  it('gives the same view for the same moment', () => {
    expect(followCamera.viewAt(ctx(0.37))).toEqual(followCamera.viewAt(ctx(0.37)))
  })

  it('keeps the head in the middle of the frame while following', () => {
    for (const p of [0.2, 0.5, 0.8]) {
      const at = onScreen(ctx(p, { ...DEFAULT_CAMERA, mode: 'follow', zoom: 4 }))
      expect(Math.abs(at.x - 540)).toBeLessThan(108)
      expect(Math.abs(at.y - 960)).toBeLessThan(192)
    }
  })

  it('evens out the wobble of the line', () => {
    const steady = followCamera.viewAt(ctx(0.5, { ...DEFAULT_CAMERA, smoothing: 1.5 }))!
    const raw = followCamera.viewAt(ctx(0.5, { ...DEFAULT_CAMERA, smoothing: 0 }))!
    const line = { x: 100 + 880 * 0.5, y: 200 + 1500 * 0.5 }
    expect(Math.abs(steady.x - line.x)).toBeLessThan(Math.abs(raw.x - line.x) + 1e-9)
  })

  it('starts and ends a flyover on the whole route and is close in between', () => {
    const flyover = { ...DEFAULT_CAMERA, mode: 'flyover' as const, approach: 0.2 }
    expect(flyoverCamera.viewAt(ctx(0, flyover))).toBeNull()
    expect(flyoverCamera.viewAt(ctx(1, flyover))).toBeNull()
    expect(flyoverCamera.viewAt(ctx(0.5, flyover))?.zoom).toBe(flyover.zoom)
    const coming = flyoverCamera.viewAt(ctx(0.1, flyover))!.zoom
    expect(coming).toBeGreaterThan(1)
    expect(coming).toBeLessThan(flyover.zoom)
  })
})
