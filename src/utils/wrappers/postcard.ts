import { mixHex } from '../color'
import { canvasFont } from '../fonts'
import { drawText, fitText, wrapText } from '../canvasText'
import { clipOutsideBox, colors, dateLines, type WrapperDef, type WrapperScene } from './paint'

const BAND = 0.22
const SIDE = 0.27

function stampField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, scene: WrapperScene, accent: string) {
  const u = Math.min(scene.w, scene.h)
  ctx.strokeStyle = accent
  ctx.lineWidth = Math.max(1.5, u * 0.0022)
  ctx.strokeRect(x, y, w, h)
  const lines = dateLines(scene.wrapper.fields.date)
  const size = Math.min(h * 0.2, w * 0.24)
  lines.forEach((line, i) => {
    ctx.font = canvasFont(scene.look.font, size)
    drawText(ctx, fitText(ctx, line, w * 0.86, scene.look.font, size), x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.3, accent, 'center', 'middle')
  })
}

export const postcard: WrapperDef = {
  label: 'Pocztówka',
  fields: ['place', 'date', 'note'],
  room: (side) => (side ? { l: 0.06, t: 0.06, b: 0.06, r: 0.1 + SIDE } : { l: 0.06, t: 0.06, r: 0.06, b: 0.1 + BAND }),
  draw(ctx, b, scene) {
    const { w, h, look } = scene
    const { place, note } = scene.wrapper.fields
    const c = colors(look)
    const u = Math.min(w, h)
    const gap = 0.04 * u
    const rule = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = c.ink
      ctx.lineWidth = Math.max(1, u * 0.0016)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    clipOutsideBox(ctx, scene, b, () => {
      ctx.fillStyle = mixHex(c.paper, '#f2cf96', c.dark ? 0.06 : 0.16)
      ctx.fillRect(0, 0, w, h)

      if (w >= h) {
        // Beside the content: the stamp on top, a rule, then the place and the note.
        const band = { x: b.x + b.w + gap, y: b.y, w: SIDE * u }
        const sh = band.w * 0.86
        stampField(ctx, band.x, band.y, band.w, sh, scene, c.accent)
        rule(band.x, band.y + sh + gap * 0.6, band.x + band.w, band.y + sh + gap * 0.6)
        let y = band.y + sh + gap * 1.3
        const size = band.w * 0.2
        ctx.font = canvasFont(look.font, size)
        for (const line of wrapText(ctx, place, band.w).slice(0, 3)) {
          drawText(ctx, fitText(ctx, line, band.w, look.font, size), band.x, y, c.ink, 'left', 'top')
          y += size * 1.1
        }
        const small = band.w * 0.12
        ctx.font = canvasFont(look.font, small, { italic: true })
        for (const line of wrapText(ctx, note, band.w).slice(0, 4)) {
          drawText(ctx, line, band.x, y + small * 0.4, c.ink, 'left', 'top')
          y += small * 1.3
        }
        return
      }

      // Under the content: the place and the note, a rule, the stamp at the right.
      const band = { x: b.x, y: b.y + b.h + gap, w: b.w, h: BAND * u }
      const sw = band.h * 0.74
      const sx = band.x + band.w - sw
      stampField(ctx, sx, band.y, sw, band.h, scene, c.accent)
      rule(sx - gap * 0.7, band.y, sx - gap * 0.7, band.y + band.h)
      const maxW = sx - gap * 1.4 - band.x
      const big = band.h * 0.3
      const small = band.h * 0.15
      const mid = band.y + band.h / 2
      if (place) {
        const value = fitText(ctx, place, maxW, look.font, big)
        drawText(ctx, value, band.x, note ? mid - small * 0.3 : mid, c.ink, 'left', note ? 'alphabetic' : 'middle')
      }
      if (note) {
        const value = fitText(ctx, note, maxW, look.font, small, { italic: true })
        drawText(ctx, value, band.x, place ? mid + small * 0.5 : mid, c.ink, 'left', place ? 'top' : 'middle')
      }
    })
  },
}
