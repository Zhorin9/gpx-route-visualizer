import { clamp, seededRandom } from './math'
// Enough for a 2× export of the tallest aspect (2160×3840) with zoom headroom.
const MAX_SIDE = 4096
const THUMB_SIDE = 160

export function newCanvas(width: number, height: number, settings?: CanvasRenderingContext2DSettings) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return { canvas, ctx: canvas.getContext('2d', settings) }
}

function scaledToLongerSide(image: HTMLCanvasElement, side: number): HTMLCanvasElement {
  const scale = side / Math.max(image.width, image.height)
  const { canvas, ctx } = newCanvas(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)))
  if (ctx) {
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  }
  return canvas
}

// So dragging a 48 MP photo doesn't redraw a 200 MB bitmap every frame.
async function decodeDownsized(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const { canvas, ctx } = newCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale))
  if (!ctx) throw new Error('Canvas 2D niedostępny')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

export async function loadPhoto(file: Blob): Promise<{ image: HTMLCanvasElement; thumb: string }> {
  const image = await decodeDownsized(file)
  return { image, thumb: scaledToLongerSide(image, THUMB_SIDE).toDataURL('image/jpeg', 0.75) }
}

const blurCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>()

// Cheap blur: shrink hard and let smoothing spread the pixels on the way back up.
export function blurredBackdrop(image: HTMLCanvasElement): HTMLCanvasElement {
  const cached = blurCache.get(image)
  if (cached) return cached
  const small = scaledToLongerSide(image, 40)
  blurCache.set(image, small)
  return small
}

export function coverLayout(imgW: number, imgH: number, boxW: number, boxH: number, zoom: number, offsetX: number, offsetY: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH) * zoom
  const width = imgW * scale
  const height = imgH * scale
  const overflowX = Math.max(0, (width - boxW) / 2)
  const overflowY = Math.max(0, (height - boxH) / 2)
  const clampedX = clamp(offsetX, -overflowX, overflowX)
  const clampedY = clamp(offsetY, -overflowY, overflowY)
  return { width, height, x: (boxW - width) / 2 + clampedX, y: (boxH - height) / 2 + clampedY }
}

const ZOOM_STEP = 0.1
const MAX_ZOOM = 4

export const zoomedBy = (zoom: number, steps: number) => clamp(zoom + steps * ZOOM_STEP, 1, MAX_ZOOM)

export const wheelSteps = (deltaY: number) => (deltaY < 0 ? 1 : -1)

interface Area {
  x: number
  y: number
  w: number
  h: number
}

export function coveringPosition(at: { x: number; y: number }, box: Area, photo: { width: number; height: number }) {
  return { x: clamp(at.x, box.x + box.w - photo.width, box.x), y: clamp(at.y, box.y + box.h - photo.height, box.y) }
}

export function containLayout(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  const width = imgW * scale
  const height = imgH * scale
  return { width, height, x: (boxW - width) / 2, y: (boxH - height) / 2 }
}

const noise = new Map<number, HTMLCanvasElement>()

// Grain from the project's seed, so the preview and every export of it show the same specks.
export function noiseTile(seed: number): HTMLCanvasElement {
  const known = noise.get(seed)
  if (known) return known
  const size = 256
  const { canvas, ctx } = newCanvas(size, size)
  if (ctx) {
    const random = seededRandom(seed)
    const data = ctx.createImageData(size, size)
    for (let i = 0; i < data.data.length; i += 4) {
      const v = random() * 255
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v
      data.data[i + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
  }
  if (noise.size > 8) noise.clear()
  noise.set(seed, canvas)
  return canvas
}
