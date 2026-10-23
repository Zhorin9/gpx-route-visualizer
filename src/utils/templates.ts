import { DEFAULT_COLLAGE, DEFAULT_ROUTE_STYLE, DEFAULT_STATS_STYLE } from '../store/defaults'
import type { BackgroundPattern, PhotoMarker, RouteStyle, StyleTemplate } from '../types'

const { shape: _shape, schematicSimplify: _simplify, ...DEFAULT_ROUTE_LOOK } = DEFAULT_ROUTE_STYLE

const PRINT = '#fbf8f1'

// Figures in equal columns with a small caption above and thin rules between, as in the design.
const columns = (fontSize: number) => ({ arrangement: 'columns' as const, stretch: true, labels: true, dividers: true, fontSize })

const flat = (color: string, pattern: BackgroundPattern = 'none', grain = 0) => ({ from: color, to: color, angle: 180, grain, smooth: true, pattern })

// The line, and an outline under it: colour, width, opacity and blur.
function line(color: string, coreWidth: number, outline?: [string, number, number, number?], extra: Partial<RouteStyle> = {}): Partial<RouteStyle> {
  const under = outline && { glowEnabled: true, glowColor: outline[0], glowWidth: outline[1], glowOpacity: outline[2], glowBlur: outline[3] ?? 0 }
  return { ...DEFAULT_ROUTE_LOOK, color, coreWidth, remainingVisible: false, ...under, ...extra }
}

const NO_FRAME = { ...DEFAULT_COLLAGE.frame, enabled: false }
const POLAROID = { enabled: true, color: PRINT, thickness: 24, style: 'polaroid' as const }
const points = (marker: PhotoMarker) => ({ marker, size: 'M' as const })

// Each preset pairs a background, a line, the type and the way a photo shows at a place on the route.
export const BUILT_IN_TEMPLATES: StyleTemplate[] = [
  {
    id: 'papier',
    name: 'Papier',
    desc: 'polaroid',
    fonts: { title: 'Cinzel', data: 'Lora', note: 'Lora' },
    titleUppercase: true,
    statsStyle: columns(DEFAULT_STATS_STYLE.fontSize - 6),
    textColor: '#3a2a1c',
    route: line('#8a3b24', 5, ['#8a3b24', 10, 0.18]),
    frame: POLAROID,
    gradient: flat('#ede6d6', 'none', 6),
    layoutKey: 'c1',
    pointStyle: points('polaroid'),
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    desc: 'kwadrat, ramka',
    fonts: { title: 'Cormorant Garamond', data: 'DM Mono', note: 'DM Mono' },
    titleUppercase: true,
    statsStyle: columns(30),
    textColor: '#e4f0ff',
    route: line('#e4f0ff', 4, ['#cfe6ff', 12, 0.12], { dashed: true }),
    frame: NO_FRAME,
    gradient: flat('#123a63', 'grid'),
    layoutKey: 'g1',
    pointStyle: points('square'),
    map: { labels: false },
  },
  {
    id: 'topo',
    name: 'Topo',
    desc: 'kółko, obwódka',
    fonts: { title: 'Cinzel', data: 'Lora', note: 'Lora' },
    titleUppercase: true,
    statsStyle: columns(32),
    textColor: '#24351f',
    route: line('#2f5d3a', 6, ['#2f5d3a', 12, 0.15]),
    frame: NO_FRAME,
    gradient: flat('#e9e4d3', 'contours'),
    layoutKey: 'g1',
    pointStyle: points('circle'),
    map: { hillshade: true },
  },
  {
    id: 'granat',
    name: 'Granat',
    desc: 'kwadrat, złoto',
    fonts: { title: 'Cinzel', data: 'Lora', note: 'Lora' },
    titleUppercase: true,
    statsStyle: columns(32),
    textColor: '#f1e6cf',
    route: line('#f4c47a', 5, ['#e8a64a', 14, 0.35, 12]),
    frame: NO_FRAME,
    gradient: flat('#0f1a2b'),
    layoutKey: 'g1',
    pointStyle: points('square'),
  },
  {
    id: 'neon',
    name: 'Neon',
    desc: 'poświata',
    fonts: { title: 'Cormorant Garamond', data: 'JetBrains Mono', note: 'JetBrains Mono' },
    titleUppercase: true,
    statsStyle: columns(30),
    textColor: '#e6fff8',
    route: line('#d8fff3', 1.5, ['#5af0c8', 6, 0.44, 15]),
    frame: NO_FRAME,
    gradient: flat('#0b0b0f'),
    layoutKey: 'g1',
    pointStyle: points('circle'),
  },
  {
    id: 'plakat',
    name: 'Plakat',
    desc: 'polaroid, kontrast',
    fonts: { title: 'Cinzel', data: 'Lora', note: 'Lora' },
    titleUppercase: true,
    statsStyle: columns(44),
    textColor: '#1c1b1a',
    route: line('#1c1b1a', 9, ['#1c1b1a', 16, 0.12]),
    frame: POLAROID,
    gradient: flat('#e8a64a'),
    layoutKey: 'g1',
    pointStyle: points('polaroid'),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'tylko etykieta',
    fonts: { title: 'Cormorant Garamond', data: 'Lora', note: 'Lora' },
    titleUppercase: false,
    statsStyle: columns(28),
    textColor: '#201f1d',
    route: line('#201f1d', 4),
    frame: NO_FRAME,
    gradient: flat('#f3f2f2'),
    layoutKey: 'g1',
    pointStyle: points('label'),
    map: { labels: false },
  },
  {
    id: 'film',
    name: 'Film',
    desc: 'klatka filmowa, podwójna linia',
    fonts: { title: 'Cinzel', data: 'Lora', note: 'Lora' },
    titleUppercase: true,
    statsStyle: columns(32),
    textColor: '#f3efe6',
    route: line('#17251f', 6, ['#e8a64a', 16, 1]),
    frame: NO_FRAME,
    gradient: flat('#17251f'),
    layoutKey: 'g1',
    pointStyle: points('film'),
  },
]
