import { drawText, fitText } from '../canvasText'
import { noiseTile } from '../image'
import { boxPath, rad } from './box'
import { clipOutsideBox, colors, noShadow, shadow, type WrapperDef } from './paint'

const NOTE = 0.09

export const album: WrapperDef = {
  label: 'Album',
  fields: ['note'],
  room: (_, fields) => ({ l: 0.08, t: 0.08, r: 0.08, b: 0.08 + (fields.note ? NOTE : 0) }),
  rotation: -1.5,
  draw(ctx, b, scene) {
    const { w, h, look } = scene
    const { note } = scene.wrapper.fields
    const c = colors(look)
    const u = Math.min(w, h)
    clipOutsideBox(ctx, scene, b, () => {
      ctx.fillStyle = c.paper
      ctx.fillRect(0, 0, w, h)
      // A whisper of grain, so it reads as paper rather than a flat colour.
      const grain = ctx.createPattern(noiseTile(), 'repeat')
      if (grain) {
        ctx.globalAlpha = 0.06
        ctx.fillStyle = grain
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
      }
      // The pasted print's shadow; the print itself is the content.
      shadow(ctx, u)
      ctx.fillStyle = c.paper
      ctx.beginPath()
      boxPath(ctx, b)
      ctx.fill()
      noShadow(ctx)
      if (note) {
        const tilt = Math.abs(Math.sin(rad(b.rotation))) * (b.w / 2)
        const value = fitText(ctx, note, b.w * 0.9, look.font, 0.04 * u, { italic: true })
        drawText(ctx, value, b.x + b.w / 2, b.y + b.h + tilt + (NOTE * u) / 2, c.ink, 'center', 'middle')
      }
    })

    // Photo corners over the print's corners, turned with it.
    const cs = 0.075 * u
    const o = 0.01 * u
    ctx.save()
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
    ctx.rotate(rad(b.rotation))
    ctx.globalAlpha = 0.85
    ctx.fillStyle = c.ink
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = (sx * b.w) / 2 + sx * o
      const y = (sy * b.h) / 2 + sy * o
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - sx * cs, y)
      ctx.lineTo(x, y - sy * cs)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  },
}
