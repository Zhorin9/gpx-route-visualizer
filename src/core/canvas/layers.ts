import type { ElementKind, Selection } from '../../types'

export type LayerKey = string
export type LayerMove = 'front' | 'back' | 'up' | 'down'

export const ROUTE_LAYER = 'route'
export const elementLayer = (kind: ElementKind) => `element:${kind}`
export const textLayer = (id: number) => `text:${id}`
export const slotLayer = (slide: number, index: number) => `slot:${slide}:${index}`

export function layerKeyOf(selection: Selection | null): LayerKey | null {
  if (!selection) return null
  if (selection.kind === 'element') return elementLayer(selection.element)
  if (selection.kind === 'text') return textLayer(selection.id)
  if (selection.kind === 'slot') return slotLayer(selection.slide, selection.index)
  return null
}

export function orderedLayers(defaults: LayerKey[], stored: readonly LayerKey[]): LayerKey[] {
  const present = new Set(defaults)
  const order = [...new Set(stored)].filter((key) => present.has(key))
  for (let i = defaults.length - 1; i >= 0; i--) {
    const key = defaults[i]
    if (order.includes(key)) continue
    const above = defaults.slice(i + 1).find((k) => order.includes(k))
    order.splice(above ? order.indexOf(above) : order.length, 0, key)
  }
  return order
}

export function movedLayer(order: LayerKey[], key: LayerKey, move: LayerMove): LayerKey[] {
  const from = order.indexOf(key)
  if (from < 0) return order
  const to = { front: order.length - 1, back: 0, up: Math.min(order.length - 1, from + 1), down: Math.max(0, from - 1) }[move]
  return placedAt(order, key, order[to])
}

export function placedAt(order: LayerKey[], key: LayerKey, target: LayerKey): LayerKey[] {
  const from = order.indexOf(key)
  const to = order.indexOf(target)
  if (from < 0 || to < 0 || from === to) return order
  const next = order.filter((k) => k !== key)
  next.splice(to, 0, key)
  return next
}

export function stickersUnderPhotos(order: LayerKey[], stickers: LayerKey[], photos: LayerKey[]): LayerKey[] {
  if (!photos.length) return order
  return [...stickers, ...photos, ...order.filter((k) => !stickers.includes(k) && !photos.includes(k))]
}

let keysOnFrame: LayerKey[] = []

export const publishLayerKeys = (keys: LayerKey[]) => {
  keysOnFrame = keys
}

export const layerKeysOnFrame = () => keysOnFrame
