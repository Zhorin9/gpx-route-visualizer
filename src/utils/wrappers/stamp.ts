import { mixHex } from '../color'
import { canvasFont } from '../fonts'
import { drawText, fitText } from '../canvasText'
import { clipOutsideBox, colors, paperOnGround, type WrapperDef } from './paint'

// A whole number of steps, so no corner gets half a hole.
export function perforation(length: number, step: number): number[] {
  const n = Math.max(1, Math.round(length / step))
  return Array.from({ length: n }, (_, k) => ((k + 0.5) * length) / n)
}

export const stamp: WrapperDef = {
  label: 'Znaczek',
  fields: ['place', 'date'],
  room: () => ({ l: 0.11, t: 0.11, r: 0.11, b: 0.2 }),
  draw(ctx, b, scene) {
    const { w, h, look } = scene
    const { place, date } = scene.wrapper.fields
    const c = colors(look)
    const u = Math.min(w, h)
    const pad = 0.05 * u
    const row = 0.09 * u
    const paper = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 + row }
    const ground = mixHex(c.accent, c.paper, 0.72)
    clipOutsideBox(ctx, scene, b, () => {
      paperOnGround(ctx, scene, ground, c.paper, paper)
      // The holes of the perforation, cut in the ground's colour.
      const step = 0.04 * u
      const hole = (x: number, y: number, r: number) => {
        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, Math.PI * 2)
      }
      const across = perforation(paper.w, step)
      const down = perforation(paper.h, step)
      ctx.fillStyle = ground
      ctx.beginPath()
      for (const x of across) {
        hole(paper.x + x, paper.y, (paper.w / across.length) * 0.3)
        hole(paper.x + x, paper.y + paper.h, (paper.w / across.length) * 0.3)
      }
      for (const y of down) {
        hole(paper.x, paper.y + y, (paper.h / down.length) * 0.3)
        hole(paper.x + paper.w, paper.y + y, (paper.h / down.length) * 0.3)
      }
      ctx.fill()

      const f = 0.012 * u
      ctx.strokeStyle = c.ink
      ctx.lineWidth = Math.max(1, u * 0.0018)
      ctx.strokeRect(b.x - f, b.y - f, b.w + f * 2, b.h + f * 2)

      // The place at the left, the year at the right as the stamp's value.
      const base = paper.y + paper.h - pad * 0.75
      const year = date.match(/\d{4}$/)?.[0] ?? ''
      ctx.font = canvasFont(look.font, 0.07 * u)
      const yearW = year ? ctx.measureText(year).width : 0
      if (year) drawText(ctx, year, paper.x + paper.w - pad, base, c.ink, 'right')
      if (place) {
        ctx.letterSpacing = `${(0.004 * u).toFixed(1)}px`
        const value = fitText(ctx, place.toUpperCase(), paper.w - pad * 3 - yearW, look.font, 0.03 * u)
        drawText(ctx, value, paper.x + pad, base, c.ink)
        ctx.letterSpacing = '0px'
      }
    })
  },
}
