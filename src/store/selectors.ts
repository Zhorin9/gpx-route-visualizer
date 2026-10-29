import { FORMATS, bottomInset } from '../core/formats/registry'
import { profileBand } from '../features/elevation-profile/types'
import { manualFlags } from '../utils/reflow'
import { slideBox } from '../utils/wrappers'
import { computeSlots, hasVisiblePhotos, isPanorama, layoutDef, photoCoversFrame, ribbonSlot } from '../utils/layouts'
import { dayBreaks, projectTrack, trackFit, rangeStats, selectRouteDays, selectRouteParts, selectTrack, trackCumKm, trackDays } from './derived'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from './useAppStore'
import type { AspectKey, CarouselKind, Slide } from '../types'

// The projection's padding lets the route come this close to what sits under it.
const ROUTE_PAD_OVERLAP = 50

// Box the route is fitted to: the first slide (a panorama's whole ribbon, so it can cross slide
// borders), or in a landscape format the area left of the side column and above the profile.
function routeBox(s: Parameters<typeof profileBand>[0] & { aspectKey: AspectKey; slides: Slide[]; carouselKind: CarouselKind }): [number, number] {
  const { w, h, columns } = FORMATS[s.aspectKey]
  if (!columns) return [isPanorama(s.slides, s.carouselKind) ? w * s.slides.length : w, h]
  return [columns.routeW, h - bottomInset(s.aspectKey) + ROUTE_PAD_OVERLAP - profileBand(s)]
}

// Box the route is fitted to, in frame pixels from the top-left corner.
export function useRouteBox() {
  return useAppStore(useShallow(routeBox))
}

export function useProjectedTrack() {
  const track = useAppStore(selectTrack)
  const [boxW, boxH] = useAppStore(useShallow(routeBox))
  return projectTrack(track, boxW, boxH)
}

// Where the projection placed the route, in Web Mercator: the map and the camera follow it.
export function useTrackFit() {
  const track = useAppStore(selectTrack)
  const [boxW, boxH] = useAppStore(useShallow(routeBox))
  return trackFit(track, boxW, boxH)
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
  return rangeStats(track, range, useDayBreaks(), useAppStore(selectRouteParts))
}

export { hasVisiblePhotos, isPanorama }

// A photo fills the whole frame, so the background colour or gradient is hidden.
export function usePhotoBackground() {
  return useAppStore((s) => {
    const { w, h } = FORMATS[s.aspectKey]
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

// The slide a node on the ribbon belongs to, by its x.
export function useSlideAt(x: number): number {
  return useAppStore((s) => Math.min(s.slides.length - 1, Math.max(0, Math.floor(x / FORMATS[s.aspectKey].w))))
}

// The box a slide's content is drawn in under the project's wrapper; null when it fills the slide.
export function useSlideBox(index: number) {
  return useAppStore(useShallow((s) => slideBox(s, index, FORMATS[s.aspectKey].w, FORMATS[s.aspectKey].h)))
}

// Slot rectangles of a slide in frame pixels, for the layout actually applied (not a hover preview).
export function useSlideSlots(slideIndex: number) {
  const aspectKey = useAppStore((s) => s.aspectKey)
  const layoutKey = useAppStore((s) => s.slides[slideIndex]?.layoutKey ?? 'g1')
  const gap = useAppStore((s) => s.collage.gap)
  const margin = useAppStore((s) => s.collage.margin)
  const panorama = usePanorama()
  const slideCount = useAppStore((s) => s.slides.length)
  const { w, h } = FORMATS[aspectKey]
  if (panorama) return [ribbonSlot(w, h, slideCount)]
  return computeSlots(layoutDef(layoutKey), w, h, gap, margin)
}
