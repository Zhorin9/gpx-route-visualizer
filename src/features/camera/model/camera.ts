import type { CameraView } from '../../../core/route/view'
import type { Point2D } from '../../../utils/geometry'
import { easeInOut } from '../../animation/model/timeline'

export type CameraId = 'static' | 'follow' | 'flyover'

export interface CameraSettings {
  mode: CameraId
  // How many times closer than the whole route.
  zoom: number
  // Seconds of the line's travel the camera evens out: higher is calmer on a winding route.
  smoothing: number
  // Flyover: share of the drawing spent coming in at the start and going back out at the end.
  approach: number
}

export const DEFAULT_CAMERA: CameraSettings = { mode: 'static', zoom: 3, smoothing: 1, approach: 0.2 }

export interface CameraContext {
  // 0-1 of the route's bar on the timeline.
  progress: number
  // Where the head of the line is on the frame (static view) at a progress of the bar.
  headAt: (progress: number) => Point2D
  // Middle of the route's area: what the camera looks at is brought here.
  focus: Point2D
  // Seconds the drawing takes, to turn the smoothing time into a share of it.
  duration: number
  settings: CameraSettings
}

// A camera is a pure function of the moment, so preview, scrubbing and export frame by frame
// show the same view at the same time.
export interface CameraStrategy {
  id: CameraId
  label: string
  viewAt: (ctx: CameraContext) => CameraView | null
}

const SAMPLES = 12
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// The head's position averaged over a stretch of time around now: no lag behind the line,
// and GPS zigzags don't shake the frame.
function smoothedHead({ progress, headAt, duration, settings }: CameraContext): Point2D {
  const span = Math.min(1, settings.smoothing / Math.max(duration, 0.1))
  if (span <= 0) return headAt(progress)
  let x = 0
  let y = 0
  for (let k = 0; k <= SAMPLES; k++) {
    const p = headAt(clamp01(progress + span * (k / SAMPLES - 0.5)))
    x += p.x
    y += p.y
  }
  return { x: x / (SAMPLES + 1), y: y / (SAMPLES + 1) }
}

function followView(ctx: CameraContext): CameraView {
  const c = smoothedHead(ctx)
  return { x: c.x, y: c.y, zoom: ctx.settings.zoom, focusX: ctx.focus.x, focusY: ctx.focus.y }
}

// Between the whole route (t = 0) and a close view (t = 1). The centre moves with the zoom,
// not evenly, so the point being approached stays put on screen while the camera comes in.
function between(to: CameraView, t: number, focus: Point2D): CameraView {
  const zoom = Math.exp(Math.log(to.zoom) * t)
  const w = to.zoom === 1 ? t : (1 - 1 / zoom) / (1 - 1 / to.zoom)
  return { x: focus.x + (to.x - focus.x) * w, y: focus.y + (to.y - focus.y) * w, zoom, focusX: focus.x, focusY: focus.y }
}

export const staticCamera: CameraStrategy = { id: 'static', label: 'Statyczna', viewAt: () => null }

export const followCamera: CameraStrategy = { id: 'follow', label: 'Śledzenie', viewAt: followView }

export const flyoverCamera: CameraStrategy = {
  id: 'flyover',
  label: 'Przelot',
  viewAt: (ctx) => {
    const a = Math.max(0.01, ctx.settings.approach)
    const t = Math.min(1, ctx.progress / a, (1 - ctx.progress) / a)
    if (t <= 0) return null
    const close = followView(ctx)
    return t >= 1 ? close : between(close, easeInOut(t), ctx.focus)
  },
}

export const CAMERAS: readonly CameraStrategy[] = [staticCamera, followCamera, flyoverCamera]

export function cameraFor(id: CameraId): CameraStrategy {
  return CAMERAS.find((c) => c.id === id) ?? staticCamera
}
