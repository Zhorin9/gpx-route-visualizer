import { forwardRef } from 'react'
import { Shape } from 'react-konva'
import type Konva from 'konva'
import { textShadow } from '../core/canvas/shadows'
import { channels } from '../utils/color'
import type { WarpedLine } from '../utils/warp'
import type { TextNode } from '../types'

type ShapeProps = Omit<Konva.ShapeConfig, 'sceneFunc' | 'hitFunc'>

export interface WarpedTextProps extends ShapeProps {
  node: TextNode
  line: WarpedLine
  // Letters past this count are not drawn yet (typing); the layout is the whole text's.
  shown: number
  fontSize: number
  fontStyle: string
  color: string
}

// Letters on a curve, drawn one by one: hard shadow, outline, then the letters themselves.
const WarpedText = forwardRef<Konva.Shape, WarpedTextProps>(function WarpedText({ node, line, shown, fontSize, fontStyle, color, ...rest }, ref) {
  const glyphs = line.glyphs.slice(0, shown)

  function paint(c: CanvasRenderingContext2D, pass: { dx: number; dy: number; fill: string; stroke?: string; width?: number; soft?: boolean }) {
    for (const g of glyphs) {
      c.save()
      c.translate(g.x + pass.dx, g.y + pass.dy)
      c.rotate((g.rotation * Math.PI) / 180)
      c.scale(1, g.scaleY)
      if (pass.stroke && pass.width) {
        c.lineJoin = 'round'
        c.lineWidth = pass.width
        c.strokeStyle = pass.stroke
        c.strokeText(g.ch, 0, 0)
      }
      if (pass.soft) {
        const shadow = textShadow(pass.fill)
        c.shadowColor = `rgba(${channels(shadow.shadowColor).join(',')},${shadow.shadowOpacity})`
        c.shadowBlur = shadow.shadowBlur
      }
      c.fillStyle = pass.fill
      c.fillText(g.ch, 0, 0)
      c.restore()
    }
  }

  return (
    <Shape
      ref={ref}
      {...rest}
      width={line.width}
      height={line.height}
      sceneFunc={(ctx) => {
        const c = ctx._context
        c.font = `${fontStyle} ${fontSize}px "${node.fontFamily}"`
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        const outline = node.outlineEnabled ? node.outlineWidth * 2 : 0
        const hard = node.hardShadow
        if (hard) paint(c, { dx: hard.dx, dy: hard.dy, fill: hard.color, stroke: hard.color, width: outline })
        if (outline) paint(c, { dx: 0, dy: 0, fill: node.outlineColor, stroke: node.outlineColor, width: outline })
        paint(c, { dx: 0, dy: 0, fill: color, soft: node.shadowEnabled && !hard })
      }}
      hitFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.rect(0, 0, line.width, line.height)
        ctx.closePath()
        ctx.fillStrokeShape(shape)
      }}
    />
  )
})

export default WarpedText
