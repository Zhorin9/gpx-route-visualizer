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
  format: ExportFormat,
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

function toBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać obrazu'))), mime, 0.92))
}

// Renders the whole ribbon of the current format once and cuts it into one file per slide.
export async function renderStageFiles(
  format: ExportFormat,
  scale: 1 | 2,
  aspectKey: AspectKey,
  trackName: string | null,
  slideCount: number,
): Promise<ExportFile[]> {
  const stage = stageHandle.current
  if (!stage) return []

  const uiNodes = stage.find(`.${UI_ONLY}`).filter((n) => n.visible())
  uiNodes.forEach((n) => n.hide())

  const outW = ASPECTS[aspectKey].w * scale
  const outH = ASPECTS[aspectKey].h * scale
  // The stage is drawn at preview size; pixelRatio scales it back up. The ratio is fractional,
  // so the canvas can come out a pixel short — render a hair larger, then crop to the exact size.
  const pixelRatio = ((outW * slideCount) / stage.width()) * 1.0001
  const rendered = stage.toCanvas({ pixelRatio })
  uiNodes.forEach((n) => n.show())
  stage.batchDraw()

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const names = exportFileNames(format, scale, aspectKey, trackName, slideCount)
  const files: ExportFile[] = []
  for (let i = 0; i < slideCount; i++) {
    const out = document.createElement('canvas')
    out.width = outW
    out.height = outH
    out.getContext('2d')?.drawImage(rendered, i * outW, 0, outW, outH, 0, 0, outW, outH)
    files.push({ name: names[i], blob: await toBlob(out, mime) })
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
