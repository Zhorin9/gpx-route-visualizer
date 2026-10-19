import { DEFAULT_COLLAGE, DEFAULT_ROUTE_STYLE, DEFAULT_STATS_STYLE } from '../store/defaults'
import type { StyleTemplate } from '../types'

const { shape: _shape, schematicSimplify: _simplify, ...DEFAULT_ROUTE_LOOK } = DEFAULT_ROUTE_STYLE

export const BUILT_IN_TEMPLATES: StyleTemplate[] = [
  {
    id: 'default',
    name: 'Domyślny',
    desc: 'Biała trasa, odręczne napisy',
    fontFamily: DEFAULT_STATS_STYLE.fontFamily,
    statsStyle: { fontSize: DEFAULT_STATS_STYLE.fontSize, spacing: DEFAULT_STATS_STYLE.spacing },
    textColor: DEFAULT_STATS_STYLE.color,
    route: DEFAULT_ROUTE_LOOK,
    frame: DEFAULT_COLLAGE.frame,
    bgColor: DEFAULT_COLLAGE.bgColor,
    layoutKey: 'g1',
    preview: { bg: 'linear-gradient(172deg, #a06f24, #7d5411 40%, #605d5d)', text: '#f3f2f2', line: '#ffe3bf', title: 'SARDYNIA', titleFont: 'Cinzel, serif', dash: false, width: 3 },
  },
  {
    id: 'retro',
    name: 'Retro',
    desc: 'Szeryfy, ciepły papier, kreskowana trasa',
    fontFamily: 'Playfair Display',
    statsStyle: { fontSize: 34, spacing: 44 },
    textColor: '#2d2b2b',
    route: { ...DEFAULT_ROUTE_LOOK, color: '#6b2d1c', coreWidth: 4, dashed: true, glowEnabled: false, remainingVisible: false },
    frame: { enabled: true, color: '#f6efe0', thickness: 26, style: 'polaroid' },
    bgColor: '#e4cf9f',
    layoutKey: 'c1',
    preview: { bg: 'linear-gradient(172deg, #ffe3bf, #e1ad66 50%, #9b9797)', text: '#2d2b2b', line: '#6b2d1c', title: 'SARDYNIA', titleFont: "'Playfair Display', serif", dash: true, width: 2.5, frame: '#f3f2f2' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Cienka linia, szeroki rozstaw',
    fontFamily: 'Montserrat',
    statsStyle: { fontSize: 28, spacing: 72 },
    textColor: '#f3f2f2',
    route: { ...DEFAULT_ROUTE_LOOK, color: '#f3f2f2', coreWidth: 2, dashed: false, glowEnabled: false, remainingVisible: false },
    frame: { ...DEFAULT_COLLAGE.frame, enabled: false },
    bgColor: '#444141',
    layoutKey: 'g1',
    preview: { bg: 'linear-gradient(180deg, #9b9797, #444141)', text: '#f3f2f2', line: '#f3f2f2', title: 'SARDYNIA', titleFont: 'Montserrat, sans-serif', dash: false, width: 1.5 },
  },
  {
    id: 'plakat',
    name: 'Plakat',
    desc: 'Gruba trasa, wielki nagłówek',
    fontFamily: 'Bebas Neue',
    statsStyle: { fontSize: 62, spacing: 36 },
    textColor: '#201f1d',
    route: { ...DEFAULT_ROUTE_LOOK, color: '#201f1d', coreWidth: 9, dashed: false, glowEnabled: false, remainingVisible: false },
    frame: { enabled: true, color: '#f3f2f2', thickness: 22, style: 'equal' },
    bgColor: '#facb8d',
    layoutKey: 'g1',
    preview: { bg: '#facb8d', text: '#2d2b2b', line: '#2d2b2b', title: 'SARDYNIA', titleFont: "'Bebas Neue', sans-serif", dash: false, width: 5, frame: '#f3f2f2' },
  },
]
