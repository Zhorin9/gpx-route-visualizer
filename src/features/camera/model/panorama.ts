import type { CameraView } from '../../../core/route/view'
import { rotate, type Point2D } from '../../../utils/geometry'
import { clamp, clamp01 } from '../../../utils/math'
import { memoOne } from '../../../utils/memo'
import type { Bounds } from '../../../utils/gpx'
import type { CameraContext, CameraStrategy } from './camera'

// Shares of the route's length, except where said otherwise.
const WINDOW_SHARE = 0.35
const SIGMA = 0.06
const LOOK_AHEAD = 0.03
// Share of the frame, each way, the head may wander from the middle.
const DEAD_ZONE = 0.4
const INTRO_ZOOM = 1.9
export const INTRO_SECONDS = 1.5
// Share of the route's box added on each side in the whole-route view.
const MARGIN = 0.1
// Tracking zoom, relative to the whole-route view.
const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.5
const SAMPLES = 24

const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const turn = (p: Point2D, deg: number) => rotate(p.x, p.y, deg)

// The route's main axis (its first principal component) along the frame's longer side, start on the left or at the bottom.
function routeAngle(route: readonly Point2D[], landscape: boolean): number {
  if (route.length < 2) return 0
  const mx = route.reduce((a, p) => a + p.x, 0) / route.length
  const my = route.reduce((a, p) => a + p.y, 0) / route.length
  let xx = 0
  let yy = 0
  let xy = 0
  for (const p of route) {
    xx += (p.x - mx) ** 2
    yy += (p.y - my) ** 2
    xy += (p.x - mx) * (p.y - my)
  }
  const axis = (Math.atan2(2 * xy, xx - yy) * 90) / Math.PI
  const angle = (landscape ? 0 : 90) - axis
  const start = turn(route[0], angle)
  const end = turn(route[route.length - 1], angle)
  const backwards = landscape ? start.x > end.x : start.y < end.y
  return backwards ? angle + 180 : angle
}

// How far the view turns, and the route's box once turned.
const frameOf = memoOne((route: readonly Point2D[], turned: boolean, landscape: boolean): { angle: number; bounds: Bounds } => {
  const angle = turned ? routeAngle(route, landscape) : 0
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const p of route) {
    const q = turn(p, angle)
    b.minX = Math.min(b.minX, q.x)
    b.minY = Math.min(b.minY, q.y)
    b.maxX = Math.max(b.maxX, q.x)
    b.maxY = Math.max(b.maxY, q.y)
  }
  return { angle, bounds: b }
})

const frameFor = ({ route, area, settings }: CameraContext) => frameOf(route, settings.orientation === 'route', area.width >= area.height)

// Centre given in the turned frame.
function view({ area }: CameraContext, angle: number, centre: Point2D, zoom: number): CameraView {
  const at = turn(centre, -angle)
  return { x: at.x, y: at.y, zoom, focusX: area.width / 2, focusY: area.height / 2, rotation: angle }
}

export function wholeRouteView(ctx: CameraContext): CameraView {
  const { angle, bounds: b } = frameFor(ctx)
  const w = Math.max(b.maxX - b.minX, 1) * (1 + 2 * MARGIN)
  const h = Math.max(b.maxY - b.minY, 1) * (1 + 2 * MARGIN)
  return view(ctx, angle, { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, Math.min(ctx.area.width / w, ctx.area.height / h))
}

// The window along the frame's longer side spans a set share of the route's extent that way.
function trackingZoom(ctx: CameraContext): number {
  const { bounds: b } = frameFor(ctx)
  const { area } = ctx
  const wanted = area.width >= area.height ? area.width / (WINDOW_SHARE * Math.max(b.maxX - b.minX, 1)) : area.height / (WINDOW_SHARE * Math.max(b.maxY - b.minY, 1))
  const whole = wholeRouteView(ctx).zoom
  return clamp(wanted, MIN_ZOOM * whole, MAX_ZOOM * whole)
}

// The route evened out along its length, a little ahead of the head: loops and zigzags don't jerk the frame.
function smoothedPath(pathAt: (share: number) => Point2D, share: number): Point2D {
  let x = 0
  let y = 0
  let total = 0
  for (let k = 0; k <= SAMPLES; k++) {
    const u = (k / SAMPLES - 0.5) * 6
    const w = Math.exp((-u * u) / 2)
    const p = pathAt(clamp01(share + u * SIGMA))
    x += p.x * w
    y += p.y * w
    total += w
  }
  return { x: x / total, y: y / total }
}

// The smallest shift that keeps the head inside the middle of the frame.
function intoDeadZone(centre: number, head: number, halfWindow: number): number {
  const reach = DEAD_ZONE * halfWindow
  const off = head - centre
  return Math.abs(off) <= reach ? centre : centre + off - Math.sign(off) * reach
}

export function trackingView(ctx: CameraContext, share: number): CameraView {
  const { angle } = frameFor(ctx)
  const zoom = trackingZoom(ctx)
  const at = (s: number) => turn(ctx.pathAt(s), angle)
  const ahead = smoothedPath(at, share + LOOK_AHEAD)
  const head = at(share)
  const centre = {
    x: intoDeadZone(ahead.x, head.x, ctx.area.width / (2 * zoom)),
    y: intoDeadZone(ahead.y, head.y, ctx.area.height / (2 * zoom)),
  }
  return view(ctx, angle, centre, zoom)
}

export const panoramaCamera: CameraStrategy = {
  id: 'panorama',
  label: 'camera.modes.panorama',
  viewAt: (ctx) => {
    if (ctx.settings.introOutro && ctx.entering < 1) {
      const start = trackingView(ctx, 0)
      return { ...start, zoom: start.zoom * lerp(INTRO_ZOOM, 1, easeInOutCubic(ctx.entering)) }
    }
    if (ctx.settings.introOutro && ctx.leaving > 0) {
      const from = trackingView(ctx, 1)
      const to = wholeRouteView(ctx)
      const t = easeInOutCubic(ctx.leaving)
      return { ...from, x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), zoom: lerp(from.zoom, to.zoom, t) }
    }
    return trackingView(ctx, ctx.headShare)
  },
}
