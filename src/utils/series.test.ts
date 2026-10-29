import { describe, expect, it } from 'vitest'
import { parseExif, parseExifDate } from './exif'
import { exportFileNames } from './exportImage'
import { applyToPhotoSlides, followSlides, insertIndex, mapDots, matchGeo, moveOrder, newSlide, roomForSlide, seriesWarnings, slideLabel, slideNumbers } from './series'
import type { GpxPoint, Photo, Slide } from '../types'

const photoSlide = (photoId?: number): Slide => ({ ...newSlide('photos'), slots: photoId ? { 0: { photoId, zoom: 1, offsetX: 0, offsetY: 0 } } : {} })
const frame: Slide = { layoutKey: 'g1', slots: {} }
const points: GpxPoint[] = Array.from({ length: 11 }, (_, i) => ({ lat: 46 + i * 0.01, lon: 10, ele: 1000 + i * 50, time: Date.UTC(2026, 6, 14, 6, i * 10) }))
const photo = (id: number, geo: Photo['geo']): Photo => ({ id, name: `${id}.jpg`, image: null as unknown as HTMLCanvasElement, thumb: '', geo })

describe('series of slides', () => {
  it('names slides after what they hold; the first is the editor frame', () => {
    expect(slideLabel(frame, 0, 'map')).toBe('Mapa')
    expect(slideLabel(frame, 0, 'collage')).toBe('Kolaż')
    expect([photoSlide(), newSlide('collage'), newSlide('profile'), newSlide('summary')].map((s) => slideLabel(s, 1, 'map'))).toEqual(['Zdjęcie', 'Kolaż', 'Profil', 'Podsumowanie'])
  })

  it('adds after the selected slide, but in front of a summary that ends the series', () => {
    const slides = [frame, photoSlide(), newSlide('summary')]
    expect(insertIndex(slides, 0, 'photos')).toBe(1)
    expect(insertIndex(slides, 2, 'photos')).toBe(2)
    expect(insertIndex(slides, 2, 'summary')).toBe(3)
  })

  it('keeps the first slide first', () => {
    expect(moveOrder(4, 0, 2)).toBeNull()
    expect(moveOrder(4, 3, 0)).toEqual([0, 3, 1, 2])
    expect(moveOrder(4, 1, 3)).toEqual([0, 2, 3, 1])
  })

  it('moves texts with their slide and drops them with a removed one', () => {
    const texts = [{ x: 100 }, { x: 1180 }, { x: 2200 }]
    expect(followSlides(texts, [0, 2, 1], 1080).map((t) => t.x)).toEqual([100, 2260, 1120])
    expect(followSlides(texts, [0, 2], 1080).map((t) => t.x)).toEqual([100, 1120])
  })

  it('counts only exported slides against the limit and in the numbers', () => {
    const slides = [frame, photoSlide(), { ...photoSlide(), skipped: true }, photoSlide()]
    expect(slideNumbers(slides)).toEqual([1, 2, null, 3])
    expect(roomForSlide(slides)).toBe(true)
    expect(roomForSlide([frame, ...Array.from({ length: 19 }, () => photoSlide())])).toBe(false)
  })

  it('numbers files in the order of the strip', () => {
    expect(exportFileNames('jpg', 1, '4:5', 'Alpy 2026', 2)).toEqual(['alpy-2026-01-4x5.jpg', 'alpy-2026-02-4x5.jpg'])
  })
})

describe('photos on the route', () => {
  it('matches a photo by place first, then by time; far from the route it stays unmatched', () => {
    expect(matchGeo(points, { lat: 46.031, lon: 10 })).toEqual({ index: 3, source: 'gps' })
    expect(matchGeo(points, { time: Date.UTC(2026, 6, 14, 6, 51) })).toEqual({ index: 5, source: 'time' })
    expect(matchGeo(points, { lat: 50, lon: 10 })).toBeNull()
  })

  it('puts one dot per exported photo slide with a place, numbered as on the strip', () => {
    const photos = new Map([
      [1, photo(1, { lat: 46.08, lon: 10 })],
      [2, photo(2, {})],
    ])
    const slides = [frame, photoSlide(1), { ...photoSlide(2), skipped: true }, { ...photoSlide(2), place: 2 }]
    expect(mapDots(slides, photos, points)).toEqual([
      { index: 8, n: 2 },
      { index: 2, n: 3 },
    ])
  })

  it('warns about an empty photo place and an overlay without a place, past the first slide', () => {
    const slides = [frame, photoSlide(), { ...photoSlide(1), overlays: { miniMap: 'corner' as const, marker: false } }]
    expect(seriesWarnings(slides, new Map([[1, photo(1, {})]]), points)).toEqual(['Slajd 2: puste miejsce na zdjęcie', 'Slajd 3: nakładka bez miejsca na trasie'])
  })
})

describe('apply to photo slides', () => {
  it('copies the chosen overlays to the other photo slides, skipping style exceptions and data slides', () => {
    const look = { paper: '#fff', ink: '#000', accent: '#f00', font: 'Lora' }
    const slides = [frame, { ...photoSlide(1), overlays: { miniMap: 'large' as const, marker: true } }, photoSlide(2), { ...photoSlide(3), ownLook: look }, newSlide('profile')]
    const out = applyToPhotoSlides(slides, 1, { miniMap: true, marker: false, crop: false })
    expect(out[2].overlays).toEqual({ miniMap: 'large', marker: false })
    expect(out[3]).toBe(slides[3])
    expect(out[4]).toBe(slides[4])
    expect(out[0]).toBe(slides[0])
  })
})

describe('EXIF', () => {
  it('reads the place and the moment a photo was taken', () => {
    const exif = parseExif(jpegWithExif())
    expect(exif.lat).toBeCloseTo(46.5)
    expect(exif.lon).toBeCloseTo(10.76)
    expect(exif.time).toBe(Date.UTC(2026, 6, 14, 4, 12, 40))
  })

  it('has nothing to say about a file that is not a JPEG', () => {
    expect(parseExif(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toEqual({})
    expect(parseExifDate('nonsense')).toBeUndefined()
  })
})

// A minimal JPEG with an EXIF block: DateTimeOriginal with an offset, and a GPS position.
function jpegWithExif(): ArrayBuffer {
  const bytes: number[] = []
  const u16 = (v: number) => bytes.push((v >> 8) & 255, v & 255)
  const u32 = (v: number) => bytes.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255)
  const tiff: number[] = []
  const t16 = (v: number) => tiff.push((v >> 8) & 255, v & 255)
  const t32 = (v: number) => tiff.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255)
  const entry = (tag: number, type: number, count: number, value: number) => {
    t16(tag)
    t16(type)
    t32(count)
    t32(value)
  }
  // Header, IFD0 at 8 with two pointers.
  tiff.push(0x4d, 0x4d)
  t16(42)
  t32(8)
  t16(2)
  entry(0x8769, 4, 1, 38)
  entry(0x8825, 4, 1, 80)
  t32(0)
  // Exif IFD at 38: two ASCII values stored at 68 and... both point past the IFD.
  t16(2)
  entry(0x9003, 2, 20, 200)
  entry(0x9011, 2, 7, 220)
  t32(0)
  while (tiff.length < 80) tiff.push(0)
  // GPS IFD at 80.
  t16(4)
  entry(1, 2, 2, 0x4e000000)
  entry(2, 5, 3, 140)
  entry(3, 2, 2, 0x45000000)
  entry(4, 5, 3, 164)
  t32(0)
  while (tiff.length < 140) tiff.push(0)
  for (const v of [46, 1, 30, 1, 0, 1, 10, 1, 45, 1, 36, 1]) t32(v)
  while (tiff.length < 200) tiff.push(0)
  for (const c of '2026:07:14 06:12:40\0') tiff.push(c.charCodeAt(0))
  for (const c of '+02:00\0') tiff.push(c.charCodeAt(0))
  u16(0xffd8)
  u16(0xffe1)
  u16(tiff.length + 8)
  u32(0x45786966)
  u16(0)
  bytes.push(...tiff)
  u16(0xffd9)
  return new Uint8Array(bytes).buffer
}

