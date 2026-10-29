import { FORMATS } from '../../core/formats/registry'
import { loadPhoto } from '../../utils/image'
import { computeSlots, frameInsets, frameStyleFor, hasVisiblePhotos, isPanorama, layoutDef, slotCount } from '../../utils/layouts'
import { INK, PAPER, mixHex, toneOf, type Tone } from '../../utils/color'
import { measureTextWidth } from '../../utils/measureText'
import { reflowTo, resetToAuto } from '../../utils/reflow'
import { readExif } from '../../utils/exif'
import { CAROUSEL_SLIDES, DEFAULT_SLOT_CROP, MAX_SLIDES, MIN_CAROUSEL_SLIDES, makeText, nextId } from '../defaults'
import type { CarouselKind, CollageStyle, Photo, Slide } from '../../types'
import type { AppState, MediaSlice, SliceContext } from '../types'

// Texts left beyond the right edge after the ribbon shrinks would be unreachable.
function keepInside<T extends { x: number }>(texts: T[], width: number): T[] {
  return texts.map((t) => (t.x > width - 60 ? { ...t, x: Math.max(0, width - 60) } : t))
}

// Ids are never reused, so undoing a removal can't pick up a photo uploaded later.
let lastPhotoId = 0

// The first of `count` fresh photo ids.
export function takePhotoIds(photos: { id: number }[], count: number): number {
  const first = Math.max(nextId(photos), lastPhotoId + 1)
  lastPhotoId = first + count - 1
  return first
}

export type LoadedPhoto = Omit<Photo, 'id'>

// Decodes the files and reads where each photo was taken; files that can't be read are counted.
export async function readPhotoFiles(files: File[]): Promise<{ loaded: LoadedPhoto[]; failed: boolean }> {
  const loaded: LoadedPhoto[] = []
  let failed = false
  for (const file of files) {
    try {
      const [image, geo] = await Promise.all([loadPhoto(file), readExif(file)])
      loaded.push({ name: file.name, ...image, geo })
    } catch {
      failed = true
    }
  }
  return { loaded, failed }
}

// Whether a colour or gradient background is light or dark; null for the other kinds.
export const collageTone = (c: CollageStyle): Tone | null =>
  c.bgKind === 'gradient' ? toneOf(mixHex(c.gradient.from, c.gradient.to)) : c.bgKind === 'color' ? toneOf(c.bgColor) : null

// With auto contrast, text and route flip to dark or light when the background does. Over photos
// the background isn't what the text sits on, so the colours are left alone.
export function withContrast(s: AppState, collage: CollageStyle, before: Tone | null, after: Tone | null): Partial<AppState> {
  if (!collage.autoContrast || !after || after === (before ?? 'dark') || hasVisiblePhotos(s.slides, s.carouselKind)) return { collage }
  const color = after === 'light' ? INK : PAPER
  return {
    collage,
    statsStyle: { ...s.statsStyle, color },
    titleStyle: { ...s.titleStyle, color },
    texts: s.texts.map((t) => ({ ...t, color })),
    waypoints: s.waypoints.map((w) => ({ ...w, color })),
    routeStyle: { ...s.routeStyle, color },
  }
}

function withSlide(slides: Slide[], index: number, update: (slide: Slide) => Slide): Slide[] {
  return slides.map((slide, i) => (i === index ? update(slide) : slide))
}

export function createMediaSlice({ set, get, commit }: SliceContext): MediaSlice {
  return {
    photos: [],
    photoError: '',

    loadPhotoFiles: async (files, target) => {
      const { loaded, failed } = await readPhotoFiles(files)
      set({ photoError: failed ? 'Nie udało się wczytać części zdjęć' : '' })
      if (!loaded.length) return

      commit('photos:add', (s) => {
        const first = takePhotoIds(s.photos, loaded.length)
        const photos = [...s.photos, ...loaded.map((item, i) => ({ id: first + i, ...item }))]
        let slides = s.slides
        const queue = loaded.map((_, i) => first + i)
        if (target && 'waypoint' in target) {
          const photoId = queue[0]
          return { photos, waypoints: s.waypoints.map((w) => (w.id === target.waypoint ? { ...w, photoId } : w)) }
        }
        if (target) {
          const photoId = queue.shift()!
          slides = withSlide(slides, target.slide, (slide) => ({
            ...slide,
            slots: { ...slide.slots, [target.index]: { photoId, ...DEFAULT_SLOT_CROP } },
          }))
        }
        // Remaining photos fill empty slots from the first slide on; extras stay in the tape.
        // A panorama has a single slot, so only its photo is placed.
        const panorama = isPanorama(slides, s.carouselKind)
        slides = slides.map((slide, slideIndex) => {
          if (panorama && slideIndex > 0) return slide
          const slots = { ...slide.slots }
          const count = panorama ? 1 : slotCount(slide)
          for (let i = 0; i < count && queue.length; i++) {
            if (!slots[i]) slots[i] = { photoId: queue.shift()!, ...DEFAULT_SLOT_CROP }
          }
          return { ...slide, slots }
        })
        return { photos, slides }
      })
    },

    assignPhoto: (slide, index, photoId) =>
      commit('slot:assign', (s) => ({
        slides: withSlide(s.slides, slide, (sl) => ({ ...sl, slots: { ...sl.slots, [index]: { photoId, ...DEFAULT_SLOT_CROP } } })),
      })),

    placePhoto: (photoId) => {
      const s = get()
      const panorama = isPanorama(s.slides, s.carouselKind)
      let target: { slide: number; index: number } | null = null
      if (panorama) target = { slide: 0, index: 0 }
      else if (s.selection?.kind === 'slot') target = { slide: s.selection.slide, index: s.selection.index }
      else {
        const order = [Math.min(s.activeSlide, s.slides.length - 1), ...s.slides.map((_, i) => i)]
        for (const slide of order) {
          const index = Array.from({ length: slotCount(s.slides[slide]) }, (_, i) => i).find((i) => !s.slides[slide].slots[i])
          if (index !== undefined) {
            target = { slide, index }
            break
          }
        }
      }
      if (!target) return s.showToast('Wszystkie sloty są zajęte — zaznacz slot, aby go podmienić')
      s.assignPhoto(target.slide, target.index, photoId)
    },

    // Not an undo step: the library isn't part of the history, so undo couldn't bring the file back.
    removePhoto: (photoId) =>
      set((s) => ({
        photos: s.photos.filter((p) => p.id !== photoId),
        slides: s.slides.map((slide) => ({
          ...slide,
          slots: Object.fromEntries(Object.entries(slide.slots).filter(([, a]) => a.photoId !== photoId)),
        })),
        selection: s.selection?.kind === 'slot' ? null : s.selection,
      })),

    clearSlot: (slide, index) =>
      commit('slot:clear', (s) => ({
        slides: withSlide(s.slides, slide, (sl) => {
          const slots = { ...sl.slots }
          delete slots[index]
          return { ...sl, slots }
        }),
      })),

    updateSlot: (slide, index, patch) =>
      commit(`slot:${slide}:${index}:${Object.keys(patch).join()}`, (s) => ({
        slides: withSlide(s.slides, slide, (sl) =>
          sl.slots[index] ? { ...sl, slots: { ...sl.slots, [index]: { ...sl.slots[index], ...patch } } } : sl,
        ),
      })),

    resetSlotCrop: (slide, index) => get().updateSlot(slide, index, DEFAULT_SLOT_CROP),

    // Filling centres the photo again; a manual crop starts from where it is.
    setCrop: (crop, target) =>
      commit(`crop:${target ? `${target.slide}:${target.index}` : 'all'}`, (s) => ({
        slides: s.slides.map((sl, i) => {
          if (target && i !== target.slide) return sl
          const slots = Object.fromEntries(
            Object.entries(sl.slots).map(([index, a]) =>
              !target || Number(index) === target.index ? [index, { ...a, crop, ...(crop === 'fill' ? DEFAULT_SLOT_CROP : null) }] : [index, a],
            ),
          )
          return { ...sl, slots }
        }),
      })),

    // Photos stay in their slot numbers, so switching layouts reuses them.
    setLayout: (slide, key) =>
      commit('layout', (s) => ({
        slides: withSlide(s.slides, slide, (sl) => ({ ...sl, layoutKey: key })),
        collage: { ...s.collage, frame: { ...s.collage.frame, style: frameStyleFor(key) } },
      })),

    setCarousel: (on) => {
      const count = get().slides.length
      if (on === count > 1) return
      commit('carousel', (s) => ({
        slides: on
          ? [...s.slides, ...Array.from({ length: CAROUSEL_SLIDES - s.slides.length }, (): Slide => ({ layoutKey: 'g1', slots: {} }))]
          : s.slides.slice(0, 1),
        activeSlide: 0,
        texts: on ? s.texts : keepInside(s.texts, FORMATS[s.aspectKey].w),
      }))
    },

    // How many slides a panorama is cut into; a series grows slide by slide instead.
    setSlideCount: (count) => {
      const next = Math.max(MIN_CAROUSEL_SLIDES, Math.min(MAX_SLIDES, count))
      if (get().slides.length === next) return
      commit('carousel:count', (s) => ({
        slides: (next > s.slides.length
          ? [...s.slides, ...Array.from({ length: next - s.slides.length }, (): Slide => ({ layoutKey: 'g1', slots: {} }))]
          : s.slides.slice(0, next)
        ).map((sl, i) => (i === 0 && sl.slots[0] ? { ...sl, slots: { ...sl.slots, 0: { ...sl.slots[0], ...DEFAULT_SLOT_CROP } } } : sl)),
        activeSlide: Math.min(s.activeSlide, next - 1),
        selection: s.selection?.kind === 'slot' && s.selection.slide >= next ? null : s.selection,
        texts: keepInside(s.texts, FORMATS[s.aspectKey].w * next),
      }))
    },

    setCarouselKind: (kind: CarouselKind) => {
      if (get().carouselKind === kind) return
      commit('carousel:kind', (s) => ({
        carouselKind: kind,
        activeSlide: 0,
        selection: s.selection?.kind === 'slot' ? null : s.selection,
        slides: withSlide(s.slides, 0, (sl) => (sl.slots[0] ? { ...sl, slots: { ...sl.slots, 0: { ...sl.slots[0], ...DEFAULT_SLOT_CROP } } } : sl)),
      }))
    },

    updateCollage: (patch) => commit(`collage:${Object.keys(patch).join()}`, (s) => ({ collage: { ...s.collage, ...patch } })),
    updateFrame: (patch) =>
      commit(`frame:${Object.keys(patch).join()}`, (s) => ({ collage: { ...s.collage, frame: { ...s.collage.frame, ...patch } } })),

    updateBackground: ({ gradient, ...patch }) =>
      commit('background', (s) => {
        const collage = { ...s.collage, ...patch, gradient: { ...s.collage.gradient, ...gradient } }
        return withContrast(s, collage, collageTone(s.collage), collageTone(collage))
      }),

    addCaption: (slide, index) => {
      const s = get()
      const { w, h } = FORMATS[s.aspectKey]
      const slot = computeSlots(layoutDef(s.slides[slide]?.layoutKey ?? 'g1'), w, h, s.collage.gap, s.collage.margin)[index]
      if (!slot) return
      const { frame } = s.collage
      const insets = frameInsets(slot, frame.thickness, frame.style, slot.kind === 'framed' || frame.enabled)
      const fontSize = Math.max(22, Math.min(46, (insets.bottom || 40) * 0.55))
      const text = makeText(nextId(s.texts), w, h)
      const width = measureTextWidth('Podpis', 'Caveat', fontSize, '400')
      const rad = (slot.rotation * Math.PI) / 180
      const lx = -width / 2
      const ly = slot.h / 2 - (insets.bottom || 40) / 2 - fontSize * 0.55
      const cx = slot.x + slot.w / 2 + slide * w
      const cy = slot.y + slot.h / 2
      commit('caption:add', {
        texts: [
          ...s.texts,
          {
            ...text,
            text: 'Podpis',
            fontFamily: 'Caveat',
            fontSize,
            color: '#2a2a2a',
            shadowEnabled: false,
            rotation: slot.rotation,
            x: cx + lx * Math.cos(rad) - ly * Math.sin(rad),
            y: cy + lx * Math.sin(rad) + ly * Math.cos(rad),
          },
        ],
        selection: { kind: 'text', id: text.id },
        activeTab: 'texts',
      })
    },

    setAspectKey: (key) =>
      commit('aspect', (s) => {
        const next = reflowTo(s, key)
        const slideGone = s.selection?.kind === 'slot' && next.slides && s.selection.slide >= next.slides.length
        return slideGone ? { ...next, selection: null } : next
      }),
    resetFormatLayout: () => commit('format:reset', (s) => resetToAuto(s)),

    setDimOpacity: (value) => commit('dim', { dimOpacity: value }),
  }
}
