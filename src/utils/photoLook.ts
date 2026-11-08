import { newCanvas, noiseTile } from './image'
import type { TKey } from '../i18n'

export type PhotoGrade = 'none' | 'warm' | 'cool' | 'faded' | 'bw' | 'vivid'

// A film's look over every photo: a colour grade, lifted blacks and grain (0-100).
export interface PhotoLook {
  grade: PhotoGrade
  fade: number
  grain: number
}

export const NO_PHOTO_LOOK: PhotoLook = { grade: 'none', fade: 0, grain: 0 }

export const PHOTO_GRADES: { value: PhotoGrade; label: TKey }[] = [
  { value: 'warm', label: 'photoLook.warm' },
  { value: 'cool', label: 'photoLook.cool' },
  { value: 'faded', label: 'photoLook.faded' },
  { value: 'bw', label: 'photoLook.bw' },
  { value: 'vivid', label: 'photoLook.vivid' },
]

// The style board's CSS filters; cool also gets its blue-grey veil.
const FILTERS: Record<PhotoGrade, string> = {
  none: 'none',
  warm: 'sepia(0.35) saturate(1.35) contrast(1.05)',
  cool: 'saturate(0.65) contrast(0.9) brightness(1.05)',
  faded: 'saturate(0.8) contrast(0.85) brightness(1.08)',
  bw: 'grayscale(1) contrast(1.1)',
  vivid: 'contrast(1.2) saturate(1.15)',
}
const COOL_VEIL = 'rgba(220,230,240,0.08)'

// The tile's grain is about a frame pixel however large the photo is.
const FRAME_WIDTH = 1080

export const isPlainLook = (look: PhotoLook) => look.grade === 'none' && look.fade <= 0 && look.grain <= 0

type Source = HTMLImageElement | ImageBitmap | HTMLCanvasElement

const done = new WeakMap<Source, { key: string; canvas: HTMLCanvasElement }>()

// The photo as the look paints it, kept per photo until the look changes; the same in the preview and in files.
export function withPhotoLook<T extends Source>(image: T, look: PhotoLook, seed: number): T | HTMLCanvasElement {
  if (isPlainLook(look)) return image
  const key = JSON.stringify([look, seed])
  const known = done.get(image)
  if (known?.key === key) return known.canvas
  const { canvas, ctx } = newCanvas(image.width, image.height)
  if (!ctx) return image
  ctx.filter = FILTERS[look.grade]
  ctx.drawImage(image, 0, 0)
  ctx.filter = 'none'
  if (look.grade === 'cool') {
    ctx.fillStyle = COOL_VEIL
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  if (look.fade > 0) {
    // Nothing gets darker than this grey: the blacks of an old print.
    const floor = Math.round((look.fade / 100) * 70)
    ctx.globalCompositeOperation = 'lighten'
    ctx.fillStyle = `rgb(${floor},${floor},${floor})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  const pattern = look.grain > 0 ? ctx.createPattern(noiseTile(seed), 'repeat') : null
  if (pattern) {
    pattern.setTransform(new DOMMatrix().scale(Math.max(1, canvas.width / FRAME_WIDTH)))
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = (look.grain / 100) * 0.8
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  done.set(image, { key, canvas })
  return canvas
}
