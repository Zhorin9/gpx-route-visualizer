// Enough for a 2× export of the tallest aspect (2160×3840) with zoom headroom.
const MAX_SIDE = 4096
const THUMB_SIDE = 160

// Decodes once and downsizes huge phone photos (48 MP+) so dragging a photo
// doesn't redraw a 200 MB bitmap every frame.
async function decodeDownsized(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D niedostępny')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

export async function loadPhoto(file: Blob): Promise<{ image: HTMLCanvasElement; thumb: string }> {
  const image = await decodeDownsized(file)
  const scale = THUMB_SIDE / Math.max(image.width, image.height)
  const thumb = document.createElement('canvas')
  thumb.width = Math.max(1, Math.round(image.width * scale))
  thumb.height = Math.max(1, Math.round(image.height * scale))
  thumb.getContext('2d')?.drawImage(image, 0, 0, thumb.width, thumb.height)
  return { image, thumb: thumb.toDataURL('image/jpeg', 0.75) }
}

const blurCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>()

// A cheap blur: shrink hard, let smoothing spread the pixels when it's scaled back up.
export function blurredBackdrop(image: HTMLCanvasElement): HTMLCanvasElement {
  const cached = blurCache.get(image)
  if (cached) return cached
  const scale = 40 / Math.max(image.width, image.height)
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(image.width * scale))
  small.height = Math.max(1, Math.round(image.height * scale))
  const ctx = small.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, small.width, small.height)
  }
  blurCache.set(image, small)
  return small
}

export function coverLayout(imgW: number, imgH: number, boxW: number, boxH: number, zoom: number, offsetX: number, offsetY: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH) * zoom
  const width = imgW * scale
  const height = imgH * scale
  const overflowX = Math.max(0, (width - boxW) / 2)
  const overflowY = Math.max(0, (height - boxH) / 2)
  const clampedX = Math.max(-overflowX, Math.min(overflowX, offsetX))
  const clampedY = Math.max(-overflowY, Math.min(overflowY, offsetY))
  return { width, height, x: (boxW - width) / 2 + clampedX, y: (boxH - height) / 2 + clampedY }
}

// Whole photo inside the box, centred, never cropped.
export function containLayout(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  const width = imgW * scale
  const height = imgH * scale
  return { width, height, x: (boxW - width) / 2, y: (boxH - height) / 2 }
}

let noise: HTMLCanvasElement | null = null

// Grey static on a transparent tile, laid over a gradient as film grain.
export function noiseTile(): HTMLCanvasElement {
  if (noise) return noise
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const data = ctx.createImageData(size, size)
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.random() * 255
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v
      data.data[i + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
  }
  noise = canvas
  return canvas
}
