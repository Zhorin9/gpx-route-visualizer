import { DEFAULT_COLLAGE, DEFAULT_ROUTE_STYLE, DEFAULT_STATS_STYLE } from '../store/defaults'
import type { GradientStyle, StyleTemplate } from '../types'

const { shape: _shape, schematicSimplify: _simplify, ...DEFAULT_ROUTE_LOOK } = DEFAULT_ROUTE_STYLE

const PAPER = '#f3f2f2'
const INK = '#2d2b2b'
const FILM_GRAIN = 6

// Figures in equal columns with a small caption above and thin rules between, as in the design.
const columns = (fontSize: number) => ({ arrangement: 'columns' as const, stretch: true, labels: true, dividers: true, fontSize })

const gradient = (from: string, to: string, angle = 172): GradientStyle => ({ from, to, angle, grain: FILM_GRAIN, smooth: true })
const frame = (color: string, thickness: number, style: 'equal' | 'polaroid' = 'equal') => ({ enabled: true, color, thickness, style })
const NO_FRAME = { ...DEFAULT_COLLAGE.frame, enabled: false }

// Each template pairs three fonts (title, figures, notes) with a route look, a frame and a background.
export const BUILT_IN_TEMPLATES: StyleTemplate[] = [
  {
    id: 'kartograf',
    name: 'Kartograf',
    desc: 'Cormorant + Lora · atlas',
    fonts: { title: 'Cormorant Garamond', data: 'Cormorant Garamond', note: 'Lora' },
    titleItalic: true,
    statsStyle: columns(DEFAULT_STATS_STYLE.fontSize + 6),
    textColor: INK,
    route: { ...DEFAULT_ROUTE_LOOK, color: '#3d2a1f', coreWidth: 3, remainingVisible: false },
    frame: frame(PAPER, 20),
    gradient: gradient('#ffe3bf', '#9b9797'),
    layoutKey: 'g1',
    preview: { bg: 'linear-gradient(172deg, #ffe3bf, #facb8d 45%, #9b9797)', text: INK, line: '#3d2a1f', title: 'Sardynia', titleFont: "'Cormorant Garamond', serif", dash: false, width: 2, frame: PAPER, italic: true },
  },
  {
    id: 'retro',
    name: 'Pocztówka',
    desc: 'DM Serif + DM Mono · kropkowana trasa',
    fonts: { title: 'DM Serif Display', data: 'DM Mono', note: 'DM Mono' },
    statsStyle: columns(30),
    textColor: PAPER,
    route: { ...DEFAULT_ROUTE_LOOK, color: '#fbf5dc', coreWidth: 5, dotted: true, remainingVisible: false },
    frame: frame(PAPER, 28, 'polaroid'),
    gradient: gradient('#facb8d', '#7d7979'),
    layoutKey: 'c1',
    preview: { bg: 'linear-gradient(172deg, #facb8d, #c28d41 55%, #7d7979)', text: PAPER, line: '#fbf5dc', title: 'Sardynia', titleFont: "'DM Serif Display', serif", dash: false, dotted: true, width: 3, frame: PAPER },
  },
  {
    id: 'plakat',
    name: 'Grań',
    desc: 'Barlow Condensed · czerń i złoto',
    fonts: { title: 'Barlow Condensed', data: 'Barlow Condensed', note: 'Barlow Condensed' },
    titleUppercase: true,
    statsStyle: columns(54),
    textColor: PAPER,
    titleColor: '#facb8d',
    route: { ...DEFAULT_ROUTE_LOOK, color: '#facb8d', coreWidth: 6, remainingVisible: false },
    frame: NO_FRAME,
    gradient: gradient(INK, INK),
    layoutKey: 'g1',
    preview: { bg: INK, text: PAPER, line: '#facb8d', title: 'SARDYNIA', titleFont: "'Barlow Condensed', sans-serif", titleColor: '#facb8d', dash: false, width: 3.5 },
  },
  {
    id: 'minimal',
    name: 'Linia',
    desc: 'Jost Light · cienka linia',
    fonts: { title: 'Jost', data: 'Jost', note: 'Jost' },
    titleUppercase: true,
    statsStyle: columns(28),
    textColor: PAPER,
    route: { ...DEFAULT_ROUTE_LOOK, color: PAPER, coreWidth: 1.5, remainingVisible: false },
    frame: NO_FRAME,
    gradient: gradient('#9b9797', '#444141', 180),
    layoutKey: 'g1',
    preview: { bg: 'linear-gradient(180deg, #9b9797, #444141)', text: PAPER, line: PAPER, title: 'SARDYNIA', titleFont: "'Jost', sans-serif", dash: false, width: 1.2 },
  },
  {
    id: 'neon',
    name: 'Noc',
    desc: 'Syne + Space Mono · poświata',
    fonts: { title: 'Syne', data: 'Space Mono', note: 'Space Mono' },
    titleUppercase: true,
    statsStyle: columns(30),
    textColor: PAPER,
    titleColor: '#ffe3bf',
    route: { ...DEFAULT_ROUTE_LOOK, color: '#ffe3bf', coreWidth: 3.5, glowEnabled: true, glowWidth: 14, glowBlur: 25, remainingVisible: false },
    frame: NO_FRAME,
    gradient: gradient(INK, '#444141', 180),
    layoutKey: 'g1',
    preview: { bg: 'linear-gradient(180deg, #2d2b2b, #444141)', text: PAPER, line: '#ffe3bf', title: 'SARDYNIA', titleFont: "'Syne', sans-serif", titleColor: '#ffe3bf', dash: false, width: 2.5, glow: true },
  },
  {
    id: 'dziennik',
    name: 'Dziennik',
    desc: 'Caslon + Caveat · odręczne opisy',
    fonts: { title: 'Libre Caslon Display', data: 'Libre Caslon Display', note: 'Caveat' },
    statsStyle: columns(36),
    textColor: PAPER,
    route: { ...DEFAULT_ROUTE_LOOK, color: PAPER, coreWidth: 3.5, dashed: true, remainingVisible: false },
    frame: frame(PAPER, 24, 'polaroid'),
    gradient: gradient('#e8cfa0', '#7d7979'),
    layoutKey: 'c1',
    preview: { bg: 'linear-gradient(172deg, #d7d3d3, #e1ad66 50%, #7d7979)', text: PAPER, line: PAPER, title: 'Sardynia', titleFont: "'Libre Caslon Display', serif", dash: true, width: 2.5, frame: PAPER },
  },
]
