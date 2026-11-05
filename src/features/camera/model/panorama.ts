import type { CameraView } from '../../../core/route/view'
import type { Point2D } from '../../../utils/geometry'
import { clamp, clamp01 } from '../../../utils/math'
import type { CameraContext, CameraStrategy } from './camera'

// Shares of the route's length, except where said otherwise.
const WINDOW_SHARE = 0.35
const SIGMA = 0.06
const LOOK_AHEAD = 0.03
// Share of the frame, each way, the head may wander from the middle.
const DEAD_ZONE = 0.4
const INTRO_ZOOM = 1.9
// Share of the route's box added on each side in the whole-route view.
const MARGIN = 0.1
// Tracking zoom, relative to the whole-route view.
const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.5
const SAMPLES = 24

export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function view({ area }: CameraContext, at: Point2D, zoom: number): CameraView {
  return { x: at.x, y: at.y, zoom, focusX: area.width / 2, focusY: area.height / 2 }
}

export function wholeRouteView(ctx: CameraContext): CameraView {
  const { bounds: b, area } = ctx
  const w = Math.max(b.maxX - b.minX, 1) * (1 + 2 * MARGIN)
  const h = Math.max(b.maxY - b.minY, 1) * (1 + 2 * MARGIN)
  return view(ctx, { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, Math.min(area.width / w, area.height / h))
}

// The window along the frame's longer side spans a set share of the route's extent that way.
export function trackingZoom(ctx: CameraContext): number {
  const { bounds: b, area } = ctx
  const wanted = area.width >= area.height ? area.width / (WINDOW_SHARE * Math.max(b.maxX - b.minX, 1)) : area.height / (WINDOW_SHARE * Math.max(b.maxY - b.minY, 1))
  const whole = wholeRouteView(ctx).zoom
  return clamp(wanted, MIN_ZOOM * whole, MAX_ZOOM * whole)
}

// The route evened out along its length, a little ahead of the head: loops and zigzags don't jerk the frame.
function smoothedPath(pathAt: CameraContext['pathAt'], share: number): Point2D {
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
  const zoom = trackingZoom(ctx)
  const ahead = smoothedPath(ctx.pathAt, share + LOOK_AHEAD)
  const head = ctx.pathAt(share)
  const centre = {
    x: intoDeadZone(ahead.x, head.x, ctx.area.width / (2 * zoom)),
    y: intoDeadZone(ahead.y, head.y, ctx.area.height / (2 * zoom)),
  }
  return view(ctx, centre, zoom)
}

export const panoramaCamera: CameraStrategy = {
  id: 'panorama',
  label: 'Panorama',
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
