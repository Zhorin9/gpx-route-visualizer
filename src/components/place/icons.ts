// Hand-drawn icons. Each sits on a 48×48 grid: `fill` is the closed shapes, `line` the open strokes.

import type { TKey } from '../../i18n'

export type IconCategory = 'arrows' | 'accents' | 'terrain' | 'weather' | 'food' | 'bike' | 'places' | 'route'

export const ICON_CATEGORIES: readonly IconCategory[] = ['arrows', 'accents', 'terrain', 'weather', 'food', 'bike', 'places', 'route']

export type IconId =
  | 'arrow'
  | 'arrowStraight'
  | 'arrowFat'
  | 'arrowLoop'
  | 'arrowZigzag'
  | 'arrowDouble'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowUturn'
  | 'arrowBounce'
  | 'arrowDotted'
  | 'arrowSpiral'
  | 'star'
  | 'heart'
  | 'sparkle'
  | 'burst'
  | 'circleMark'
  | 'underline'
  | 'xMark'
  | 'exclaim'
  | 'question'
  | 'motion'
  | 'fire'
  | 'smile'
  | 'tired'
  | 'speech'
  | 'thought'
  | 'peak'
  | 'mountains'
  | 'summitFlag'
  | 'hills'
  | 'river'
  | 'lake'
  | 'waves'
  | 'waterfall'
  | 'tree'
  | 'pine'
  | 'rock'
  | 'bridge'
  | 'serpentine'
  | 'gravel'
  | 'sun'
  | 'weather'
  | 'cloud'
  | 'rain'
  | 'storm'
  | 'drops'
  | 'wind'
  | 'snow'
  | 'rainbow'
  | 'moon'
  | 'heat'
  | 'sunrise'
  | 'coffee'
  | 'beer'
  | 'wine'
  | 'pizza'
  | 'iceCream'
  | 'croissant'
  | 'burger'
  | 'sandwich'
  | 'banana'
  | 'energyBar'
  | 'can'
  | 'bottle'
  | 'bike'
  | 'wheel'
  | 'helmet'
  | 'pump'
  | 'wrench'
  | 'flat'
  | 'camera'
  | 'home'
  | 'tent'
  | 'hut'
  | 'church'
  | 'castle'
  | 'lighthouse'
  | 'shop'
  | 'train'
  | 'ferry'
  | 'pin'
  | 'startFlag'
  | 'finish'
  | 'crown'
  | 'medal'
  | 'stopwatch'

export interface IconDef {
  id: IconId
  label: TKey
  category: IconCategory
  fill: string
  line: string
}

export const ICON_GRID = 48
export const ICON_STROKE = 3
export const ICON_SHADOW_OFFSET = 2.5

export const ICONS: readonly IconDef[] = [
  { id: 'arrow', label: 'icons.arrow', category: 'arrows', fill: '', line: 'M6 36c8-16 20-21 32-18M31 12l8 6-8 6' },
  { id: 'arrowStraight', label: 'icons.arrowStraight', category: 'arrows', fill: '', line: 'M6 24h32M30 15l9 9-9 9' },
  { id: 'arrowFat', label: 'icons.arrowFat', category: 'arrows', fill: 'M4 18h22V9l18 15-18 15v-9H4z', line: '' },
  { id: 'arrowLoop', label: 'icons.arrowLoop', category: 'arrows', fill: '', line: 'M6 40C10 24 30 16 30 26s-14 10-11 0S32 10 42 12M35 6l7 6-6 7' },
  { id: 'arrowZigzag', label: 'icons.arrowZigzag', category: 'arrows', fill: '', line: 'M5 38l9-12 8 8 9-14 9 4M34 14l7 6-8 3' },
  { id: 'arrowDouble', label: 'icons.arrowDouble', category: 'arrows', fill: '', line: 'M8 24h32M15 16l-8 8 8 8M33 16l8 8-8 8' },
  { id: 'arrowUp', label: 'icons.arrowUp', category: 'arrows', fill: '', line: 'M24 42V8M13 19L24 8l11 11' },
  { id: 'arrowDown', label: 'icons.arrowDown', category: 'arrows', fill: '', line: 'M24 6v34M13 29l11 11 11-11' },
  { id: 'arrowUturn', label: 'icons.arrowUturn', category: 'arrows', fill: '', line: 'M34 40V20a10 10 0 0 0-20 0v18M7 31l7 8 7-8' },
  { id: 'arrowBounce', label: 'icons.arrowBounce', category: 'arrows', fill: '', line: 'M4 36c5-18 12-18 16 0 3-14 9-14 12-2M27 30l6 5 4-7' },
  { id: 'arrowDotted', label: 'icons.arrowDotted', category: 'arrows', fill: '', line: 'M6 38l3-5M12 29l4-4M20 23l5-3M29 19l4-1M32 12l8 6-8 6' },
  { id: 'arrowSpiral', label: 'icons.arrowSpiral', category: 'arrows', fill: '', line: 'M22 26a3 3 0 1 1 4-3 7 7 0 1 1-11 6 11 11 0 1 1 20 4l6 6M42 31l-1 9-9-1' },
  { id: 'star', label: 'icons.star', category: 'accents', fill: 'M24 5l5.6 12 13 1.5-9.6 9 2.6 13L24 34l-11.6 6.5 2.6-13-9.6-9 13-1.5z', line: '' },
  { id: 'heart', label: 'icons.heart', category: 'accents', fill: 'M24 41C8 29 5 18 11 12c5-5 11-2 13 3 2-5 8-8 13-3 6 6 3 17-13 29z', line: '' },
  { id: 'sparkle', label: 'icons.sparkle', category: 'accents', fill: 'M24 3l4 15 15 6-15 4-4 17-4-17-15-4 15-6z', line: 'M40 6l-3 6M8 40l4-5' },
  { id: 'burst', label: 'icons.burst', category: 'accents', fill: 'M24.0 3.0L27.7 12.6L36.3 7.0L33.7 16.9L44.0 17.5L36.0 24.0L44.0 30.5L33.7 31.1L36.3 41.0L27.7 35.4L24.0 45.0L20.3 35.4L11.7 41.0L14.3 31.1L4.0 30.5L12.0 24.0L4.0 17.5L14.3 16.9L11.7 7.0L20.3 12.6Z', line: '' },
  { id: 'circleMark', label: 'icons.circleMark', category: 'accents', fill: '', line: 'M26 9c12 1 19 7 18 15s-10 15-21 15S4 32 4 24 14 8 28 10' },
  { id: 'underline', label: 'icons.underline', category: 'accents', fill: '', line: 'M4 30c10-3 28-4 40-1M8 37c10-2 22-2 32 0' },
  { id: 'xMark', label: 'icons.xMark', category: 'accents', fill: '', line: 'M12 12l24 24M36 12L12 36' },
  { id: 'exclaim', label: 'icons.exclaim', category: 'accents', fill: 'M19 6h10l-2.5 26h-5zM20.5 39a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0', line: '' },
  { id: 'question', label: 'icons.question', category: 'accents', fill: 'M21 40a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', line: 'M15 16a9 9 0 1 1 13 8c-3 2-4 4-4 8' },
  { id: 'motion', label: 'icons.motion', category: 'accents', fill: '', line: 'M8 14h22M4 24h32M10 34h18' },
  { id: 'fire', label: 'icons.fire', category: 'accents', fill: 'M24 4c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 4-9 6-12 1 4 3 6 5 6-2-6 0-12 1-18z', line: 'M24 30c-3 3-3 8 0 10' },
  { id: 'smile', label: 'icons.smile', category: 'accents', fill: 'M6 24a18 18 0 1 0 36 0a18 18 0 1 0 -36 0', line: 'M17 20v2M31 20v2M15 29c5 6 13 6 18 0' },
  { id: 'tired', label: 'icons.tired', category: 'accents', fill: 'M6 26a16 16 0 1 0 32 0a16 16 0 1 0 -32 0M40 4c-3 5-4 7-4 9a4 4 0 0 0 8 0c0-2-1-4-4-9z', line: 'M14 23l4 2M30 23l-4 2M16 34h12' },
  { id: 'speech', label: 'icons.speech', category: 'accents', fill: 'M6 8h36a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H22l-10 9v-9H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', line: '' },
  { id: 'thought', label: 'icons.thought', category: 'accents', fill: 'M12 30a8 8 0 0 1-2-15 10 10 0 0 1 17-6 9 9 0 0 1 15 7 7 7 0 0 1-3 14zM9 37a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M4 43a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', line: '' },
  { id: 'peak', label: 'icons.peak', category: 'terrain', fill: 'M3 41l15-24 8 10 6-8 13 22z', line: 'M13 25l5-8 5 6M27 27l5-8' },
  { id: 'mountains', label: 'icons.mountains', category: 'terrain', fill: 'M2 41l14-24 8 12 6-8 16 20z', line: 'M11 25l5-8 5 7M27 26l3-5 4 5' },
  { id: 'summitFlag', label: 'icons.summitFlag', category: 'terrain', fill: 'M4 42l20-30 20 30z', line: 'M24 12V2M24 3h10l-3 3.5 3 3.5H24M18 22l6-10 6 10' },
  { id: 'hills', label: 'icons.hills', category: 'terrain', fill: 'M2 40c5-14 15-14 20 0zM16 40c7-20 23-20 30 0z', line: '' },
  { id: 'river', label: 'icons.river', category: 'terrain', fill: 'M11 4c9 8-8 14 4 22s-6 14 6 18h11c-12-4 6-10-6-18s5-14-4-22z', line: 'M17 14h3M20 31h3' },
  { id: 'lake', label: 'icons.lake', category: 'terrain', fill: 'M6 28c0-8 12-12 22-10s16 6 14 12-14 10-24 8S6 34 6 28z', line: 'M15 26h6M26 31h7' },
  { id: 'waves', label: 'icons.waves', category: 'terrain', fill: '', line: 'M4 18c4-4 8-4 12 0s8 4 12 0 8-4 12 0M4 28c4-4 8-4 12 0s8 4 12 0 8-4 12 0M4 38c4-4 8-4 12 0s8 4 12 0 8-4 12 0' },
  { id: 'waterfall', label: 'icons.waterfall', category: 'terrain', fill: 'M4 6h40v8H4zM14 14h20v24H14z', line: 'M20 16v20M24 16v22M28 16v20M8 43c4-3 8-3 12 0s8 3 12 0 8-3 12 0' },
  { id: 'tree', label: 'icons.tree', category: 'terrain', fill: 'M24 5c-7 0-11 6-9 11-5 1-7 7-3 11 3 3 8 3 12 1 4 2 9 2 12-1 4-4 2-10-3-11 2-5-2-11-9-11z', line: 'M24 28v15M24 34l-5-4M24 32l5-4' },
  { id: 'pine', label: 'icons.pine', category: 'terrain', fill: 'M24 3l10 14h-5l9 12h-6l8 11H8l8-11h-6l9-12h-5z', line: 'M24 40v6' },
  { id: 'rock', label: 'icons.rock', category: 'terrain', fill: 'M5 42l4-16 9-6 4-12 11 4 6 14 4 16z', line: 'M15 29l6 4M27 17l2 8' },
  { id: 'bridge', label: 'icons.bridge', category: 'terrain', fill: '', line: 'M2 26h44M2 34h44M7 26c4-12 30-12 34 0M14 26v8M24 26v8M34 26v8' },
  { id: 'serpentine', label: 'icons.serpentine', category: 'terrain', fill: '', line: 'M32 4C18 4 18 12 30 12s12 8 0 8-12 8 0 8 12 8 0 8-12 8-2 8' },
  { id: 'gravel', label: 'icons.gravel', category: 'terrain', fill: 'M5 36a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M20 38a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M31 34a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M14 26a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M28 24a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', line: 'M2 44h44' },
  { id: 'sun', label: 'icons.sun', category: 'weather', fill: 'M15 24a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', line: 'M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4' },
  { id: 'weather', label: 'icons.weather', category: 'weather', fill: 'M15 24a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', line: 'M24 3l3 8h-6zM24 45l3-8h-6zM3 24l8 3v-6zM45 24l-8 3v-6zM9 9l7 4-3 3zM39 39l-7-4 3-3zM39 9l-4 7-3-3zM9 39l4-7 3 3zM20 22h1M27 22h1M20 27c2 3 6 3 8 0' },
  { id: 'cloud', label: 'icons.cloud', category: 'weather', fill: 'M12 36a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1-1 13z', line: '' },
  { id: 'rain', label: 'icons.rain', category: 'weather', fill: 'M12 31a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1-1 13z', line: 'M16 36l-2 6M24 36l-2 6M32 36l-2 6' },
  { id: 'storm', label: 'icons.storm', category: 'weather', fill: 'M27 4L12 27h10l-4 17 17-25H25z', line: '' },
  { id: 'drops', label: 'icons.drops', category: 'weather', fill: 'M14 8c-3 6-5 9-5 12a5 5 0 0 0 10 0c0-3-2-6-5-12zM33 14c-3 6-5 9-5 12a5 5 0 0 0 10 0c0-3-2-6-5-12zM20 28c-3 5-4 8-4 10a4 4 0 0 0 8 0c0-2-1-5-4-10z', line: '' },
  { id: 'wind', label: 'icons.wind', category: 'weather', fill: '', line: 'M4 18h26a5 5 0 1 0-5-5M4 26h34a5 5 0 1 1-5 5M4 34h18' },
  { id: 'snow', label: 'icons.snow', category: 'weather', fill: '', line: 'M24 5v38M8 14.5l32 19M8 33.5l32-19M19 8l5 5 5-5M19 40l5-5 5 5' },
  { id: 'rainbow', label: 'icons.rainbow', category: 'weather', fill: '', line: 'M5 38a19 19 0 0 1 38 0M11 38a13 13 0 0 1 26 0M17 38a7 7 0 0 1 14 0' },
  { id: 'moon', label: 'icons.moon', category: 'weather', fill: 'M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z', line: 'M10 10l1 3M8 12l3-1' },
  { id: 'heat', label: 'icons.heat', category: 'weather', fill: 'M20 8a4 4 0 0 1 8 0v21a8 8 0 1 1-8 0z', line: 'M24 15v19M32 12h4M32 18h4' },
  { id: 'sunrise', label: 'icons.sunrise', category: 'weather', fill: 'M12 36a12 12 0 0 1 24 0z', line: 'M4 36h40M24 18v-8M10 24l-5-3M38 24l5-3M4 42h40' },
  { id: 'coffee', label: 'icons.coffee', category: 'food', fill: 'M10 18h22v12a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z', line: 'M32 21h3a5 5 0 0 1 0 10h-3M17 6c-2 3 2 5 0 8M24 5c-2 3 2 5 0 8' },
  { id: 'beer', label: 'icons.beer', category: 'food', fill: 'M10 17h20v21a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3zM8 17c-1-4 3-7 6-5 1-3 6-4 8-1 2-2 7-1 7 3 3 0 3 3 1 4z', line: 'M30 21h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4M16 24v12M21 24v12M26 24v12' },
  { id: 'wine', label: 'icons.wine', category: 'food', fill: 'M14 6h20c0 10-4 16-10 16S14 16 14 6z', line: 'M24 22v16M16 42h16M15 13h18' },
  { id: 'pizza', label: 'icons.pizza', category: 'food', fill: 'M7 41L40 30 18 7z', line: 'M18 7c3-2 6-1 8 1l13 13c2 2 3 5 1 9M18.4 30a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0M22.6 21a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0M13 34a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' },
  { id: 'iceCream', label: 'icons.iceCream', category: 'food', fill: 'M16 23l8 20 8-20zM13 23a11 11 0 0 1 22 0z', line: 'M19 30l8-4M21 36l6-3' },
  { id: 'croissant', label: 'icons.croissant', category: 'food', fill: 'M5 31c3-15 35-15 38 0-5-4-9-3-11 1-3-4-9-4-12 0-2-4-8-5-15-1z', line: 'M17 22l3 9M24 19v12M31 22l-3 9' },
  { id: 'burger', label: 'icons.burger', category: 'food', fill: 'M8 23a16 12 0 0 1 32 0zM7 27h34v5H7zM8 35h32v2a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z', line: 'M17 15h1M24 13h1M31 16h1' },
  { id: 'sandwich', label: 'icons.sandwich', category: 'food', fill: 'M4 22l20-12 20 12zM4 26h40v4H4zM6 32h36v6H6z', line: '' },
  { id: 'banana', label: 'icons.banana', category: 'food', fill: 'M9 13c1 15 12 25 30 23 2 0 3 2 1 3-20 6-36-6-35-25z', line: 'M9 13l-2-5' },
  { id: 'energyBar', label: 'icons.energyBar', category: 'food', fill: 'M14 8h20l-2 4v24l2 4H14l2-4V12z', line: 'M20 18h8M20 24h8' },
  { id: 'can', label: 'icons.can', category: 'food', fill: 'M14 10h20v30H14z', line: 'M14 14h20M14 36h20M24 6v4' },
  { id: 'bottle', label: 'icons.bottle', category: 'food', fill: 'M17 15h14v23a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5zM21 8h6v7h-6z', line: 'M17 23h14M17 29h14' },
  { id: 'bike', label: 'icons.bike', category: 'bike', fill: '', line: 'M4 32a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M28 32a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M12 32l8-13h12l4 13M20 19l-3-6h-5M32 19l-2-6h6M24 32l8-13M20 19l4 13' },
  { id: 'wheel', label: 'icons.wheel', category: 'bike', fill: '', line: 'M6 24a18 18 0 1 0 36 0a18 18 0 1 0 -36 0M21 24a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M24 6v15M24 27v15M6 24h15M27 24h15M11 11l11 11M26 26l11 11M37 11L26 22M22 26L11 37' },
  { id: 'helmet', label: 'icons.helmet', category: 'bike', fill: 'M5 30c0-12 9-20 19-20s19 8 19 20z', line: 'M5 30h38M14 29v-9M24 29V12M34 29v-9M10 30l-2 6' },
  { id: 'pump', label: 'icons.pump', category: 'bike', fill: 'M18 14h12v28H18z', line: 'M24 14V6M17 6h14M30 22h8v6' },
  { id: 'wrench', label: 'icons.wrench', category: 'bike', fill: 'M30 6a10 10 0 0 0-9 14L6 35a4 4 0 0 0 6 6l15-15a10 10 0 0 0 14-9l-6 6-6-2-2-6z', line: '' },
  { id: 'flat', label: 'icons.flat', category: 'bike', fill: '', line: 'M8 26a16 16 0 1 0 32 0a16 16 0 1 0 -32 0M15 26a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M36 12l5-5M38 16l7-2M34 9l1-6' },
  { id: 'camera', label: 'icons.camera', category: 'bike', fill: 'M6 16h9l3-5h12l3 5h9v23H6z', line: 'M17 27a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M36 20h2' },
  { id: 'home', label: 'icons.home', category: 'places', fill: 'M8 24L24 9l16 15v17H8z', line: 'M20 41V30h8v11' },
  { id: 'tent', label: 'icons.tent', category: 'places', fill: 'M5 41L24 10l19 31z', line: 'M24 10v31M24 41l-6-11M24 41l6-11M2 41h44' },
  { id: 'hut', label: 'icons.hut', category: 'places', fill: 'M4 24L24 8l20 16v18H4z', line: 'M16 42V30h8v12M30 30h6v6h-6z' },
  { id: 'church', label: 'icons.church', category: 'places', fill: 'M14 22l10-8 10 8v20H14z', line: 'M24 14V4M20 8h8M20 42v-8a4 4 0 0 1 8 0v8' },
  { id: 'castle', label: 'icons.castle', category: 'places', fill: 'M6 42V14h6v6h6v-6h12v6h6v-6h6v28z', line: 'M20 42v-8a4 4 0 0 1 8 0v8' },
  { id: 'lighthouse', label: 'icons.lighthouse', category: 'places', fill: 'M18 42l3-28h6l3 28zM18 6h12v8H18z', line: 'M20 23h8M19 33h10M30 9l8-3M30 11l8 3' },
  { id: 'shop', label: 'icons.shop', category: 'places', fill: 'M6 20h36v22H6zM4 10h40l-2 10H6z', line: 'M20 42V30h8v12M14 10v10M24 10v10M34 10v10' },
  { id: 'train', label: 'icons.train', category: 'places', fill: 'M12 6h24a4 4 0 0 1 4 4v24H8V10a4 4 0 0 1 4-4z', line: 'M8 18h32M16 34l-4 8M32 34l4 8M14 27a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M30 27a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' },
  { id: 'ferry', label: 'icons.ferry', category: 'places', fill: 'M4 30h40l-6 10H10zM14 30V20h20v10z', line: 'M24 20V10M4 45c4-3 8-3 12 0s8 3 12 0 8-3 12 0' },
  { id: 'pin', label: 'icons.pin', category: 'route', fill: 'M24 44S10 30 10 20a14 14 0 0 1 28 0c0 10-14 24-14 24z', line: 'M19 20a5 5 0 1 0 10 0a5 5 0 1 0 -10 0' },
  { id: 'startFlag', label: 'icons.startFlag', category: 'route', fill: 'M12 7h25v16H12z', line: 'M12 44V5M20 7v16M28 7v16M12 15h25' },
  { id: 'finish', label: 'icons.finish', category: 'route', fill: 'M12 7h25l-5 8 5 8H12z', line: 'M12 44V5M18 7v16M24 7v16M30 7v16' },
  { id: 'crown', label: 'icons.crown', category: 'route', fill: 'M6 36l4-22 9 10 5-14 5 14 9-10 4 22z', line: 'M7 41h34' },
  { id: 'medal', label: 'icons.medal', category: 'route', fill: 'M15 4h7l4 14h-7zM26 4h7l-4 14h-7zM13 30a11 11 0 1 0 22 0a11 11 0 1 0 -22 0', line: 'M24 24l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z' },
  { id: 'stopwatch', label: 'icons.stopwatch', category: 'route', fill: 'M8 27a16 16 0 1 0 32 0a16 16 0 1 0 -32 0', line: 'M24 27V17M20 5h8M24 5v6M38 12l3-3' },
]

export const iconById = (id: IconId): IconDef | undefined => ICONS.find((i) => i.id === id)

// The look belongs to the style: a sticker (style colour, dark outline, hard shadow), a white-ish line, or ink on paper.
export type IconFinish = 'sticker' | 'line' | 'ink'

const ICON_INK = '#241a26'

export function iconPaint(finish: IconFinish, color: string, paper: string): { fill: string | undefined; stroke: string; shadow: boolean } {
  if (finish === 'line') return { fill: undefined, stroke: color, shadow: false }
  return { fill: finish === 'ink' ? paper : color, stroke: ICON_INK, shadow: finish === 'sticker' }
}
