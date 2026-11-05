// Frame pixels; `rotation` in degrees about the centre.
export interface ContentBox {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export const rad = (deg: number) => (deg * Math.PI) / 180

export function boxPath(ctx: CanvasRenderingContext2D, b: ContentBox) {
  ctx.save()
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.rotate(rad(b.rotation))
  ctx.rect(-b.w / 2, -b.h / 2, b.w, b.h)
  ctx.restore()
}

export function intoBox(b: ContentBox, w: number, h: number, x: number, y: number): { x: number; y: number } {
  const s = b.w / w
  const a = rad(b.rotation)
  const dx = (x - w / 2) * s
  const dy = (y - h / 2) * s
  return { x: b.x + b.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: b.y + b.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) }
}

export function fromBox(b: ContentBox, w: number, h: number, x: number, y: number): { x: number; y: number } {
  const s = b.w / w
  const a = -rad(b.rotation)
  const dx = x - b.x - b.w / 2
  const dy = y - b.y - b.h / 2
  return { x: w / 2 + (dx * Math.cos(a) - dy * Math.sin(a)) / s, y: h / 2 + (dx * Math.sin(a) + dy * Math.cos(a)) / s }
}
