import { ASPECTS } from '../utils/aspects'
import { computeSlots, layoutDef, ribbonSlot } from '../utils/layouts'
import { dayBreaks, projectTrack, rangeStats, trackCumKm, trackDays } from './derived'
import { useAppStore } from './useAppStore'
import type { CarouselKind, Slide } from '../types'

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

export function useRangeStats() {
  const track = useAppStore((s) => s.track)
  const range = useAppStore((s) => s.range)
  return rangeStats(track, range, useDayBreaks())
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
  return useAppStore((s) => s.collage.bgKind !== 'transparent' || hasVisiblePhotos(s.slides, s.carouselKind))
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
