import { FORMATS } from '../../core/formats/registry'
import { LIMIT_MESSAGE, MAX_EXPORT_SLIDES, applyToPhotoSlides, exportedSlides, followSlides, insertIndex, isExported, moveOrder, newSlide, roomForSlide, slideKind, slidePlace } from '../../utils/series'
import { selectTrack } from '../derived'
import { DEFAULT_SLOT_CROP } from '../defaults'
import { readPhotoFiles, takePhotoIds } from './mediaSlice'
import type { AppState, SeriesSlice, SliceContext } from '../types'
import type { Slide } from '../../types'

// A new order of the slides, each position naming the slide that was there (-1 for a new one):
// texts follow their slide, and the selected slide stays selected.
function reorder(s: AppState, slides: Slide[], order: number[], active: number): Partial<AppState> {
  return {
    slides,
    texts: followSlides(s.texts, order, FORMATS[s.aspectKey].w),
    activeSlide: active,
    selection: s.selection?.kind === 'slot' ? null : s.selection,
  }
}

export function createSeriesSlice({ set, get, commit }: SliceContext): SeriesSlice {
  // A series needs a carousel of its own slides: a format without one switches to the feed's 4:5,
  // and a panorama ribbon becomes separate slides.
  function prepareSeries(): boolean {
    const s = get()
    if (!roomForSlide(s.slides)) {
      s.showToast(LIMIT_MESSAGE, undefined, true)
      return false
    }
    if (!FORMATS[s.aspectKey].carousel) {
      s.setAspectKey('4:5')
      s.showToast('Seria slajdów powstaje w formacie Post 4:5.')
    }
    if (get().carouselKind !== 'slides') set({ carouselKind: 'slides' })
    return true
  }

  return {
    photoImport: null,

    addSeriesSlide: (kind) => {
      if (!prepareSeries()) return
      commit('slide:add', (s) => {
        const at = insertIndex(s.slides, Math.min(s.activeSlide, s.slides.length - 1), kind === 'collage' ? 'photos' : kind)
        const order = s.slides.map((_, i) => i)
        order.splice(at, 0, -1)
        return reorder(s, [...s.slides.slice(0, at), newSlide(kind), ...s.slides.slice(at)], order, at)
      })
    },

    // The copy lands right after the slide; the first slide's copy is a plain photo slide.
    duplicateSlide: (index) => {
      const source = get().slides[index]
      if (!source || !prepareSeries()) return
      commit('slide:dup', (s) => {
        const copy: Slide = index === 0 ? { layoutKey: source.layoutKey, slots: source.slots, kind: 'photos' } : { ...source, skipped: false }
        const order = s.slides.map((_, i) => i)
        order.splice(index + 1, 0, -1)
        return reorder(s, [...s.slides.slice(0, index + 1), copy, ...s.slides.slice(index + 1)], order, index + 1)
      })
    },

    // The first slide is the editor's frame and can't go.
    removeSlide: (index) => {
      const count = get().slides.length
      if (index < 1 || index >= count) return
      commit('slide:remove', (s) => {
        const order = s.slides.map((_, i) => i).filter((i) => i !== index)
        return reorder(s, s.slides.filter((_, i) => i !== index), order, Math.min(index, count - 2))
      })
    },

    moveSlide: (from, to) => {
      const order = moveOrder(get().slides.length, from, to)
      if (!order) return
      commit('slide:move', (s) =>
        reorder(
          s,
          order.map((i) => s.slides[i]),
          order,
          order.indexOf(from),
        ),
      )
    },

    // Bringing a skipped slide back counts against the limit like a new one.
    toggleSkipSlide: (index) => {
      const s = get()
      const slide = s.slides[index]
      if (!slide || index === 0) return
      if (!isExported(slide) && !roomForSlide(s.slides)) {
        s.showToast(LIMIT_MESSAGE, undefined, true)
        return
      }
      commit('slide:skip', (st) => ({ slides: st.slides.map((sl, i) => (i === index ? { ...sl, skipped: !sl.skipped } : sl)) }))
    },

    updateSlide: (index, patch) =>
      commit(`slide:${Object.keys(patch).join()}`, (s) => ({ slides: s.slides.map((sl, i) => (i === index ? { ...sl, ...patch } : sl)) })),

    applyBackgroundToKind: (from) =>
      commit('slide:apply:bg', (s) => {
        const source = s.slides[from]
        return { slides: s.slides.map((sl, i) => (i > 0 && slideKind(sl) === slideKind(source) ? { ...sl, background: source.background } : sl)) }
      }),

    applyToPhotoSlides: (from, choice) => commit('slide:apply', (s) => ({ slides: applyToPhotoSlides(s.slides, from, choice) })),

    // Each photo becomes a slide; the dialog says how many matched the route before they are made.
    importPhotoSlides: async (files) => {
      const { loaded, failed } = await readPhotoFiles(files)
      set({ photoError: failed ? 'Nie udało się wczytać części zdjęć' : '' })
      if (loaded.length) set({ photoImport: loaded })
    },

    confirmPhotoSlides: (byRoute) => {
      const loaded = get().photoImport
      set({ photoImport: null })
      if (!loaded || !prepareSeries()) return
      const room = MAX_EXPORT_SLIDES - exportedSlides(get().slides).length
      commit('photos:slides', (s) => {
        const first = takePhotoIds(s.photos, loaded.length)
        const photos = loaded.map((item, i) => ({ id: first + i, ...(byRoute ? item : { ...item, geo: undefined }) }))
        const points = selectTrack(s)?.points ?? null
        const byId = new Map(photos.map((p) => [p.id, p]))
        let made: Slide[] = photos.map((p) => ({ ...newSlide('photos'), slots: { 0: { photoId: p.id, ...DEFAULT_SLOT_CROP } } }))
        // Along the route by default: the place's kilometre, photos without one keep their order at the end.
        if (byRoute) {
          const at = (slide: Slide) => slidePlace(slide, byId, points)?.index ?? Infinity
          made = made.map((slide, i) => ({ slide, i, at: at(slide) })).sort((a, b) => a.at - b.at || a.i - b.i).map((x) => x.slide)
        }
        // Past the limit the slides are made skipped, so nothing is lost.
        made = made.map((slide, i) => (i < room ? slide : { ...slide, skipped: true }))
        const at = insertIndex(s.slides, s.slides.length - 1, 'photos')
        const order = s.slides.map((_, i) => i)
        order.splice(at, 0, ...made.map(() => -1))
        return { photos: [...s.photos, ...photos], ...reorder(s, [...s.slides.slice(0, at), ...made, ...s.slides.slice(at)], order, at) }
      })
      if (loaded.length > room) get().showToast(`Pominięto ${loaded.length - room} z nowych slajdów: ${LIMIT_MESSAGE.toLowerCase()}`)
    },

    cancelPhotoSlides: () => set({ photoImport: null }),
  }
}
