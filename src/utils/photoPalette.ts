import { contrastRatio } from './color'

// Colours from the photos, worked out in OKLCH/Oklab: there the distance between two colours
// follows how different they look.

export interface Oklch {
  L: number
  C: number
  h: number
}

export interface Sample extends Oklch {
  a: number
  b: number
}

export interface Swatch extends Sample {
  // Of the samples counted, 0-1.
  share: number
}

export type PhotoTheme = Record<'route' | 'bg' | 'text' | 'accent', string>

export interface PhotoPalette {
  colors: Swatch[]
  // Under 15% of the samples carry colour: the proposal is built from the greys.
  grey: boolean
}

const hue = (a: number, b: number) => ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
const fromLab = (L: number, a: number, b: number, share = 0): Swatch => ({ L, a, b, C: Math.hypot(a, b), h: hue(a, b), share })
const fromLch = ({ L, C, h }: Oklch, share = 0) => fromLab(L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180), share)
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

export function rgbToOklch(r: number, g: number, b: number): Sample {
  const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const R = lin(r), G = lin(g), B = lin(b)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return fromLab(
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  )
}

// Out-of-gamut colours are clipped per channel.
export function oklchToHex(c: Oklch): string {
  const { L, a, b } = fromLch(c)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return `#${rgb.map((v) => Math.round(clamp(gamma(clamp(v))) * 255).toString(16).padStart(2, '0')).join('')}`
}

// ---------- A1: samples ----------

// Every 2nd RGBA pixel; transparent, near-white and near-black ones are left out, greys kept apart.
export function sortPixels(data: ArrayLike<number>, colored: Sample[], neutral: Sample[]): void {
  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] < 128) continue
    const c = rgbToOklch(data[i], data[i + 1], data[i + 2])
    if (c.L > 0.95 || c.L < 0.12) continue
    if (c.C < 0.03) neutral.push(c)
    else colored.push(c)
  }
}

// Each photo is read at 64 px on its longer side, so a big photo weighs as much as a small one.
export function readSamples(images: HTMLCanvasElement[]): { colored: Sample[]; neutral: Sample[] } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const colored: Sample[] = [], neutral: Sample[] = []
  if (!ctx) return { colored, neutral }
  for (const img of images) {
    const scale = 64 / Math.max(img.width, img.height)
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    sortPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, colored, neutral)
  }
  return { colored, neutral }
}

// ---------- A2: dominant colours ----------

const dist = (p: Sample, q: Sample) => Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b)

function mean(g: Sample[]): Swatch {
  const avg = (key: 'L' | 'a' | 'b') => g.reduce((sum, p) => sum + p[key], 0) / g.length
  return fromLab(avg('L'), avg('a'), avg('b'))
}

// k-means in Oklab, seeded with samples spread evenly along the hue, so a set always gives the same result.
// Groups under 4% of the samples are dropped; the rest come largest first.
export function dominant(samples: Sample[], k = 6, iters = 10): Swatch[] {
  const pts = samples.slice().sort((p, q) => p.h - q.h)
  let centers: Sample[] = Array.from({ length: k }, (_, i) => pts[Math.floor(((i + 0.5) * pts.length) / k)])
  let groups: Sample[][] = []
  for (let it = 0; it < iters; it++) {
    groups = centers.map(() => [])
    for (const p of pts) {
      let best = 0
      centers.forEach((c, j) => {
        if (dist(p, c) < dist(p, centers[best])) best = j
      })
      groups[best].push(p)
    }
    centers = groups.map((g, j) => (g.length ? mean(g) : centers[j]))
  }
  return centers
    .map((c, j) => fromLab(c.L, c.a, c.b, groups[j].length / pts.length))
    .filter((c) => c.share >= 0.04)
    .sort((x, y) => y.share - x.share)
}

// Colours closer than `minDist` become one (weighted by share); the four largest stay. Fewer than four
// are made up with lighter and darker takes on the largest.
export function mergeClose(list: Swatch[], minDist = 0.08): Swatch[] {
  const out: Swatch[] = []
  for (const c of list) {
    const i = out.findIndex((o) => dist(o, c) < minDist)
    if (i < 0) {
      out.push(c)
      continue
    }
    const o = out[i]
    const share = o.share + c.share
    const mix = (x: number, y: number) => (x * o.share + y * c.share) / share
    out[i] = fromLab(mix(o.L, c.L), mix(o.a, c.a), mix(o.b, c.b), share)
  }
  const top = out.sort((x, y) => y.share - x.share).slice(0, 4)
  for (const shift of [0.2, -0.2, 0.4, -0.4]) {
    if (top.length >= 4) break
    top.push(fromLch({ ...top[0], L: clamp(top[0].L + shift, 0.15, 0.92) }))
  }
  return top
}

export function photoPalette(images: HTMLCanvasElement[]): PhotoPalette {
  const { colored, neutral } = readSamples(images)
  const total = colored.length + neutral.length
  // Nothing but white and black: a mid grey to start from.
  if (!total) return { colors: mergeClose([fromLab(0.5, 0, 0, 1)]), grey: true }
  const grey = colored.length < 0.15 * total
  return { colors: mergeClose(dominant(grey ? [...colored, ...neutral] : colored)), grey }
}

// ---------- A3: roles ----------

// What "Inna propozycja" steps through: route and accent swapped, then the dark background.
export const THEME_VARIANTS = [
  { dark: false, swap: false },
  { dark: false, swap: true },
  { dark: true, swap: false },
  { dark: true, swap: true },
]

const contrast = (x: Oklch, y: Oklch) => contrastRatio(oklchToHex(x), oklchToHex(y))
const hueGap = (x: number, y: number) => Math.min(Math.abs(x - y), 360 - Math.abs(x - y))

// Moves L away from the background in steps of 0.05 until the contrast holds.
function readable(c: Oklch, bg: Oklch, min: number): Oklch {
  const step = bg.L > 0.5 ? -0.05 : 0.05
  let out = c
  while (contrast(out, bg) < min && out.L > 0 && out.L < 1) out = { ...out, L: clamp(out.L + step) }
  return out
}

export function assignRoles(colors: Swatch[], { dark, swap }: { dark: boolean; swap: boolean }): Record<keyof PhotoTheme, Oklch> {
  const vivid = colors.reduce((x, y) => (y.C > x.C ? y : x))
  const other = colors.find((c) => c !== vivid && hueGap(c.h, vivid.h) >= 40)
  const [first, second] = [vivid, other ?? { ...vivid, L: clamp(vivid.L + (vivid.L > 0.6 ? -0.2 : 0.2)) }]
  const [route, accent] = swap ? [second, first] : [first, second]

  const light = colors.reduce((x, y) => (y.L > x.L ? y : x))
  const bg = { L: dark ? 0.18 : 0.96, C: Math.min(light.C, dark ? 0.03 : 0.02), h: light.h }
  return {
    route: readable({ L: route.L, C: route.C < 0.08 ? 0.12 : route.C, h: route.h }, bg, 3),
    bg,
    // In the accent's hue, toned down so it still reads as text; light text holds less colour.
    text: readable({ L: dark ? 0.94 : 0.22, C: Math.min(accent.C, dark ? 0.04 : 0.06), h: accent.h }, bg, 4.5),
    accent: { L: accent.L, C: accent.C, h: accent.h },
  }
}

export function photoTheme(palette: PhotoPalette, variant: number): PhotoTheme {
  const roles = assignRoles(palette.colors, THEME_VARIANTS[variant % THEME_VARIANTS.length])
  return { route: oklchToHex(roles.route), bg: oklchToHex(roles.bg), text: oklchToHex(roles.text), accent: oklchToHex(roles.accent) }
}
