import { ASPECTS } from '../utils/aspects'
import { manualFlags } from '../utils/reflow'
import { computeSlots, hasVisiblePhotos, isPanorama, layoutDef, photoCoversFrame, ribbonSlot } from '../utils/layouts'
import { dayBreaks, projectTrack, rangeStats, selectRouteDays, selectTrack, trackCumKm, trackDays } from './derived'
import { useAppStore } from './useAppStore'

export function useProjectedTrack() {
  const track = useAppStore(selectTrack)
  const aspectKey = useAppStore((s) => s.aspectKey)
  const slideCount = useAppStore((s) => s.slides.length)
  return projectTrack(track, aspectKey, slideCount)
}

export function useDayBreaks() {
  return dayBreaks(useAppStore(selectRouteDays))
}

export function useTrackCumKm() {
  return trackCumKm(
    useAppStore(selectTrack),
    useDayBreaks(),
  )
}

export function useTrackDays() {
  return trackDays(useAppStore(selectTrack))
}

export function useRangeStats() {
  const track = useAppStore(selectTrack)
  const range = useAppStore((s) => s.range)
  return rangeStats(track, range, useDayBreaks())
}

export { hasVisiblePhotos, isPanorama }

// A photo fills the whole frame, so the background colour or gradient is hidden.
export function usePhotoBackground() {
  return useAppStore((s) => {
    const { w, h } = ASPECTS[s.aspectKey]
    return photoCoversFrame(s.slides, s.carouselKind, w, h, s.collage.gap, s.collage.margin)
  })
}

// Anything opaque under the route: photos or a gradient. Otherwise the export is transparent.
export function useHasBackground() {
  return useAppStore((s) => s.collage.bgKind !== 'transparent' || hasVisiblePhotos(s.slides, s.carouselKind))
}

// What was placed by hand in the current format (nothing in the source format).
export function useManualFlags() {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const texts = useAppStore((s) => s.texts)
  const placements = useAppStore((s) => s.placements)
  const routeTransform = useAppStore((s) => s.routeTransform)
  const sourceLayout = useAppStore((s) => s.sourceLayout)
  return manualFlags({ aspectKey, texts, placements, routeTransform, sourceLayout })
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
  return useAppStore((s) => selectTrack(s) !== null)
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
