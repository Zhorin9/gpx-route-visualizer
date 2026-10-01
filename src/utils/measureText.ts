let ctx: CanvasRenderingContext2D | null = null
const cache = new Map<string, number>()

// Matches the font string Konva builds, so widths line up with what's drawn.
export function measureTextWidth(text: string, fontFamily: string, fontSize: number, fontStyle = 'normal'): number {
  const font = `${fontStyle} normal ${fontSize}px "${fontFamily}"`
  const key = `${font}|${text}`
  const cached = cache.get(key)
  if (cached != null) return cached
  ctx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * fontSize * 0.58
  ctx.font = font
  const width = ctx.measureText(text).width
  cache.set(key, width)
  return width
}

// Call once a web font finishes loading — earlier measurements used a fallback font.
export function clearTextMeasureCache(): void {
  cache.clear()
}
