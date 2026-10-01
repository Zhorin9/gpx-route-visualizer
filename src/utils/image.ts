// Enough for a 2× export of the tallest aspect (2160×3840) with zoom headroom.
const MAX_SIDE = 4096

// Decodes once and downsizes huge phone photos (48 MP+) so dragging the
// background doesn't redraw a 200 MB bitmap every frame.
export async function loadBackgroundImage(file: Blob): Promise<HTMLCanvasElement> {
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
