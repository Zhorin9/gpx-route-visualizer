import { describe, expect, it } from 'vitest'
import { applyTransform, type Point2D } from '../../utils/geometry'
import { composeView } from '../../core/route/view'
import { IDENTITY_TRANSFORM } from '../../store/defaults'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_ANIMATION } from '../animation/types'
import { DEFAULT_CAMERA, type CameraContext, type CameraSettings } from './model/camera'
import { INTRO_SECONDS, panoramaCamera, trackingView, wholeRouteView } from './model/panorama'

const NORTH: CameraSettings = { ...DEFAULT_CAMERA, mode: 'panorama', orientation: 'north' }
const ALONG: CameraSettings = { ...NORTH, orientation: 'route' }
const LANDSCAPE = { width: 1920, height: 1080 }

// A coastal A→B, a city loop that comes back to its start, and a ride due south.
const coast = (s: number): Point2D => ({ x: 120 + 1680 * s + Math.sin(s * 30) * 40, y: 540 + Math.sin(s * 7) * 260 })
const loop = (s: number): Point2D => ({ x: 960 + Math.cos(s * 2 * Math.PI) * 700, y: 540 + Math.sin(s * 2 * Math.PI) * 380 })
const south = (s: number): Point2D => ({ x: 960 + Math.sin(s * 12) * 60, y: 60 + 960 * s })

function ctx(pathAt: (s: number) => Point2D, share: number, more: Partial<CameraContext> = {}): CameraContext {
  return {
    progress: share,
    headAt: pathAt,
    pathAt,
    headShare: share,
    route: Array.from({ length: 201 }, (_, i) => pathAt(i / 200)),
    area: LANDSCAPE,
    entering: 1,
    leaving: 0,
    duration: 6,
    settings: NORTH,
    ...more,
  }
}

const onScreen = (c: CameraContext, at: Point2D) => applyTransform(at, composeView(IDENTITY_TRANSFORM, panoramaCamera.viewAt(c)))

describe('panorama camera', () => {
  it('keeps the head inside the middle 40% of the frame for the whole ride', () => {
    for (const path of [coast, loop, south]) {
      for (const settings of [NORTH, ALONG]) {
        for (let k = 0; k <= 100; k++) {
          const at = onScreen(ctx(path, k / 100, { settings }), path(k / 100))
          expect(Math.abs(at.x - 960)).toBeLessThanOrEqual(0.2 * 1920 + 1e-6)
          expect(Math.abs(at.y - 540)).toBeLessThanOrEqual(0.2 * 1080 + 1e-6)
        }
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

  it('turns a ride due south to run left to right in a landscape frame', () => {
    const last = wholeRouteView(ctx(south, 1, { settings: ALONG }))
    const start = applyTransform(south(0), composeView(IDENTITY_TRANSFORM, last))
    const end = applyTransform(south(1), composeView(IDENTITY_TRANSFORM, last))
    expect(end.x - start.x).toBeGreaterThan(Math.abs(end.y - start.y) * 5)
    expect(wholeRouteView(ctx(south, 1, { settings: NORTH })).rotation).toBe(0)
  })

  it('runs a ride due east from the bottom up in a portrait frame', () => {
    const last = wholeRouteView(ctx(coast, 1, { settings: ALONG, area: { width: 1080, height: 1920 } }))
    const start = applyTransform(coast(0), composeView(IDENTITY_TRANSFORM, last))
    const end = applyTransform(coast(1), composeView(IDENTITY_TRANSFORM, last))
    expect(start.y - end.y).toBeGreaterThan(Math.abs(end.x - start.x) * 2)
  })

  it('starts close over the start and settles to the tracking zoom', () => {
    const tracking = trackingView(ctx(coast, 0), 0)
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 0 }))!.zoom).toBeCloseTo(tracking.zoom * 1.9)
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 1 }))).toEqual(tracking)
  })

  it('ends on the whole route with a 10% margin', () => {
    for (const settings of [NORTH, ALONG]) {
      const last = panoramaCamera.viewAt(ctx(coast, 1, { leaving: 1, settings }))!
      const ends = [0, 1].map((s) => applyTransform(coast(s), composeView(IDENTITY_TRANSFORM, last)))
      expect(last.zoom).toBeCloseTo(wholeRouteView(ctx(coast, 1, { settings })).zoom)
      // The coast runs nearly flat, so its ends sit in the margin's band on the left and the right.
      for (const at of ends) expect(Math.min(at.x, 1920 - at.x)).toBeGreaterThan(1920 * 0.05)
    }
  })

  it('without the intro and outro, follows from the first frame to the last', () => {
    const off = { ...NORTH, introOutro: false }
    expect(panoramaCamera.viewAt(ctx(coast, 0, { entering: 0, settings: off }))).toEqual(trackingView(ctx(coast, 0), 0))
    expect(panoramaCamera.viewAt(ctx(coast, 1, { leaving: 1, settings: off }))).toEqual(trackingView(ctx(coast, 1), 1))
  })

  it('holds the line back long enough for the intro when the panorama is picked', () => {
    useAppStore.setState({ animation: { ...DEFAULT_ANIMATION, enabled: true }, camera: DEFAULT_CAMERA })
    useAppStore.getState().updateCamera({ mode: 'panorama' })
    const { route, waypoints } = useAppStore.getState().animation.clips
    expect(route.start).toBe(INTRO_SECONDS)
    expect(waypoints.start).toBe(INTRO_SECONDS)
  })
})
