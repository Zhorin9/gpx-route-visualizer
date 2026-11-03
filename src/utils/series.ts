import { detectClimbs, type Climb } from '../features/elevation-profile/model/climbs'
import { windowMean } from '../core/data/smoothing'
import { INK, PAPER, contrastRatio, toneOf } from './color'
import { cumulativeDistanceKm } from './gpx'
import { layoutDef } from './layouts'
import { memoOne } from './memo'
import type { CollageStyle, GpxPoint, Photo, PhotoGeo, ProjectMode, RouteStyle, Slide, SlideBackground, SlideKind, SlideLook, SlideOverlays, StatsStyle, SummaryFigure, TitleStyle } from '../types'

// A series is the carousel of the editor: its first slide is the frame itself, the others are
// photos, an elevation profile or a summary. Instagram takes at most 20 slides in one post.
export const MAX_EXPORT_SLIDES = 20
export const LIMIT_MESSAGE = 'Seria ma 20 slajdów do eksportu. Usuń lub pomiń slajd, aby dodać nowy.'

export const DEFAULT_OVERLAYS: SlideOverlays = { miniMap: 'off', marker: false }
export const DEFAULT_BACKGROUND: SlideBackground = { source: 'style', color: '#2b3a30', fromSlide: null, blur: 0, dim: 45 }
export const DEFAULT_FIGURES: SummaryFigure[] = ['distance', 'moving', 'gain']

// In the order they are offered and drawn.
export const FIGURE_LABELS: Record<SummaryFigure, string> = {
  distance: 'Dystans',
  moving: 'Czas w ruchu',
  duration: 'Czas całkowity',
  gain: 'Przewyższenie',
  avgSpeed: 'Średnia prędkość',
  highest: 'Najwyższy punkt',
  climb: 'Najtrudniejszy podjazd',
  days: 'Dni',
}

export const SUMMARY_FIGURES = Object.keys(FIGURE_LABELS) as SummaryFigure[]

export const slideKind = (slide: Slide): SlideKind => slide.kind ?? 'photos'

// The name under the thumbnail: the first slide is the editor's frame, a map or a collage.
export function slideLabel(slide: Slide, index: number, mode: ProjectMode | null): string {
  if (index === 0) return mode === 'collage' ? 'Kolaż' : 'Mapa'
  const kind = slideKind(slide)
  if (kind === 'profile') return 'Profil'
  if (kind === 'summary') return 'Podsumowanie'
  return layoutDef(slide.layoutKey).cells.length > 1 ? 'Kolaż' : 'Zdjęcie'
}

export const isExported = (slide: Slide) => !slide.skipped

// Numbers on the strip, in the file names and on the map: skipped slides have none.
export function slideNumbers(slides: Slide[]): (number | null)[] {
  let n = 0
  return slides.map((slide) => (isExported(slide) ? ++n : null))
}

export const exportedSlides = (slides: Slide[]): number[] => slides.flatMap((slide, i) => (isExported(slide) ? [i] : []))

export const roomForSlide = (slides: Slide[]) => exportedSlides(slides).length < MAX_EXPORT_SLIDES

// Why a slide of this kind can't be added now; null when it can.
export function kindBlocker(kind: SlideKind, route: SeriesRoute | null): string | null {
  if (kind === 'profile' && !route) return 'Wgraj GPX'
  if (kind === 'profile' && !route?.hasElevation) return 'Wgraj GPX z wysokościami'
  if (kind === 'summary' && !route) return 'Wgraj GPX'
  return null
}

export function newSlide(kind: SlideKind | 'collage'): Slide {
  if (kind === 'collage') return { layoutKey: 'g2v', slots: {}, kind: 'photos', overlays: DEFAULT_OVERLAYS }
  if (kind === 'photos') return { layoutKey: 'g1', slots: {}, kind, overlays: DEFAULT_OVERLAYS }
  if (kind === 'profile') return { layoutKey: 'g1', slots: {}, kind, climb: true, background: DEFAULT_BACKGROUND }
  return { layoutKey: 'g1', slots: {}, kind, figures: DEFAULT_FIGURES, question: '', background: DEFAULT_BACKGROUND }
}

// After the selected slide; past the last one, before a summary that ends the series.
export function insertIndex(slides: Slide[], selected: number, kind: SlideKind): number {
  const at = selected + 1
  const last = slides[slides.length - 1]
  if (at >= slides.length && slides.length > 1 && kind !== 'summary' && slideKind(last) === 'summary') return slides.length - 1
  return Math.min(at, slides.length)
}

// Texts sit on the ribbon, so they follow their slide to its new place and go with a removed one.
// `order` lists, for each new position, the slide that was there before (-1 for a new one).
export function followSlides<T extends { x: number }>(texts: T[], order: number[], w: number): T[] {
  const count = Math.max(...order) + 1
  return texts.flatMap((t) => {
    const from = Math.max(0, Math.min(count - 1, Math.floor(t.x / w)))
    const to = order.indexOf(from)
    return to < 0 ? [] : [{ ...t, x: t.x + (to - from) * w }]
  })
}

// Moves a slide; the first one stays first and nothing can get ahead of it.
export function moveOrder(count: number, from: number, to: number): number[] | null {
  const target = Math.max(1, Math.min(count - 1, to))
  if (from < 1 || from === target) return null
  const order = Array.from({ length: count }, (_, i) => i).filter((i) => i !== from)
  order.splice(target, 0, from)
  return order
}

// ---------- The route as the series draws it ----------

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

// ---------- Photos on the route ----------

// A photo further than this from the route wasn't taken on it.
const MAX_GPS_KM = 2
// A clock this far outside the recording doesn't belong to it.
const TIME_SLACK_MS = 15 * 60_000

export type PlaceSource = 'gps' | 'time' | 'manual'

export interface SlidePlace {
  index: number
  source: PlaceSource
}

function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180
  const x = (b.lon - a.lon) * rad * Math.cos(((a.lat + b.lat) / 2) * rad)
  const y = (b.lat - a.lat) * rad
  return Math.sqrt(x * x + y * y) * 6371
}

function nearest(points: GpxPoint[], distance: (p: GpxPoint) => number, max: number): number | null {
  let best = -1
  let bestValue = Infinity
  for (let i = 0; i < points.length; i++) {
    const value = distance(points[i])
    if (value < bestValue) {
      bestValue = value
      best = i
    }
  }
  return best >= 0 && bestValue <= max ? best : null
}

// The place first, then the time against the track's times; null leaves it to a manual pick.
export function matchGeo(points: GpxPoint[] | null, geo: PhotoGeo | undefined): SlidePlace | null {
  if (!points?.length || !geo) return null
  if (geo.lat !== undefined && geo.lon !== undefined) {
    const at = { lat: geo.lat, lon: geo.lon }
    const index = nearest(points, (p) => kmBetween(p, at), MAX_GPS_KM)
    if (index !== null) return { index, source: 'gps' }
  }
  if (geo.time !== undefined) {
    const time = geo.time
    const index = nearest(points, (p) => (p.time == null ? Infinity : Math.abs(p.time - time)), TIME_SLACK_MS)
    if (index !== null) return { index, source: 'time' }
  }
  return null
}

const matches = new WeakMap<PhotoGeo, { points: GpxPoint[]; place: SlidePlace | null }>()

// Matching walks the whole track, so each photo's result is kept until the route changes.
function photoPlace(points: GpxPoint[], geo: PhotoGeo | undefined): SlidePlace | null {
  if (!geo) return null
  const cached = matches.get(geo)
  if (cached?.points === points) return cached.place
  const place = matchGeo(points, geo)
  matches.set(geo, { points, place })
  return place
}

// Where a photo slide sits on the route: set by hand, else its first photo that matches.
export function slidePlace(slide: Slide, photos: Map<number, Photo>, points: GpxPoint[] | null): SlidePlace | null {
  if (!points?.length || slideKind(slide) !== 'photos') return null
  if (slide.place != null) return { index: Math.min(slide.place, points.length - 1), source: 'manual' }
  for (const assignment of Object.values(slide.slots)) {
    const place = photoPlace(points, photos.get(assignment.photoId)?.geo)
    if (place) return place
  }
  return null
}

// Numbered dots on the first slide's route: one per exported photo slide that has a place.
export function mapDots(slides: Slide[], photos: Map<number, Photo>, points: GpxPoint[] | null): { index: number; n: number }[] {
  const numbers = slideNumbers(slides)
  return slides.flatMap((slide, i) => {
    const n = numbers[i]
    const place = i > 0 && n != null ? slidePlace(slide, photos, points) : null
    return place && n != null ? [{ index: place.index, n }] : []
  })
}

// ---------- Look ----------

// The paper, ink and accent of slides drawn from data follow the project's own colours. The ink is
// the stats' colour where it reads on the paper (white figures made for photos don't).
export function projectLook(s: { collage: CollageStyle; titleStyle: TitleStyle; routeStyle: RouteStyle; statsStyle: Pick<StatsStyle, 'color'> }): SlideLook {
  const { collage } = s
  const paper = collage.bgKind === 'color' ? collage.bgColor : collage.bgKind === 'gradient' ? collage.gradient.from : '#ede6d6'
  const ink = contrastRatio(s.statsStyle.color, paper) >= 4.5 ? s.statsStyle.color : toneOf(paper) === 'dark' ? PAPER : INK
  return { paper, ink, accent: s.routeStyle.color, font: s.titleStyle.fontFamily }
}

// What may come out wrong in the files; none of it stops the export.
export function seriesWarnings(slides: Slide[], photos: Map<number, Photo>, points: GpxPoint[] | null): string[] {
  const numbers = slideNumbers(slides)
  return slides.flatMap((slide, i) => {
    const n = numbers[i]
    if (i === 0 || n == null) return []
    const kind = slideKind(slide)
    if (kind !== 'photos') return points ? [] : [`Slajd ${n}: ${kind === 'profile' ? 'profil' : 'podsumowanie'} bez trasy`]
    const out: string[] = []
    if (Object.keys(slide.slots).length < layoutDef(slide.layoutKey).cells.length) out.push(`Slajd ${n}: puste miejsce na zdjęcie`)
    const overlays = slide.overlays ?? DEFAULT_OVERLAYS
    if ((overlays.marker || overlays.miniMap !== 'off') && !slidePlace(slide, photos, points)) out.push(`Slajd ${n}: nakładka bez miejsca na trasie`)
    return out
  })
}

// ---------- "Zastosuj do slajdów ze zdjęciami" ----------

export interface ApplyChoice {
  miniMap: boolean
  marker: boolean
  crop: boolean
}

// Photo slides after the first that take the source's settings; style exceptions keep theirs.
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
