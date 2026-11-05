import { canvasFont, type FontStyle } from './fonts'

export function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of value.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line)
        line = word
      } else line = next
    }
    lines.push(line)
  }
  return lines
}

export function drawText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left', baseline: CanvasTextBaseline = 'alphabetic') {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(value, x, y)
}

// Stops at about half the size; what still doesn't fit is the caller's to cut.
export function shrinkFontUntilFits(ctx: CanvasRenderingContext2D, family: string, size: number, fits: () => boolean, style: FontStyle = {}): number {
  let s = size
  ctx.font = canvasFont(family, s, style)
  while (s > size * 0.55 && !fits()) {
    s *= 0.92
    ctx.font = canvasFont(family, s, style)
  }
  return s
}

export function fitText(ctx: CanvasRenderingContext2D, value: string, maxW: number, family: string, size: number, style: FontStyle = {}): string {
  const fits = (text: string) => ctx.measureText(text).width <= maxW
  shrinkFontUntilFits(ctx, family, size, () => fits(value), style)
  if (fits(value)) return value
  let cut = value
  while (cut.length > 1 && !fits(`${cut}…`)) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}
