// Hand-drawn place icons. Each sits on a 48×48 grid: `fill` is the closed shapes, `line` the open strokes.

export type IconId =
  | 'coffee'
  | 'beer'
  | 'pizza'
  | 'iceCream'
  | 'croissant'
  | 'burger'
  | 'bottle'
  | 'tent'
  | 'peak'
  | 'sun'
  | 'rain'
  | 'camera'
  | 'finish'
  | 'heart'
  | 'star'
  | 'arrow'
  | 'home'
  | 'tree'
  | 'storm'
  | 'drops'
  | 'wine'
  | 'sparkle'
  | 'weather'

export interface IconDef {
  id: IconId
  // Polish label shown in the picker.
  label: string
  fill: string
  line: string
}

export const ICON_GRID = 48
export const ICON_STROKE = 3
export const ICON_SHADOW_OFFSET = 2.5

export const ICONS: readonly IconDef[] = [
  { id: 'coffee', label: 'Kawa', fill: 'M10 18h22v12a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z', line: 'M32 21h3a5 5 0 0 1 0 10h-3M17 6c-2 3 2 5 0 8M24 5c-2 3 2 5 0 8' },
  { id: 'beer', label: 'Piwo', fill: 'M10 17h20v21a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3zM8 17c-1-4 3-7 6-5 1-3 6-4 8-1 2-2 7-1 7 3 3 0 3 3 1 4z', line: 'M30 21h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4M16 24v12M21 24v12M26 24v12' },
  { id: 'pizza', label: 'Pizza', fill: 'M7 41L40 30 18 7z', line: 'M18 7c3-2 6-1 8 1l13 13c2 2 3 5 1 9M18.4 30a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0M22.6 21a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0M13 34a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' },
  { id: 'iceCream', label: 'Lody', fill: 'M16 23l8 20 8-20zM13 23a11 11 0 0 1 22 0z', line: 'M19 30l8-4M21 36l6-3' },
  { id: 'croissant', label: 'Rogal', fill: 'M5 31c3-15 35-15 38 0-5-4-9-3-11 1-3-4-9-4-12 0-2-4-8-5-15-1z', line: 'M17 22l3 9M24 19v12M31 22l-3 9' },
  { id: 'burger', label: 'Burger', fill: 'M8 23a16 12 0 0 1 32 0zM7 27h34v5H7zM8 35h32v2a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z', line: 'M17 15h1M24 13h1M31 16h1' },
  { id: 'bottle', label: 'Bidon', fill: 'M17 15h14v23a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5zM21 8h6v7h-6z', line: 'M17 23h14M17 29h14' },
  { id: 'tent', label: 'Nocleg', fill: 'M5 41L24 10l19 31z', line: 'M24 10v31M24 41l-6-11M24 41l6-11M2 41h44' },
  { id: 'peak', label: 'Szczyt', fill: 'M3 41l15-24 8 10 6-8 13 22z', line: 'M13 25l5-8 5 6M27 27l5-8' },
  { id: 'sun', label: 'Słońce', fill: 'M15 24a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', line: 'M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4' },
  { id: 'rain', label: 'Deszcz', fill: 'M12 31a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1-1 13z', line: 'M16 36l-2 6M24 36l-2 6M32 36l-2 6' },
  { id: 'camera', label: 'Widok', fill: 'M6 16h9l3-5h12l3 5h9v23H6z', line: 'M17 27a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M36 20h2' },
  { id: 'finish', label: 'Meta', fill: 'M12 7h25l-5 8 5 8H12z', line: 'M12 44V5M18 7v16M24 7v16M30 7v16' },
  { id: 'heart', label: 'Serce', fill: 'M24 41C8 29 5 18 11 12c5-5 11-2 13 3 2-5 8-8 13-3 6 6 3 17-13 29z', line: '' },
  { id: 'star', label: 'Gwiazda', fill: 'M24 5l5.6 12 13 1.5-9.6 9 2.6 13L24 34l-11.6 6.5 2.6-13-9.6-9 13-1.5z', line: '' },
  { id: 'arrow', label: 'Strzałka', fill: '', line: 'M6 36c8-16 20-21 32-18M31 12l8 6-8 6' },
  { id: 'home', label: 'Dom', fill: 'M8 24L24 9l16 15v17H8z', line: 'M20 41V30h8v11' },
  { id: 'tree', label: 'Drzewo', fill: 'M24 5c-7 0-11 6-9 11-5 1-7 7-3 11 3 3 8 3 12 1 4 2 9 2 12-1 4-4 2-10-3-11 2-5-2-11-9-11z', line: 'M24 28v15M24 34l-5-4M24 32l5-4' },
  { id: 'storm', label: 'Burza', fill: 'M27 4L12 27h10l-4 17 17-25H25z', line: '' },
  { id: 'drops', label: 'Krople', fill: 'M14 8c-3 6-5 9-5 12a5 5 0 0 0 10 0c0-3-2-6-5-12zM33 14c-3 6-5 9-5 12a5 5 0 0 0 10 0c0-3-2-6-5-12zM20 28c-3 5-4 8-4 10a4 4 0 0 0 8 0c0-2-1-5-4-10z', line: '' },
  { id: 'wine', label: 'Wino', fill: 'M14 6h20c0 10-4 16-10 16S14 16 14 6z', line: 'M24 22v16M16 42h16M15 13h18' },
  { id: 'sparkle', label: 'Błysk', fill: 'M24 3l4 15 15 6-15 4-4 17-4-17-15-4 15-6z', line: 'M40 6l-3 6M8 40l4-5' },
  { id: 'weather', label: 'Pogoda', fill: 'M15 24a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', line: 'M24 3l3 8h-6zM24 45l3-8h-6zM3 24l8 3v-6zM45 24l-8 3v-6zM9 9l7 4-3 3zM39 39l-7-4 3-3zM39 9l-4 7-3-3zM9 39l4-7 3 3zM20 22h1M27 22h1M20 27c2 3 6 3 8 0' },
]

export const iconById = (id: IconId): IconDef | undefined => ICONS.find((i) => i.id === id)

// The look belongs to the style: a sticker (style colour, dark outline, hard shadow), a white-ish line, or ink on paper.
export type IconFinish = 'sticker' | 'line' | 'ink'

export const ICON_INK = '#241a26'

export function iconPaint(finish: IconFinish, color: string, paper: string): { fill: string | undefined; stroke: string; shadow: boolean } {
  if (finish === 'line') return { fill: undefined, stroke: color, shadow: false }
  return { fill: finish === 'ink' ? paper : color, stroke: ICON_INK, shadow: finish === 'sticker' }
}
