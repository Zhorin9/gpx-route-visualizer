import { detectClimbs, type Climb } from '../features/elevation-profile/model/climbs'
import { windowMean } from '../core/data/smoothing'
import { INK, PAPER, contrastRatio, toneOf } from './color'
import { cumulativeDistanceKm, kmBetween, nearestIndex } from './gpx'
import { layoutDef } from './layouts'
import { memoOne } from './memo'
import type { CollageStyle, GpxPoint, Photo, PhotoGeo, ProjectMode, RouteStyle, Slide, SlideBackground, SlideKind, SlideLook, SlideOverlays, StatsStyle, SummaryFigure, TitleStyle } from '../types'
import { clamp } from './math'
import i18n, { type TKey } from '../i18n'

// Instagram's limit per post.
export const MAX_EXPORT_SLIDES = 20
export const LIMIT_MESSAGE: TKey = 'series.limit'

export const DEFAULT_OVERLAYS: SlideOverlays = { miniMap: 'off', marker: false }
export const DEFAULT_BACKGROUND: SlideBackground = { source: 'style', color: '#2b3a30', fromSlide: null, blur: 0, dim: 45 }
export const DEFAULT_FIGURES: SummaryFigure[] = ['distance', 'moving', 'gain']

// In the order they are offered and drawn.
export const FIGURE_LABELS: Record<SummaryFigure, TKey> = {
  distance: 'series.distance',
  moving: 'series.moving',
  duration: 'series.duration',
  gain: 'series.gain',
  avgSpeed: 'series.avgSpeed',
  highest: 'series.highest',
  climb: 'series.climb',
  days: 'series.days',
}

export const SUMMARY_FIGURES = Object.keys(FIGURE_LABELS) as SummaryFigure[]

export const slideKind = (slide: Slide): SlideKind => slide.kind ?? 'photos'

export function slideLabel(slide: Slide, index: number, mode: ProjectMode | null): string {
  if (index === 0) return i18n.t(mode === 'collage' ? 'series.collage' : 'series.map')
  const kind = slideKind(slide)
  if (kind === 'profile') return i18n.t('series.profile')
  if (kind === 'summary') return i18n.t('series.summary')
  return i18n.t(layoutDef(slide.layoutKey).cells.length > 1 ? 'series.collage' : 'series.photo')
}

export const isExported = (slide: Slide) => !slide.skipped

export function slideNumbers(slides: Slide[]): (number | null)[] {
  let n = 0
  return slides.map((slide) => (isExported(slide) ? ++n : null))
}

export const exportedSlides = (slides: Slide[]): number[] => slides.flatMap((slide, i) => (isExported(slide) ? [i] : []))

export const roomForSlide = (slides: Slide[]) => exportedSlides(slides).length < MAX_EXPORT_SLIDES

export function kindBlocker(kind: SlideKind, route: SeriesRoute | null): string | null {
  if (kind === 'profile' && !route) return i18n.t('series.addGpx')
  if (kind === 'profile' && !route?.hasElevation) return i18n.t('series.addGpxElevation')
  if (kind === 'summary' && !route) return i18n.t('series.addGpx')
  return null
}

export function newSlide(kind: SlideKind | 'collage'): Slide {
  if (kind === 'collage') return { layoutKey: 'g2v', slots: {}, kind: 'photos', overlays: DEFAULT_OVERLAYS }
  if (kind === 'photos') return { layoutKey: 'g1', slots: {}, kind, overlays: DEFAULT_OVERLAYS }
  if (kind === 'profile') return { layoutKey: 'g1', slots: {}, kind, climb: true, background: DEFAULT_BACKGROUND }
  return { layoutKey: 'g1', slots: {}, kind, figures: DEFAULT_FIGURES, question: '', background: DEFAULT_BACKGROUND }
}

// A summary that ends the series stays last.
export function insertIndex(slides: Slide[], selected: number, kind: SlideKind): number {
  const at = selected + 1
  const last = slides[slides.length - 1]
  if (at >= slides.length && slides.length > 1 && kind !== 'summary' && slideKind(last) === 'summary') return slides.length - 1
  return Math.min(at, slides.length)
}

// `order` lists, for each new position, the slide that was there before (-1 for a new one).
export function followSlides<T extends { x: number }>(texts: T[], order: number[], w: number): T[] {
  const count = Math.max(...order) + 1
  return texts.flatMap((t) => {
    const from = clamp(Math.floor(t.x / w), 0, count - 1)
    const to = order.indexOf(from)
    return to < 0 ? [] : [{ ...t, x: t.x + (to - from) * w }]
  })
}

export function moveOrder(count: number, from: number, to: number): number[] | null {
  const target = clamp(to, 1, count - 1)
  if (from < 1 || from === target) return null
  const order = Array.from({ length: count }, (_, i) => i).filter((i) => i !== from)
  order.splice(target, 0, from)
  return order
}

export interface SeriesRoute {
  points: GpxPoint[]
  cumKm: Float64Array
  totalKm: number
  // Smoothed, so single noisy points don't show in the profile.
  ele: Float32Array
  hasElevation: boolean
  // The steepest climb worth naming; null on a flat route or without heights.
  hardestClimb: Climb | null
}

const SMOOTH_KM = 0.15

export const seriesRoute = memoOne((points: GpxPoint[] | null, breaks: readonly number[]): SeriesRoute | null => {
  if (!points || points.length < 2) return null
  const cumKm = cumulativeDistanceKm(points, breaks)
  const raw = Float32Array.from(points, (p) => (Number.isFinite(p.ele) ? p.ele : NaN))
  const hasElevation = points.some((p) => Number.isFinite(p.ele) && p.ele !== 0)
  const ele = windowMean(raw, cumKm, SMOOTH_KM)
  const climbs = hasElevation ? detectClimbs(ele, cumKm, 0, points.length - 1) : []
  // A climb is as hard as it is steep, but a 200 m ramp isn't the day's hardest.
  const named = climbs.filter((c) => c.lengthKm >= 0.5)
  const hardestClimb = (named.length ? named : climbs).reduce<Climb | null>((best, c) => (!best || c.avgGrade > best.avgGrade ? c : best), null)
  return { points, cumKm, totalKm: cumKm[cumKm.length - 1], ele, hasElevation, hardestClimb }
})

// A photo further than this from the route wasn't taken on it.
const MAX_GPS_KM = 2
// A clock this far outside the recording doesn't belong to it.
const TIME_SLACK_MS = 15 * 60_000

export type PlaceSource = 'gps' | 'time' | 'manual'

export interface SlidePlace {
  index: number
  source: PlaceSource
}

// The place first, then the time.
export function matchGeo(points: GpxPoint[] | null, geo: PhotoGeo | undefined): SlidePlace | null {
  if (!points?.length || !geo) return null
  if (geo.lat !== undefined && geo.lon !== undefined) {
    const at = { lat: geo.lat, lon: geo.lon }
    const index = nearestIndex(points, (p) => kmBetween(p, at), MAX_GPS_KM)
    if (index !== null) return { index, source: 'gps' }
  }
  if (geo.time !== undefined) {
    const time = geo.time
    const index = nearestIndex(points, (p) => (p.time == null ? Infinity : Math.abs(p.time - time)), TIME_SLACK_MS)
    if (index !== null) return { index, source: 'time' }
  }
  return null
}

const matches = new WeakMap<PhotoGeo, { points: GpxPoint[]; place: SlidePlace | null }>()

// Matching walks the whole track, so results are kept until the route changes.
function photoPlace(points: GpxPoint[], geo: PhotoGeo | undefined): SlidePlace | null {
  if (!geo) return null
  const cached = matches.get(geo)
  if (cached?.points === points) return cached.place
  const place = matchGeo(points, geo)
  matches.set(geo, { points, place })
  return place
}

export function slidePlace(slide: Slide, photos: Map<number, Photo>, points: GpxPoint[] | null): SlidePlace | null {
  if (!points?.length || slideKind(slide) !== 'photos') return null
  if (slide.place != null) return { index: Math.min(slide.place, points.length - 1), source: 'manual' }
  for (const assignment of Object.values(slide.slots)) {
    const place = photoPlace(points, photos.get(assignment.photoId)?.geo)
    if (place) return place
  }
  return null
}

export function mapDots(slides: Slide[], photos: Map<number, Photo>, points: GpxPoint[] | null): { index: number; n: number }[] {
  const numbers = slideNumbers(slides)
  return slides.flatMap((slide, i) => {
    const n = numbers[i]
    const place = i > 0 && n != null ? slidePlace(slide, photos, points) : null
    return place && n != null ? [{ index: place.index, n }] : []
  })
}

// White stats made for photos don't read on paper, so the ink falls back.
export function projectLook(s: { collage: CollageStyle; titleStyle: TitleStyle; routeStyle: RouteStyle; statsStyle: Pick<StatsStyle, 'color'> }): SlideLook {
  const { collage } = s
  const paper = collage.bgKind === 'color' ? collage.bgColor : collage.bgKind === 'gradient' ? collage.gradient.from : '#ede6d6'
  const ink = contrastRatio(s.statsStyle.color, paper) >= 4.5 ? s.statsStyle.color : toneOf(paper) === 'dark' ? PAPER : INK
  return { paper, ink, accent: s.routeStyle.color, font: s.titleStyle.fontFamily }
}

export function seriesWarnings(slides: Slide[], photos: Map<number, Photo>, points: GpxPoint[] | null): string[] {
  const numbers = slideNumbers(slides)
  return slides.flatMap((slide, i) => {
    const n = numbers[i]
    if (i === 0 || n == null) return []
    const kind = slideKind(slide)
    if (kind !== 'photos') return points ? [] : [i18n.t(kind === 'profile' ? 'series.profileNoRoute' : 'series.summaryNoRoute', { n })]
    const out: string[] = []
    if (Object.keys(slide.slots).length < layoutDef(slide.layoutKey).cells.length) out.push(i18n.t('series.emptySlot', { n }))
    const overlays = slide.overlays ?? DEFAULT_OVERLAYS
    if ((overlays.marker || overlays.miniMap !== 'off') && !slidePlace(slide, photos, points)) out.push(i18n.t('series.overlayNoPlace', { n }))
    return out
  })
}

export interface ApplyChoice {
  miniMap: boolean
  marker: boolean
  crop: boolean
}

// Style exceptions keep their own settings.
export const applyTargets = (slides: Slide[], from: number): number[] =>
  slides.flatMap((slide, i) => (i > 0 && i !== from && slideKind(slide) === 'photos' && !slide.ownLook ? [i] : []))

export function applyToPhotoSlides(slides: Slide[], from: number, choice: ApplyChoice): Slide[] {
  const source = slides[from]
  const overlays = source.overlays ?? DEFAULT_OVERLAYS
  const crop = source.slots[0]?.crop
  const targets = new Set(applyTargets(slides, from))
  return slides.map((slide, i) => {
    if (!targets.has(i)) return slide
    const own = slide.overlays ?? DEFAULT_OVERLAYS
    return {
      ...slide,
      overlays: { miniMap: choice.miniMap ? overlays.miniMap : own.miniMap, marker: choice.marker ? overlays.marker : own.marker },
      slots: choice.crop ? Object.fromEntries(Object.entries(slide.slots).map(([k, a]) => [k, { ...a, crop }])) : slide.slots,
    }
  })
}
