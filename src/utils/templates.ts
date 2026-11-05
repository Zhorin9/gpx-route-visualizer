import { DEFAULT_COLLAGE, DEFAULT_ROUTE_STYLE, DEFAULT_STATS_STYLE } from '../store/defaults'
import type { BackgroundPattern, PhotoMarker, RouteStyle, StyleTemplate } from '../types'

const { shape: _shape, schematicSimplify: _simplify, ...DEFAULT_ROUTE_LOOK } = DEFAULT_ROUTE_STYLE

const PRINT = '#fbf8f1'

const columns = (fontSize: number) => ({ arrangement: 'columns' as const, stretch: true, labels: true, dividers: true, fontSize })

const flat = (color: string, pattern: BackgroundPattern = 'none', grain = 0) => ({ from: color, to: color, angle: 180, grain, smooth: true, pattern })

// outline: [colour, width, opacity, blur]
function line(color: string, coreWidth: number, outline?: [string, number, number, number?], extra: Partial<RouteStyle> = {}): Partial<RouteStyle> {
  const under = outline && { glowEnabled: true, glowColor: outline[0], glowWidth: outline[1], glowOpacity: outline[2], glowBlur: outline[3] ?? 0 }
  return { ...DEFAULT_ROUTE_LOOK, color, coreWidth, remainingVisible: false, ...under, ...extra }
}

const gradient = (from: string, to: string, angle = 180, pattern: BackgroundPattern = 'none') => ({ from, to, angle, grain: 0, smooth: true, pattern })
const FONTS = { title: 'Cormorant Garamond', data: 'Lora', note: 'Lora' }
const CINZEL = { title: 'Cinzel', data: 'Lora', note: 'Lora' }
const MONO = { title: 'Cormorant Garamond', data: 'JetBrains Mono', note: 'JetBrains Mono' }

const NO_FRAME = { ...DEFAULT_COLLAGE.frame, enabled: false }
const POLAROID = { enabled: true, color: PRINT, thickness: 24, style: 'polaroid' as const }
const points = (marker: PhotoMarker) => ({ marker, size: 'M' as const })

type TemplateDefaults = 'fonts' | 'titleUppercase' | 'statsStyle' | 'frame' | 'layoutKey'
const template = (t: Omit<StyleTemplate, TemplateDefaults> & Partial<StyleTemplate>): StyleTemplate =>
  ({ fonts: FONTS, titleUppercase: true, statsStyle: columns(32), frame: NO_FRAME, layoutKey: 'g1', ...t })

export const BUILT_IN_TEMPLATES: StyleTemplate[] = [
  template({ id: 'papier', name: 'Papier', desc: 'polaroid', fonts: CINZEL, statsStyle: columns(DEFAULT_STATS_STYLE.fontSize - 6), textColor: '#3a2a1c',
    route: line('#8a3b24', 5, ['#8a3b24', 10, 0.18]), frame: POLAROID, gradient: flat('#ede6d6', 'none', 6), layoutKey: 'c1', pointStyle: points('polaroid') }),
  template({ id: 'blueprint', name: 'Blueprint', desc: 'kwadrat, ramka', fonts: { title: 'Cormorant Garamond', data: 'DM Mono', note: 'DM Mono' }, statsStyle: columns(30), textColor: '#e4f0ff',
    route: line('#e4f0ff', 4, ['#cfe6ff', 12, 0.12], { dashed: true }), gradient: flat('#123a63', 'grid'), pointStyle: points('square'), map: { labels: false } }),
  template({ id: 'topo', name: 'Topo', desc: 'kółko, obwódka', fonts: CINZEL, textColor: '#24351f',
    route: line('#2f5d3a', 6, ['#2f5d3a', 12, 0.15]), gradient: flat('#e9e4d3', 'contours'), pointStyle: points('circle'), map: { hillshade: true } }),
  template({ id: 'granat', name: 'Granat', desc: 'kwadrat, złoto', fonts: CINZEL, textColor: '#f1e6cf',
    route: line('#f4c47a', 5, ['#e8a64a', 14, 0.35, 12]), gradient: flat('#0f1a2b'), pointStyle: points('square') }),
  template({ id: 'neon', name: 'Neon', desc: 'poświata', fonts: MONO, statsStyle: columns(30), textColor: '#e6fff8',
    route: line('#d8fff3', 1.5, ['#5af0c8', 6, 0.44, 15]), gradient: flat('#0b0b0f'), pointStyle: points('circle') }),
  template({ id: 'plakat', name: 'Plakat', desc: 'polaroid, kontrast', fonts: CINZEL, statsStyle: columns(44), textColor: '#1c1b1a',
    route: line('#1c1b1a', 9, ['#1c1b1a', 16, 0.12]), frame: POLAROID, gradient: flat('#e8a64a'), pointStyle: points('polaroid') }),
  template({ id: 'minimal', name: 'Minimal', desc: 'tylko etykieta', titleUppercase: false, statsStyle: columns(28), textColor: '#201f1d',
    route: line('#201f1d', 4), gradient: flat('#f3f2f2'), pointStyle: points('label'), map: { labels: false } }),
  template({ id: 'film', name: 'Film', desc: 'klatka filmowa, podwójna linia', fonts: CINZEL, textColor: '#f3efe6',
    route: line('#17251f', 6, ['#e8a64a', 16, 1]), gradient: flat('#17251f'), pointStyle: points('film') }),

  template({ id: 'akwarela', name: 'Akwarela', desc: 'polaroid, miękka linia', group: 'natural', textColor: '#4a3b3b',
    route: line('#b84a3a', 5, ['#d77a61', 20, 0.35, 8]), frame: POLAROID, gradient: { ...gradient('#f6e3d3', '#d6e6ea', 150), grain: 6 }, layoutKey: 'c1', pointStyle: points('polaroid') }),
  template({ id: 'las', name: 'Las', desc: 'kółko, mech', group: 'natural', textColor: '#e8efd9',
    route: line('#d6e8b4', 5, ['#9fc37a', 14, 0.3]), gradient: flat('#1f3326'), pointStyle: points('circle'), map: { hillshade: true } }),
  template({ id: 'pustynia', name: 'Pustynia', desc: 'kwadrat, ochra', group: 'natural', textColor: '#4a2a14',
    route: line('#7a3416', 6, ['#7a3416', 12, 0.2]), gradient: gradient('#f0d6a8', '#e3b97a'), pointStyle: points('square') }),
  template({ id: 'lod', name: 'Lód', desc: 'kółko, chłód', group: 'natural', textColor: '#16384d',
    route: line('#16384d', 5, ['#2c7aa6', 14, 0.2]), gradient: gradient('#eaf3f8', '#cfe3ee'), pointStyle: points('circle') }),
  template({ id: 'lata70', name: 'Lata 70.', desc: 'polaroid, pomarańcz', group: 'retro', statsStyle: columns(40), textColor: '#5a2a12',
    route: line('#8a2f12', 8, ['#c4511e', 18, 0.3]), frame: POLAROID, gradient: flat('#e9d3a4', 'none', 8), pointStyle: points('polaroid') }),
  template({ id: 'atlas', name: 'Atlas', desc: 'kwadrat, sepia', group: 'retro', fonts: CINZEL, statsStyle: columns(30), textColor: '#3b2a14',
    route: line('#4b2f12', 5, ['#6b4a22', 10, 0.25], { dotted: true }), gradient: gradient('#efe0bd', '#e3cf9f', 180, 'contours'), pointStyle: points('square'), map: { hillshade: true } }),
  template({ id: 'pocztowka', name: 'Pocztówka', desc: 'ramka, stempel', group: 'retro', textColor: '#b3392b',
    route: line('#1f4e79', 6, ['#b3392b', 10, 0.15], { dashed: true }), frame: { enabled: true, color: '#ffffff', thickness: 12, style: 'equal' }, gradient: flat('#faf6ea'), pointStyle: points('square') }),
  template({ id: 'szkic', name: 'Szkic', desc: 'bez zdjęć, ołówek', group: 'retro', fonts: CINZEL, statsStyle: columns(28), textColor: '#2b2b2b',
    route: line('#2b2b2b', 3, ['#2b2b2b', 8, 0.12], { dashed: true }), gradient: flat('#f4f1e8', 'none', 10), pointStyle: points('label'), map: { labels: false } }),

  template({ id: 'cyberpunk', name: 'Cyberpunk', desc: 'róż i błękit', group: 'dark', fonts: MONO, statsStyle: columns(30), textColor: '#f6e9ff',
    route: line('#3df2ff', 3, ['#ff3dac', 14, 0.5, 18]), gradient: gradient('#1a0b2e', '#0b1a33', 160), pointStyle: points('square') }),
  template({ id: 'wegiel', name: 'Węgiel', desc: 'kółko, kontrast', group: 'dark', textColor: '#f2f2f2',
    route: line('#ffffff', 5, ['#ffffff', 14, 0.12]), gradient: flat('#1b1b1b'), pointStyle: points('circle'), map: { labels: false } }),
  template({ id: 'zachod', name: 'Zachód słońca', desc: 'kwadrat, gradient', group: 'dark', textColor: '#fff4e3',
    route: line('#fff4e3', 5, ['#ffd9a0', 16, 0.35, 12]), gradient: gradient('#2b1a4a', '#e8875f'), pointStyle: points('square') }),
  template({ id: 'pastel', name: 'Pastel', desc: 'kółko, jasny', group: 'dark', textColor: '#4b3f6b',
    route: line('#6a5bc4', 6, ['#9b8de0', 16, 0.2]), gradient: gradient('#fde8ea', '#e6eefb'), pointStyle: points('circle') }),
]
