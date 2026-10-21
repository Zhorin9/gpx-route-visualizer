import { colorScale, palette, paletteBins } from '../../core/data/palettes'
import { dataSeries, dataSource, type DataSourceId } from '../../core/data/sources'
import { percentile } from '../../core/data/smoothing'
import { selectTrack } from '../../store/derived'
import type { RouteColoring } from '../../core/route/coloring'
import { useTrackCumKm } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { memoOne } from '../../utils/memo'
import type { GpxTrack, RouteRange } from '../../types'
import type { DataColorSettings } from './types'

export interface ActiveDataColor {
  sourceId: DataSourceId
  series: Float32Array
  domain: [number, number]
  // Palette bins, low to high as drawn.
  bins: string[]
  settings: DataColorSettings
}

const autoDomain = memoOne((series: Float32Array, range: RouteRange): [number, number] => {
  const lo = percentile(series, 5, range.start, range.end)
  const hi = percentile(series, 95, range.start, range.end)
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1]
  return hi > lo ? [lo, hi] : [lo - 1, lo + 1]
})

const activeDataColor = memoOne(
  (track: GpxTrack | null, cumKm: Float64Array | null, range: RouteRange, settings: DataColorSettings): ActiveDataColor | null => {
    if (!track || !cumKm || settings.source === 'none') return null
    const source = dataSource(settings.source)
    if (source.unavailable(track)) return null
    const series = dataSeries(track, cumKm, settings.source)
    const domain: [number, number] = settings.rangeMode === 'manual' ? [settings.min, settings.max] : autoDomain(series, range)
    return { sourceId: settings.source, series, domain, bins: paletteBins(palette(settings.palette), settings.inverted), settings }
  },
)

// The colour-by-data state for the current track, or null when the route keeps its colour.
export function useActiveDataColor(): ActiveDataColor | null {
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  const settings = useAppStore((s) => s.dataColor)
  const cumKm = useTrackCumKm()
  return activeDataColor(track, cumKm, range, settings)
}

const toColoring = memoOne((active: ActiveDataColor | null, routeColor: string): RouteColoring | null => {
  if (!active) return null
  const { series, domain, settings } = active
  const scale = colorScale(palette(settings.palette), domain, settings.inverted)
  const last = series.length - 1
  return {
    kind: 'perPoint',
    at: (pos) => scale(series[Math.max(0, Math.min(last, Math.round(pos)))]),
    glow: settings.glow === 'uniform' ? { kind: 'uniform', color: routeColor } : { kind: 'follow' },
  }
})

// Plugged into the route as its colouring provider.
export function useDataColoring(): RouteColoring | null {
  const active = useActiveDataColor()
  const routeColor = useAppStore((s) => s.routeStyle.color)
  return toColoring(active, routeColor)
}
