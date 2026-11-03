export const INK = '#2d2b2b'
export const PAPER = '#f3f2f2'

export function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0')
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0) as [number, number, number]
}

// Relative luminance, 0 (black) to 1 (white).
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// WCAG contrast ratio, 1 to 21; text needs 4.5.
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// `t` of the way from a to b; halfway by default.
export function mixHex(a: string, b: string, t = 0.5): string {
  const [ar, ag, ab] = channels(a)
  const [br, bg, bb] = channels(b)
  const to = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${to(ar, br)}${to(ag, bg)}${to(ab, bb)}`
}

export type Tone = 'light' | 'dark'

export function toneOf(hex: string): Tone {
  return luminance(hex) > 0.35 ? 'light' : 'dark'
}

// Maps a CSS-style angle (180 = top to bottom) to start/end points that span the whole box.
export function gradientLine(angle: number, w: number, h: number) {
  const rad = (angle * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  const cx = w / 2
  const cy = h / 2
  return { start: { x: cx - dx * half, y: cy - dy * half }, end: { x: cx + dx * half, y: cy + dy * half } }
}
