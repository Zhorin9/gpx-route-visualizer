import type Konva from 'konva'
import { ASPECTS } from './aspects'
import { slugify } from './format'
import type { AspectKey, ExportFormat } from '../types'

// Nodes that only exist for editing (transformer, selection outlines) carry this name.
export const UI_ONLY = 'ui-only'

export const stageHandle: { current: Konva.Stage | null } = { current: null }

export function exportStage(format: ExportFormat, scale: 1 | 2, aspectKey: AspectKey, trackName: string | null): void {
  const stage = stageHandle.current
  if (!stage) return

  const uiNodes = stage.find(`.${UI_ONLY}`).filter((n) => n.visible())
  uiNodes.forEach((n) => n.hide())

  // The stage is drawn at preview size; pixelRatio scales it back up to the real output size.
  const pixelRatio = (ASPECTS[aspectKey].w * scale) / stage.width()
  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
    quality: 0.92,
  })

  uiNodes.forEach((n) => n.show())
  stage.batchDraw()

  const base = slugify(trackName ?? '') || 'trasa'
  const link = document.createElement('a')
  link.download = `${base}-${aspectKey.replace(':', 'x')}${scale === 2 ? '@2x' : ''}.${format}`
  link.href = dataUrl
  // Firefox needs the <a> in the document for .click() to trigger a download.
  document.body.appendChild(link)
  link.click()
  link.remove()
}
