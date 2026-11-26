export interface LabelSpan {
  left: number
  right: number
}

export function labelSpan(markX: number, textWidth: number, gap: number, minX: number, maxX: number): LabelSpan {
  const right = { left: markX + gap, right: markX + gap + textWidth }
  const left = { left: markX - gap - textWidth, right: markX - gap }
  const overflow = (span: LabelSpan) => Math.max(0, minX - span.left) + Math.max(0, span.right - maxX)
  return overflow(left) < overflow(right) ? left : right
}
