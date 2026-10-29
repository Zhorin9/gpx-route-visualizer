import type Konva from 'konva'
import { FORMATS } from '../core/formats/registry'
import { slugify } from './format'
import { createZip } from './zip'
import type { AspectKey, ExportFormat } from '../types'

// Nodes that only exist for editing (transformer, selection outlines) carry this name.
export const UI_ONLY = 'ui-only'

export const stageHandle: { current: Konva.Stage | null } = { current: null }

export interface ExportFile {
  name: string
  blob: Blob
}

export function exportFileNames(
  format: string,
  scale: 1 | 2,
  aspectKey: AspectKey,
  trackName: string | null,
  slideCount: number,
): string[] {
  const base = slugify(trackName ?? '') || 'trasa'
  const suffix = `${aspectKey.replace(':', 'x')}${scale === 2 ? '@2x' : ''}.${format}`
  if (slideCount === 1) return [`${base}-${suffix}`]
  // Numbered in the strip's order, two digits so the files sort the same way: alpy-01-4x5.jpg.
  return Array.from({ length: slideCount }, (_, i) => `${base}-${String(i + 1).padStart(2, '0')}-${suffix}`)
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać obrazu'))), mime, quality))
}

// One slide of the rendered ribbon, cropped to the exact output size.
export function cropSlide(ribbon: HTMLCanvasElement, index: number, aspectKey: AspectKey, scale: number, target?: HTMLCanvasElement): HTMLCanvasElement {
  const w = FORMATS[aspectKey].w * scale
  const h = FORMATS[aspectKey].h * scale
  const out = target ?? document.createElement('canvas')
  if (out.width !== w) out.width = w
  if (out.height !== h) out.height = h
  const ctx = out.getContext('2d')
  ctx?.clearRect(0, 0, w, h)
  ctx?.drawImage(ribbon, index * w, 0, w, h, 0, 0, w, h)
  return out
}

// JPG has no transparency: see-through parts (gaps of a collage on a transparent
// background) would turn black, so they are laid on white instead.
function onWhite(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)
  return out
}

// Cuts the ribbon of the current format into one image file per exported slide (by index).
export async function ribbonToFiles(
  ribbon: HTMLCanvasElement,
  format: ExportFormat,
  scale: 1 | 2,
  aspectKey: AspectKey,
  trackName: string | null,
  slides: number[],
): Promise<ExportFile[]> {
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const names = exportFileNames(format, scale, aspectKey, trackName, slides.length)
  const files: ExportFile[] = []
  for (let i = 0; i < slides.length; i++) {
    const slide = cropSlide(ribbon, slides[i], aspectKey, scale)
    files.push({ name: names[i], blob: await canvasToBlob(format === 'jpg' ? onWhite(slide) : slide, mime) })
  }
  return files
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  // Firefox needs the <a> in the document for .click() to trigger a download.
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// One file is saved as is; several go into a single ZIP.
export async function downloadFiles(files: ExportFile[], archiveName: string) {
  if (files.length === 0) return
  if (files.length === 1) return downloadBlob(files[0].blob, files[0].name)
  const entries = await Promise.all(files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.blob.arrayBuffer()) })))
  downloadBlob(createZip(entries), `${archiveName}.zip`)
}

export function archiveBaseName(trackName: string | null): string {
  return slugify(trackName ?? '') || 'trasa'
}
