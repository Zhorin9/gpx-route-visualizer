import { contrastRatio, toneOf } from '../color'
import { boxPath, type ContentBox } from './box'
import type { SlideLook, Wrapper, WrapperField } from '../../types'

export interface WrapperScene {
  w: number
  h: number
  wrapper: Wrapper
  look: SlideLook
  distance: string | null
}

export interface WrapperDef {
  label: string
  // In the order Teksty lists them.
  fields: WrapperField[]
  // Fractions of the slide's shorter side. side: a square or landscape slide, whose band goes beside the content.
  room: (side: boolean, fields: Wrapper['fields']) => { l: number; t: number; r: number; b: number }
  rotation?: number
  draw: (ctx: CanvasRenderingContext2D, box: ContentBox, scene: WrapperScene) => void
}

// An accent that wouldn't read on the paper (a white route) gives way to the ink.
export function colors(look: SlideLook) {
  const accent = contrastRatio(look.accent, look.paper) >= 3 ? look.accent : look.ink
  return { paper: look.paper, ink: look.ink, accent, dark: toneOf(look.paper) === 'dark' }
}

export function dateLines(date: string): string[] {
  const m = date.match(/^(.*)\.(\d{4})$/)
  return m ? [m[1], m[2]] : date ? [date] : []
}

export function clipOutsideBox(ctx: CanvasRenderingContext2D, scene: WrapperScene, b: ContentBox, draw: () => void) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, scene.w, scene.h)
  boxPath(ctx, b)
  ctx.clip('evenodd')
  draw()
  ctx.restore()
}

export function shadow(ctx: CanvasRenderingContext2D, u: number) {
  ctx.shadowColor = 'rgba(45,43,43,0.22)'
  ctx.shadowBlur = u * 0.012
  ctx.shadowOffsetY = u * 0.003
}

export function noShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

export function paperOnGround(ctx: CanvasRenderingContext2D, scene: WrapperScene, ground: string, paper: string, sheet: { x: number; y: number; w: number; h: number }) {
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, scene.w, scene.h)
  shadow(ctx, Math.min(scene.w, scene.h))
  ctx.fillStyle = paper
  ctx.fillRect(sheet.x, sheet.y, sheet.w, sheet.h)
  noShadow(ctx)
}
