import { ASPECTS } from '../utils/aspects'
import { formatDuration, formatElevation, formatKm } from '../utils/format'
import { computeSlots, layoutDef, ribbonSlot } from '../utils/layouts'
import { dayBreaks, projectTrack, rangeStats, routeLines, trackCumKm, trackDays } from './derived'
import { useAppStore } from './useAppStore'
import type { CarouselKind, Slide, StatChip } from '../types'

export function useProjectedTrack() {
  const track = useAppStore((s) => s.track)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  return projectTrack(track, aspectKey, slideCount)
}

export function useDayBreaks() {
  return dayBreaks(useAppStore((s) => s.routeDays))
}

export function useTrackCumKm() {
  return trackCumKm(
    useAppStore((s) => s.track),
    useDayBreaks(),
  )
}

export function useTrackDays() {
  return trackDays(useAppStore((s) => s.track))
}

export function useRouteLines() {
  const projected = useProjectedTrack()
  const cum = useTrackCumKm()
  const range = useAppStore((s) => s.range)
  const progress = useAppStore((s) => s.progress)
  return routeLines(projected, cum, range, progress)
}

export function useRangeStats() {
  const track = useAppStore((s) => s.track)
  const range = useAppStore((s) => s.range)
  return rangeStats(track, range, useDayBreaks())
}

const chip = (key: StatChip['key'], label: string, text: string): StatChip => ({ key, text, label, value: text })

export function useStatsChips(): StatChip[] {
  const stats = useRangeStats()
  const content = useAppStore((s) => s.statsContent)
  if (!stats) return []
  const { visible, overrides } = content
  const chips: (StatChip | null)[] = [
    visible.day && content.dayLabel
      ? { key: 'day', text: content.dayLabel, label: 'Dzień', value: content.dayLabel.replace(/^\s*dzie[ńn]\s*/i, '') || content.dayLabel }
      : null,
    visible.distance ? chip('distance', 'Dystans', overrides.distance || formatKm(stats.distanceKm, content.distancePrecision)) : null,
    visible.elevation
      ? chip('elevation', 'Wznios', overrides.elevation || formatElevation(stats.elevationGainM, content.elevationRoundTo))
      : null,
    visible.time && (overrides.time || stats.durationMs > 0)
      ? chip('time', 'Czas', overrides.time || formatDuration(stats.durationMs))
      : null,
  ]
  return chips.filter((c): c is StatChip => c !== null)
}

export function isPanorama(slides: Slide[], kind: CarouselKind) {
  return kind === 'panorama' && slides.length > 1
}

// Only the photos that are actually on the canvas: a panorama hides the other slides' slots.
export function hasVisiblePhotos(slides: Slide[], kind: CarouselKind) {
  if (isPanorama(slides, kind)) return Boolean(slides[0].slots[0])
  return slides.some((slide) => Object.keys(slide.slots).length > 0)
}

// Anything opaque under the route: photos or a gradient. Otherwise the export is transparent.
export function useHasBackground() {
  return useAppStore((s) => s.collage.bgKind === 'gradient' || hasVisiblePhotos(s.slides, s.carouselKind))
}

export function usePanorama() {
  return useAppStore((s) => isPanorama(s.slides, s.carouselKind))
}

export function useHasPhotos() {
  return useAppStore((s) => hasVisiblePhotos(s.slides, s.carouselKind))
}

export function useActiveSlide() {
  return useAppStore((s) => Math.min(s.activeSlide, s.slides.length - 1))
}

export function useHasRoute() {
  return useAppStore((s) => s.track !== null)
}

// Slot rectangles of a slide in frame pixels, for the layout actually applied (not a hover preview).
export function useSlideSlots(slideIndex: number) {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const layoutKey = useAppStore((s) => s.slides[slideIndex]?.layoutKey ?? 'g1')
  const gap = useAppStore((s) => s.collage.gap)
  const margin = useAppStore((s) => s.collage.margin)
  const panorama = usePanorama()
  const slideCount = useAppStore((s) => s.slides.length)
  const { w, h } = ASPECTS[aspectKey]
  if (panorama) return [ribbonSlot(w, h, slideCount)]
  return computeSlots(layoutDef(layoutKey), w, h, gap, margin)
}
