import type Konva from 'konva'
import { beginStageFrames } from '../core/export/frameSource'
import { canvasElement } from '../core/canvas/registry'
import { useAppStore } from '../store/useAppStore'
import i18n from '../i18n'
import { UI_ONLY, stageHandle, type ExportFile } from './exportImage'
import { slugify } from './format'
import { newCanvas } from './image'
import type { Selection } from '../types'

export type ElementTarget = { kind: 'text'; id: number } | Extract<Selection, { kind: 'element' }>

export const PNG_SIDES = [1080, 2160, 4096] as const
export type PngSide = (typeof PNG_SIDES)[number]

export const elementNodeId = (target: ElementTarget) => (target.kind === 'element' ? `element-${target.element}` : `text-${target.id}`)

type Sharpener = (filePxPerFramePx: number) => Promise<() => void>
const sharpeners = new Map<string, Sharpener>()

export function provideSharpener(target: ElementTarget, sharpen: Sharpener): () => void {
  const id = elementNodeId(target)
  sharpeners.set(id, sharpen)
  return () => {
    if (sharpeners.get(id) === sharpen) sharpeners.delete(id)
  }
}

const TRIM_PASS_RATIO = 2

function opaqueBounds(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext('2d')
  if (!ctx || !canvas.width || !canvas.height) return null
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

function snapshot(node: Konva.Node, rect: { x: number; y: number; width: number; height: number }, pixelRatio: number): HTMLCanvasElement {
  const stage = node.getStage()
  const uiNodes = (stage?.find(`.${UI_ONLY}`) ?? []).filter((n) => n.visible())
  uiNodes.forEach((n) => n.hide())
  const canvas = node.toCanvas({ ...rect, pixelRatio })
  uiNodes.forEach((n) => n.show())
  return canvas
}

export async function renderElement(target: ElementTarget, longSide: PngSide): Promise<HTMLCanvasElement> {
  const source = await beginStageFrames()
  let restoreSharp = () => {}
  try {
    const node = stageHandle.current?.findOne(`#${elementNodeId(target)}`)
    if (!node) throw new Error(i18n.t('elementExport.notFound'))
    const frameRect = node.getClientRect({ relativeTo: node.getStage() ?? undefined })
    const sharpen = sharpeners.get(elementNodeId(target))
    if (sharpen) restoreSharp = await sharpen(longSide / Math.max(frameRect.width, frameRect.height, 1))
    await source.useFormat(useAppStore.getState().aspectKey)

    const loose = node.getClientRect()
    const rough = opaqueBounds(snapshot(node, loose, TRIM_PASS_RATIO))
    if (!rough) throw new Error(i18n.t('elementExport.empty'))
    const pad = 1 / TRIM_PASS_RATIO
    const tight = {
      x: loose.x + rough.x / TRIM_PASS_RATIO - pad,
      y: loose.y + rough.y / TRIM_PASS_RATIO - pad,
      width: rough.width / TRIM_PASS_RATIO + pad * 2,
      height: rough.height / TRIM_PASS_RATIO + pad * 2,
    }
    const pixelRatio = longSide / Math.max(tight.width, tight.height)
    const sharp = snapshot(node, tight, pixelRatio)
    const { canvas: out, ctx } = newCanvas(Math.round(tight.width * pixelRatio), Math.round(tight.height * pixelRatio))
    ctx?.drawImage(sharp, 0, 0, out.width, out.height)
    return out
  } finally {
    restoreSharp()
    source.end()
  }
}

function elementFileName(target: ElementTarget): string {
  const s = useAppStore.getState()
  const words = target.kind === 'element' ? i18n.t(canvasElement(target.element)?.label ?? 'elementExport.element') : (s.texts.find((n) => n.id === target.id)?.text ?? '')
  return `${slugify(words).slice(0, 40) || slugify(i18n.t('elementExport.element'))}.png`
}

const pngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(i18n.t('exportImage.saveFailed')))), 'image/png'))

export async function elementPng(target: ElementTarget, longSide: PngSide): Promise<ExportFile> {
  return { name: elementFileName(target), blob: await pngBlob(await renderElement(target, longSide)) }
}

export function canCopyImages(): boolean {
  return typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.clipboard?.write === 'function'
}

export async function copyElementPng(target: ElementTarget, longSide: PngSide): Promise<void> {
  const blob = elementPng(target, longSide).then((f) => f.blob)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
