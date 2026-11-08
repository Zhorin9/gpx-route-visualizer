import { FORMATS, bottomInset } from '../core/formats/registry'
import { profileBand } from '../features/elevation-profile/types'
import { mapIsSeeThrough } from '../features/map/types'
import { manualFlags } from '../utils/reflow'
import { slideBox } from '../utils/wrappers'
import { computeSlots, hasVisiblePhotos, isPanorama, layoutDef, photoCoversFrame, ribbonSlot } from '../utils/layouts'
import { dayBreaks, projectTrack, trackFit, rangeStats, selectRouteDays, selectRouteParts, selectTrack, trackCumKm, trackDays } from './derived'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from './useAppStore'
import type { AspectKey, CarouselKind, Slide } from '../types'
import { clamp } from '../utils/math'
import { mixHex, toneOf } from '../utils/color'
import { stickerColor } from '../utils/sticker'
import type { AppState } from './types'

// The projection's padding lets the route come this close to what sits under it.
const ROUTE_PAD_OVERLAP = 50

// Box the route is fitted to: the first slide (a panorama's whole ribbon, so it can cross slide
// borders), or in a landscape format the area left of the side column and above the profile.
function routeBox(s: Parameters<typeof profileBand>[0] & { aspectKey: AspectKey; slides: Slide[]; carouselKind: CarouselKind }): [number, number] {
  const { w, h, columns } = FORMATS[s.aspectKey]
  if (!columns) return [isPanorama(s.slides, s.carouselKind) ? w * s.slides.length : w, h]
  return [columns.routeW, h - bottomInset(s.aspectKey) + ROUTE_PAD_OVERLAP - profileBand(s)]
}

export function useRouteBox() {
  return useAppStore(useShallow(routeBox))
}

export function useProjectedTrack() {
  const track = useAppStore(selectTrack)
  const [boxW, boxH] = useAppStore(useShallow(routeBox))
  // On the sketch map the route trembles like its pen: 0.32% of the shorter side at roughness 1.
  const tremble = useAppStore((s) => {
    const { w, h } = FORMATS[s.aspectKey]
    const roughness = s.collage.bgKind === 'map' && s.map.kind === 'sketch' ? s.map.sketch.roughness : (s.routeStyle.pen ?? 0)
    return Math.min(w, h) * 0.0032 * roughness
  })
  return projectTrack(track, boxW, boxH, tremble)
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

// The colour the elements sit on, when one colour can stand for it; null over photos or nothing.
function backgroundColor(s: AppState): string | null {
  if (hasVisiblePhotos(s.slides, s.carouselKind)) return null
  const { bgKind, gradient, bgColor } = s.collage
  if (bgKind === 'gradient') return mixHex(gradient.from, gradient.to)
  if (bgKind === 'color') return bgColor
  if (bgKind === 'map') return s.map.palette?.land ?? null
  return null
}

export const useBackgroundColor = () => useAppStore(backgroundColor)

// A sticker style's colour for the element on this slide; null outside the sticker styles.
export function useStickerColor(slide: number): string | null {
  return useAppStore((s) => (s.sticker ? stickerColor(s.sticker, slide, backgroundColor(s)) : null))
}

// Anything opaque under the route: photos, a gradient or a map. Otherwise the export is transparent.
export function useHasBackground() {
  return useAppStore((s) => (s.collage.bgKind !== 'transparent' && !(s.collage.bgKind === 'map' && mapIsSeeThrough(s.map))) || hasVisiblePhotos(s.slides, s.carouselKind))
}

// Text takes the background's contrast, so dark text means dark ink overall (a sketch without paper):
// the checkerboard under a see-through frame then turns light.
export function useInkIsDark() {
  return useAppStore((s) => toneOf(s.statsStyle.color) === 'dark')
}

// Nothing in the source format.
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

export function useSlideAt(x: number): number {
  return useAppStore((s) => clamp(Math.floor(x / FORMATS[s.aspectKey].w), 0, s.slides.length - 1))
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
