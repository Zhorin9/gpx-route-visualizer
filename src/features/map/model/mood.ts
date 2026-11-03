import type { CSSProperties } from 'react'
import { channels } from '../../../utils/color'
import { noiseTile } from '../../../utils/image'
import type { MapSettings } from '../types'

// How the map sits behind the route: faded into a ground colour, edges darkened, toned, grained.
// Only the map changes; the route and texts above it keep their full colour.
export type MapMood = Pick<MapSettings, 'opacity' | 'ground' | 'vignette' | 'sepia' | 'grain' | 'blur'>

export const MOODS: { id: string; label: string; mood: MapMood }[] = [
  { id: 'full', label: 'Pełna', mood: { opacity: 1, ground: '#3a2a1c', vignette: 0.3, sepia: 0, grain: 0, blur: 0 } },
  { id: 'ghost', label: 'Duch mapy', mood: { opacity: 0.25, ground: '#1f1a14', vignette: 1, sepia: 0, grain: 0, blur: 0 } },
  { id: 'film', label: 'Taśma', mood: { opacity: 0.7, ground: '#11100e', vignette: 0.5, sepia: 0.5, grain: 0.16, blur: 0 } },
  { id: 'depth', label: 'Głębia', mood: { opacity: 0.7, ground: '#ede6d6', vignette: 0, sepia: 0, grain: 0, blur: 2.5 } },
]

export const moodOf = (s: MapMood) =>
  MOODS.find(({ mood: m }) => m.opacity === s.opacity && m.ground === s.ground && m.vignette === s.vignette && m.sepia === s.sepia && m.grain === s.grain && m.blur === s.blur)?.id ?? null

// Clear in the middle, the ground colour at the corners; the same stops in CSS and on canvas.
const VIGNETTE_CLEAR = 0.35
const VIGNETTE_ALPHA = 0.8

const rgba = (hex: string, a: number) => `rgba(${channels(hex).join(',')},${a})`

export function vignetteCss(s: MapMood, slideWidth: number): CSSProperties | null {
  if (s.vignette <= 0) return null
  return {
    backgroundImage: `radial-gradient(ellipse at center, transparent ${VIGNETTE_CLEAR * 100}%, ${rgba(s.ground, s.vignette * VIGNETTE_ALPHA)} 100%)`,
    backgroundSize: `${slideWidth}px 100%`,
  }
}

let grainUrl: string | null = null

// The tile is laid at 256 frame pixels, in the preview and in files alike.
export function grainCss(s: MapMood, pixel: number): CSSProperties | null {
  if (s.grain <= 0) return null
  grainUrl ??= noiseTile().toDataURL()
  return { backgroundImage: `url(${grainUrl})`, backgroundSize: `${256 * pixel}px`, opacity: s.grain, mixBlendMode: 'overlay' }
}

// The map of a file, as the preview shows it: `slideWidth` in frame pixels, the canvas at `scale`.
export function finishMap(map: HTMLCanvasElement, s: MapMood, slideWidth: number, scale: number): HTMLCanvasElement {
  if (s.opacity >= 1 && s.vignette <= 0 && s.sepia <= 0 && s.grain <= 0) return map
  const out = document.createElement('canvas')
  out.width = map.width
  out.height = map.height
  const ctx = out.getContext('2d')
  if (!ctx) return map
  ctx.fillStyle = s.ground
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.globalAlpha = s.opacity
  ctx.filter = s.sepia > 0 ? `sepia(${s.sepia})` : 'none'
  ctx.drawImage(map, 0, 0)
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  if (s.vignette > 0) {
    // CSS's "ellipse at center" reaches the corners: half the side times √2 each way.
    const w = slideWidth * scale
    const rx = (w / 2) * Math.SQRT2
    const ry = (out.height / 2) * Math.SQRT2
    for (let x = 0; x < out.width; x += w) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, 0, w, out.height)
      ctx.clip()
      ctx.translate(x + w / 2, out.height / 2)
      ctx.scale(rx, ry)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(VIGNETTE_CLEAR, 'transparent')
      g.addColorStop(1, rgba(s.ground, s.vignette * VIGNETTE_ALPHA))
      ctx.fillStyle = g
      ctx.fillRect(-w / 2 / rx, -out.height / 2 / ry, w / rx, out.height / ry)
      ctx.restore()
    }
  }

  const pattern = s.grain > 0 ? ctx.createPattern(noiseTile(), 'repeat') : null
  if (pattern) {
    pattern.setTransform(new DOMMatrix().scale(scale))
    ctx.globalAlpha = s.grain
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }
  return out
}
