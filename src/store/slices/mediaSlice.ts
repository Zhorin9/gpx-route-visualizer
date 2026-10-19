import { ASPECTS } from '../../utils/aspects'
import { parseGpxText } from '../../utils/gpx'
import { loadPhoto } from '../../utils/image'
import { computeSlots, frameInsets, layoutDef } from '../../utils/layouts'
import { measureTextWidth } from '../../utils/measureText'
import { reflowTo, resetToAuto } from '../../utils/reflow'
import { CAROUSEL_SLIDES, DAY_COLORS, DEFAULT_SLOT_CROP, DEFAULT_STATS_CONTENT, IDENTITY_TRANSFORM, MAX_SLIDES, MIN_CAROUSEL_SLIDES, makeText } from '../defaults'
import type { CarouselKind, LayoutGroup, RouteDay, Slide } from '../../types'
import type { MediaSlice, SliceContext } from '../types'

const CREATIVE: LayoutGroup = 'creative'

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

// Texts left beyond the right edge after the ribbon shrinks would be unreachable.
function keepInside<T extends { x: number }>(texts: T[], width: number): T[] {
  return texts.map((t) => (t.x > width - 60 ? { ...t, x: Math.max(0, width - 60) } : t))
}

function withSlide(slides: Slide[], index: number, update: (slide: Slide) => Slide): Slide[] {
  return slides.map((slide, i) => (i === index ? update(slide) : slide))
}

export function createMediaSlice({ set, get, commit, resetHistory }: SliceContext): MediaSlice {
  return {
    track: null,
    gpxError: '',
    photos: [],
    photoError: '',
    routeDays: [],

    loadGpxFile: async (file, append = false) => {
      try {
        const parsed = parseGpxText(await file.text())
        const s = get()
        if (append && s.track) {
          // Another day: the file is joined to the track and keeps its own slice and colour.
          const first = s.track.points.length
          const days: RouteDay[] = s.routeDays.length
            ? s.routeDays
            : [{ id: 1, name: s.track.name ?? 'Dzień 1', startIdx: 0, endIdx: first - 1, color: s.routeStyle.color, dashed: s.routeStyle.dashed, visible: true }]
          const used = new Set(days.map((d) => d.color.toLowerCase()))
          const color = DAY_COLORS.find((c) => !used.has(c)) ?? DAY_COLORS[days.length % DAY_COLORS.length]
          const day: RouteDay = {
            id: days.reduce((max, d) => Math.max(max, d.id), 0) + 1,
            name: parsed.name ?? file.name.replace(/\.gpx$/i, ''),
            startIdx: first,
            endIdx: first + parsed.points.length - 1,
            color,
            dashed: false,
            visible: true,
          }
          const points = [...s.track.points, ...parsed.points]
          set({
            track: { name: s.track.name, points },
            routeDays: [...days, day],
            range: { start: 0, end: points.length - 1 },
            progress: 100,
            gpxError: '',
          })
          return
        }
        // Waypoints and history are anchored to the previous track — start clean.
        set((s) => ({
          track: parsed,
          routeDays: [],
          gpxError: '',
          range: { start: 0, end: parsed.points.length - 1 },
          progress: 100,
          waypoints: [],
          routeTransform: IDENTITY_TRANSFORM,
          sourceLayout: s.sourceLayout && { ...s.sourceLayout, route: IDENTITY_TRANSFORM },
          layoutOverrides: Object.fromEntries(Object.entries(s.layoutOverrides).map(([k, o]) => [k, { ...o, route: undefined }])),
          statsContent: { ...s.statsContent, overrides: DEFAULT_STATS_CONTENT.overrides },
          selection: s.selection?.kind === 'waypoint' ? null : s.selection,
        }))
        resetHistory()
      } catch (err) {
        set({ gpxError: err instanceof Error ? err.message : 'Nie udało się odczytać pliku GPX' })
      }
    },

    updateDay: (id, patch) => set((s) => ({ routeDays: s.routeDays.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

    removeDay: (id) => {
      const s = get()
      const day = s.routeDays.find((d) => d.id === id)
      if (!s.track || !day || s.routeDays.length < 2) return
      const length = day.endIdx - day.startIdx + 1
      const shift = (i: number) => (i > day.endIdx ? i - length : i)
      const rest = s.routeDays.filter((d) => d.id !== id).map((d) => ({ ...d, startIdx: shift(d.startIdx), endIdx: shift(d.endIdx) }))
      const points = s.track.points.filter((_, i) => i < day.startIdx || i > day.endIdx)
      const waypoints = s.waypoints.filter((w) => w.trackPos < day.startIdx || w.trackPos > day.endIdx).map((w) => ({ ...w, trackPos: shift(w.trackPos) }))
      set({
        track: { ...s.track, points },
        routeDays: rest.length > 1 ? rest : [],
        routeStyle: rest.length > 1 ? s.routeStyle : { ...s.routeStyle, color: rest[0].color, dashed: rest[0].dashed },
        range: { start: 0, end: points.length - 1 },
        progress: 100,
        waypoints,
        selection: s.selection?.kind === 'waypoint' && !waypoints.some((w) => w.id === (s.selection as { id: number }).id) ? null : s.selection,
      })
      resetHistory()
    },

    loadPhotoFiles: async (files, target) => {
      const loaded: { name: string; image: HTMLCanvasElement; thumb: string }[] = []
      let failed = false
      for (const file of files) {
        try {
          loaded.push({ name: file.name, ...(await loadPhoto(file)) })
        } catch {
          failed = true
        }
      }
      set({ photoError: failed ? 'Nie udało się wczytać części zdjęć' : '' })
      if (!loaded.length) return

      commit('photos:add', (s) => {
        let id = nextId(s.photos)
        const photos = [...s.photos]
        let slides = s.slides
        const queue: number[] = []
        for (const item of loaded) {
          photos.push({ id, ...item })
          queue.push(id++)
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
        const panorama = s.carouselKind === 'panorama' && slides.length > 1
        slides = slides.map((slide, slideIndex) => {
          if (panorama && slideIndex > 0) return slide
          const slots = { ...slide.slots }
          const count = panorama ? 1 : layoutDef(slide.layoutKey).cells.length
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
      const panorama = s.carouselKind === 'panorama' && s.slides.length > 1
      let target: { slide: number; index: number } | null = null
      if (panorama) target = { slide: 0, index: 0 }
      else if (s.selection?.kind === 'slot') target = { slide: s.selection.slide, index: s.selection.index }
      else {
        const order = [Math.min(s.activeSlide, s.slides.length - 1), ...s.slides.map((_, i) => i)]
        for (const slide of order) {
          const index = Array.from({ length: layoutDef(s.slides[slide].layoutKey).cells.length }, (_, i) => i).find((i) => !s.slides[slide].slots[i])
          if (index !== undefined) {
            target = { slide, index }
            break
          }
        }
      }
      if (!target) return s.showToast('Wszystkie sloty są zajęte — zaznacz slot, aby go podmienić')
      s.assignPhoto(target.slide, target.index, photoId)
    },

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

    // Photos stay in their slot numbers, so switching layouts reuses them.
    setLayout: (slide, key) =>
      commit('layout', (s) => ({
        slides: withSlide(s.slides, slide, (sl) => ({ ...sl, layoutKey: key })),
        collage: { ...s.collage, frame: { ...s.collage.frame, style: layoutDef(key).group === CREATIVE ? 'polaroid' : 'equal' } },
      })),

    setCarousel: (on) => {
      const count = get().slides.length
      if (on === count > 1) return
      commit('carousel', (s) => ({
        slides: on
          ? [...s.slides, ...Array.from({ length: CAROUSEL_SLIDES - s.slides.length }, (): Slide => ({ layoutKey: 'g1', slots: {} }))]
          : s.slides.slice(0, 1),
        activeSlide: 0,
        texts: on ? s.texts : keepInside(s.texts, ASPECTS[s.aspectKey].w),
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
        texts: keepInside(s.texts, ASPECTS[s.aspectKey].w * next),
      }))
    },

    addSlide: () => {
      if (get().slides.length >= MAX_SLIDES) return
      commit('slide:add', (s) => ({
        slides: [...s.slides, { layoutKey: 'g1', slots: {} }],
        activeSlide: s.slides.length,
      }))
    },

    removeSlide: (index) => {
      const count = get().slides.length
      if (count <= MIN_CAROUSEL_SLIDES || index < 0 || index >= count) return
      commit('slide:remove', (s) => ({
        slides: s.slides.filter((_, i) => i !== index),
        activeSlide: Math.max(0, Math.min(s.activeSlide, s.slides.length - 2)),
        selection: s.selection?.kind === 'slot' ? null : s.selection,
        texts: keepInside(s.texts, ASPECTS[s.aspectKey].w * (s.slides.length - 1)),
      }))
    },

    updateCollage: (patch) => commit(`collage:${Object.keys(patch).join()}`, (s) => ({ collage: { ...s.collage, ...patch } })),
    updateFrame: (patch) =>
      commit(`frame:${Object.keys(patch).join()}`, (s) => ({ collage: { ...s.collage, frame: { ...s.collage.frame, ...patch } } })),

    addCaption: (slide, index) => {
      const s = get()
      const { w, h } = ASPECTS[s.aspectKey]
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

    setAspectKey: (key) => commit('aspect', (s) => reflowTo(s, key)),
    resetFormatLayout: () => commit('format:reset', (s) => resetToAuto(s)),

    setDimOpacity: (value) => commit('dim', { dimOpacity: value }),
  }
}
