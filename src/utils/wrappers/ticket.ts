import { mixHex } from '../color'
import { canvasFont } from '../fonts'
import { drawText, fitText, shrinkFontUntilFits } from '../canvasText'
import { clipOutsideBox, colors, paperOnGround, type WrapperDef } from './paint'

const STUB = 0.24
const SIDE = 0.3

export const ticket: WrapperDef = {
  label: 'wrappers.ticket',
  fields: ['title', 'from', 'to', 'date'],
  room: (side) => (side ? { l: 0.09, t: 0.09, b: 0.09, r: 0.09 + SIDE } : { l: 0.09, t: 0.09, r: 0.09, b: 0.09 + STUB }),
  draw(ctx, b, scene) {
    const { w, h, look, distance } = scene
    const { title, from, to, date } = scene.wrapper.fields
    const c = colors(look)
    const u = Math.min(w, h)
    const side = w >= h
    const pad = 0.035 * u
    const stub = (side ? SIDE : STUB) * u
    const t = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2 + (side ? stub : 0), h: b.h + pad * 2 + (side ? 0 : stub) }
    const ground = mixHex(c.paper, c.ink, c.dark ? 0.22 : 0.1)
    const notch = 0.028 * u
    clipOutsideBox(ctx, scene, b, () => {
      paperOnGround(ctx, scene, ground, c.paper, t)

      // The tear line: two half-round notches and a dashed rule between them.
      const cut = side ? b.x + b.w + pad : b.y + b.h + pad
      const ends = side ? [[cut, t.y], [cut, t.y + t.h]] : [[t.x, cut], [t.x + t.w, cut]]
      ctx.fillStyle = ground
      for (const [x, y] of ends) {
        ctx.beginPath()
        ctx.arc(x, y, notch, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.save()
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = c.ink
      ctx.lineWidth = Math.max(1.5, u * 0.0025)
      ctx.setLineDash([u * 0.012, u * 0.009])
      ctx.beginPath()
      if (side) {
        ctx.moveTo(cut, t.y + notch * 1.6)
        ctx.lineTo(cut, t.y + t.h - notch * 1.6)
      } else {
        ctx.moveTo(t.x + notch * 1.6, cut)
        ctx.lineTo(t.x + t.w - notch * 1.6, cut)
      }
      ctx.stroke()
      ctx.restore()

      // Start → finish; without places the title takes the line instead.
      const places = [from, to].filter(Boolean)
      const headline = places.length ? places : [title]
      const facts = [date, distance ?? '', places.length ? title : ''].filter(Boolean)

      if (side) {
        // Down the stub: start, an arrow, the finish, then the facts.
        const x = cut + pad
        const width = t.x + t.w - pad - x
        const size = width * 0.19
        const small = width * 0.1
        const lines = [...headline.flatMap((name, i) => (i ? ['↓', name] : [name]))]
        const total = lines.length * size * 1.15 + facts.length * small * 1.5 + small
        let y = t.y + (t.h - total) / 2
        for (const line of lines) {
          const value = fitText(ctx, line, width, look.font, size)
          drawText(ctx, value, x, y, line === '↓' ? c.accent : c.ink, 'left', 'top')
          y += size * 1.15
        }
        y += small
        for (const fact of facts) {
          const value = fitText(ctx, fact, width, look.font, small)
          ctx.globalAlpha = places.length && fact === title ? 0.6 : 1
          drawText(ctx, value, x, y, c.ink, 'left', 'top')
          ctx.globalAlpha = 1
          y += small * 1.5
        }
        return
      }

      // Across the stub: start → finish on one line, the facts in a row under it.
      const x = t.x + pad * 1.4
      const width = t.w - pad * 2.8
      const size = stub * 0.22
      const small = stub * 0.11
      const top = cut + (stub - size - small * 1.8) / 2
      const arrow = ' → '
      const measure = () => headline.reduce((a, name) => a + ctx.measureText(name).width, 0) + (headline.length - 1) * ctx.measureText(arrow).width
      const s = shrinkFontUntilFits(ctx, look.font, size, () => measure() <= width)
      const each = (width - (headline.length - 1) * ctx.measureText(arrow).width) / headline.length
      let cx = x
      headline.forEach((name, i) => {
        if (i) {
          drawText(ctx, arrow, cx, top, c.accent, 'left', 'top')
          cx += ctx.measureText(arrow).width
        }
        const value = measure() > width ? fitText(ctx, name, each, look.font, s) : name
        ctx.font = canvasFont(look.font, s)
        drawText(ctx, value, cx, top, c.ink, 'left', 'top')
        cx += ctx.measureText(value).width
      })
      const y = top + s + small * 0.8
      ctx.font = canvasFont(look.font, small)
      facts.forEach((fact, i) => {
        const align: CanvasTextAlign = facts.length === 1 ? 'left' : i === 0 ? 'left' : i === facts.length - 1 ? 'right' : 'center'
        const at = align === 'left' ? x : align === 'right' ? x + width : x + width / 2
        ctx.globalAlpha = places.length && fact === title ? 0.6 : 1
        drawText(ctx, fitText(ctx, fact, width / facts.length - small, look.font, small), at, y, c.ink, align, 'top')
        ctx.globalAlpha = 1
      })
    })
  },
}
