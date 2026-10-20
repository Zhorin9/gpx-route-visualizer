import type Konva from 'konva'
import { ASPECTS } from './aspects'
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
  return Array.from({ length: slideCount }, (_, i) => `${base}-slajd-${i + 1}-${suffix}`)
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać obrazu'))), mime, quality))
}

// One slide of the rendered ribbon, cropped to the exact output size.
export function cropSlide(ribbon: HTMLCanvasElement, index: number, aspectKey: AspectKey, scale: number, target?: HTMLCanvasElement): HTMLCanvasElement {
  const w = ASPECTS[aspectKey].w * scale
  const h = ASPECTS[aspectKey].h * scale
  const out = target ?? document.createElement('canvas')
  if (out.width !== w) out.width = w
  if (out.height !== h) out.height = h
  const ctx = out.getContext('2d')
  ctx?.clearRect(0, 0, w, h)
  ctx?.drawImage(ribbon, index * w, 0, w, h, 0, 0, w, h)
  return out
}

// Cuts the ribbon of the current format into one image file per slide.
export async function ribbonToFiles(
  ribbon: HTMLCanvasElement,
  format: ExportFormat,
  scale: 1 | 2,
  aspectKey: AspectKey,
  trackName: string | null,
  slideCount: number,
): Promise<ExportFile[]> {
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const names = exportFileNames(format, scale, aspectKey, trackName, slideCount)
  const files: ExportFile[] = []
  for (let i = 0; i < slideCount; i++) {
    files.push({ name: names[i], blob: await canvasToBlob(cropSlide(ribbon, i, aspectKey, scale), mime) })
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
