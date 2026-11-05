import { describe, expect, it } from 'vitest'
import { applyTransform, type Point2D } from '../../utils/geometry'
import { composeView } from '../../core/route/view'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { DEFAULT_CAMERA, type CameraContext } from './model/camera'
import { panoramaCamera, trackingView, wholeRouteView } from './model/panorama'

const SETTINGS = { ...DEFAULT_CAMERA, mode: 'panorama' as const }

// A coastal A→B in a 16:9 frame, and a city loop that comes back to its start.
const coast = (s: number): Point2D => ({ x: 120 + 1680 * s + Math.sin(s * 30) * 40, y: 540 + Math.sin(s * 7) * 260 })
const loop = (s: number): Point2D => ({ x: 960 + Math.cos(s * 2 * Math.PI) * 700, y: 540 + Math.sin(s * 2 * Math.PI) * 380 })

function ctx(pathAt: (s: number) => Point2D, share: number, phase: Partial<CameraContext> = {}): CameraContext {
  const xs = Array.from({ length: 201 }, (_, i) => pathAt(i / 200))
  return {
    progress: share,
    headAt: pathAt,
    pathAt,
    headShare: share,
    bounds: { minX: Math.min(...xs.map((p) => p.x)), minY: Math.min(...xs.map((p) => p.y)), maxX: Math.max(...xs.map((p) => p.x)), maxY: Math.max(...xs.map((p) => p.y)) },
    area: { width: 1920, height: 1080 },
    entering: 1,
    leaving: 0,
    duration: 6,
    settings: SETTINGS,
    ...phase,
  }
}

const onScreen = (c: CameraContext, at: Point2D) => applyTransform(at, composeView(IDENTITY_TRANSFORM, panoramaCamera.viewAt(c)))

describe('panorama camera', () => {
  it('keeps the head inside the middle 40% of the frame for the whole ride', () => {
    for (const path of [coast, loop]) {
      for (let k = 0; k <= 100; k++) {
        const at = onScreen(ctx(path, k / 100), path(k / 100))
        expect(Math.abs(at.x - 960)).toBeLessThanOrEqual(0.2 * 1920 + 1e-6)
        expect(Math.abs(at.y - 540)).toBeLessThanOrEqual(0.2 * 1080 + 1e-6)
      }
    }
  })

  it('does not jump between frames on a loop', () => {
    let before = panoramaCamera.viewAt(ctx(loop, 0))!
    for (let k = 1; k <= 450; k++) {
      const now = panoramaCamera.viewAt(ctx(loop, k / 450))!
      expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeLessThan(40)
      before = now
    }
  })

  it('starts close over the start and settles to the tracking zoom', () => {
    const tracking = trackingView(ctx(coast, 0), 0)
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 0 }))!.zoom).toBeCloseTo(tracking.zoom * 1.9)
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 1 }))).toEqual(tracking)
  })

  it('ends on the whole route with a 10% margin', () => {
    const last = panoramaCamera.viewAt(ctx(coast, 1, { leaving: 1 }))!
    const c = ctx(coast, 1)
    expect(last.zoom).toBeCloseTo(wholeRouteView(c).zoom)
    const corner = applyTransform({ x: c.bounds.minX, y: c.bounds.minY }, composeView(IDENTITY_TRANSFORM, last))
    const box = (c.bounds.maxX - c.bounds.minX) * last.zoom
    expect(corner.x).toBeCloseTo((1920 - box * 1.2) / 2 + box * 0.1)
  })

  it('without the intro and outro, follows from the first frame to the last', () => {
    const off = { ...SETTINGS, introOutro: false }
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 0, settings: off }))).toEqual(trackingView(ctx(coast, 0), 0))
    expect(panoramaCamera.viewAt(ctx(coast, 1, { leaving: 1, settings: off }))).toEqual(trackingView(ctx(coast, 1), 1))
  })
})
