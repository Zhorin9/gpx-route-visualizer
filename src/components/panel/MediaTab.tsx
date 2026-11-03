import { useState } from 'react'
import SliderField from '../fields/SliderField'
import ColorField from '../fields/ColorField'
import CheckboxField from '../fields/CheckboxField'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import { useActiveSlide, useHasPhotos, usePanorama } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_COLLAGE } from '../../store/defaults'
import { FORMATS } from '../../core/formats/registry'
import { LAYOUTS, computeSlots, layoutDef, layoutFits, slotCount, type LayoutDef } from '../../utils/layouts'
import { ThisSlideSection } from './SlidePanel'
import PhotoPool from './PhotoPool'
import { MAX_SLIDES, MIN_CAROUSEL_SLIDES } from '../../store/defaults'
import type { CarouselKind, FrameKind, LayoutGroup, LayoutKey, Photo, SelectOption, Slide, SlotCrop } from '../../types'

const GROUP_OPTIONS: SelectOption<LayoutGroup>[] = [
  { value: 'grid', label: 'Siatki' },
  { value: 'creative', label: 'Kreatywne / scrapbook' },
]

const CAROUSEL_KIND_OPTIONS: SelectOption<CarouselKind>[] = [
  { value: 'panorama', label: 'Jedno zdjęcie' },
  { value: 'slides', label: 'Osobne układy' },
]

const SLIDE_COUNT_OPTIONS: SelectOption<string>[] = Array.from({ length: MAX_SLIDES - MIN_CAROUSEL_SLIDES + 1 }, (_, i) => {
  const n = String(i + MIN_CAROUSEL_SLIDES)
  return { value: n, label: n }
})

const FRAME_OPTIONS: SelectOption<FrameKind>[] = [
  { value: 'equal', label: 'Równa' },
  { value: 'polaroid', label: 'Polaroid' },
]

const FIT_OPTIONS: SelectOption<'cover' | 'contain'>[] = [
  { value: 'cover', label: 'Przytnij' },
  { value: 'contain', label: 'Całe + rozmyte tło' },
]

const CROP_OPTIONS: SelectOption<SlotCrop>[] = [
  { value: 'fill', label: 'Wypełnij' },
  { value: 'fit', label: 'Dopasuj' },
  { value: 'manual', label: 'Ręcznie' },
]

const OUTPUT_OPTIONS: SelectOption<'single' | 'carousel'>[] = [
  { value: 'single', label: 'Jeden kadr' },
  { value: 'carousel', label: 'Karuzela' },
]

// Box a layout thumbnail fits in, in the frame's proportions.
const THUMB_W = 76
const THUMB_H = 96

function LayoutThumb({
  def,
  active,
  slide,
  photos,
  size,
  onApply,
  onPreview,
}: {
  def: LayoutDef
  size: { w: number; h: number }
  active: boolean
  slide: Slide
  photos: Map<number, Photo>
  onApply: () => void
  onPreview: (on: boolean) => void
}) {
  const slots = computeSlots(def, size.w, size.h, 2, 3)
  return (
    <button
      type="button"
      className={active ? 'layout-thumb active' : 'layout-thumb'}
      aria-pressed={active}
      onClick={onApply}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
    >
      <span className="layout-thumb-box" style={{ width: size.w, height: size.h }}>
        {slots.map((slot) => {
          const photo = photos.get(slide.slots[slot.index]?.photoId ?? -1)
          return (
            <span
              key={slot.index}
              className={slot.kind === 'framed' ? 'layout-thumb-cell framed' : 'layout-thumb-cell'}
              style={{
                left: slot.x,
                top: slot.y,
                width: slot.w,
                height: slot.h,
                transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                backgroundImage: photo ? `url(${photo.thumb})` : undefined,
              }}
            />
          )
        })}
      </span>
      <span className="layout-thumb-label">{def.label}</span>
    </button>
  )
}

export default function MediaTab() {
  const hasPhotos = useHasPhotos()
  const slides = useAppStore((s) => s.slides)
  const photos = useAppStore((s) => s.photos)
  const collage = useAppStore((s) => s.collage)
  const setLayout = useAppStore((s) => s.setLayout)
  const setPreviewLayout = useAppStore((s) => s.setPreviewLayout)
  const updateCollage = useAppStore((s) => s.updateCollage)
  const updateFrame = useAppStore((s) => s.updateFrame)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setSubTab = useAppStore((s) => s.setSubTab)
  const setCarousel = useAppStore((s) => s.setCarousel)
  // A collage frame has no route: its layout section is named after the frame.
  const collageMode = useAppStore((s) => s.mode === 'collage')

  const carouselKind = useAppStore((s) => s.carouselKind)
  const setCarouselKind = useAppStore((s) => s.setCarouselKind)
  const setSlideCount = useAppStore((s) => s.setSlideCount)
  const panorama = usePanorama()
  const activeSlide = useActiveSlide()
  const slide = slides[activeSlide]
  const currentDef = layoutDef(slide.layoutKey)
  const [group, setGroup] = useState<LayoutGroup>(currentDef.group)
  const photoMap = new Map(photos.map((p) => [p.id, p]))
  const { frame } = collage
  const format = useAppStore((s) => FORMATS[s.aspectKey])
  const thumbW = Math.min(THUMB_W, Math.round((THUMB_H * format.w) / format.h))
  const thumbSize = { w: thumbW, h: Math.round((thumbW * format.h) / format.w) }
  const isCreative = currentDef.group === 'creative'
  const showFrameControls = isCreative || frame.enabled

  function apply(key: LayoutKey) {
    setPreviewLayout(null)
    setLayout(activeSlide, key)
  }

  const carouselSection = slides.length > 1 && (
    <Section title="Karuzela">
      <Segmented label="Sposób podziału" showLabel value={carouselKind} options={CAROUSEL_KIND_OPTIONS} onChange={setCarouselKind} />
      {panorama ? (
        <>
          <Segmented label="Liczba slajdów" showLabel value={String(slides.length)} options={SLIDE_COUNT_OPTIONS} onChange={(n) => setSlideCount(Number(n))} />
          <p className="hint">
            Wybierz jedno szerokie zdjęcie — zostanie podzielone równo na slajdy w miejscach linii przerywanych. Przeciągnij, aby przesunąć kadr, kółkiem myszy przybliżysz.
          </p>
        </>
      ) : (
        <p className="hint">Każdy slajd ma własny układ i zdjęcia. Wybierz slajd na pasku slajdów.</p>
      )}
    </Section>
  )

  // A profile or summary has no photos: the tab shows only its own options.
  const seriesSlide = !panorama && activeSlide > 0 && <ThisSlideSection />
  if (!panorama && !slotCount(slide)) return seriesSlide || null

  return (
    <>
      {seriesSlide}
      <PhotoPool />
      {!collageMode && carouselSection}

      {!panorama && (
        <Section collapseId="layout" title={`${collageMode ? 'Podział kadru' : 'Układ'}${slides.length > 1 ? ` — slajd ${activeSlide + 1}` : ''}`}>
          <Segmented label="Rodzaj układów" value={group} options={GROUP_OPTIONS} onChange={setGroup} />
          <div className="layout-grid" role="group" aria-label="Układy zdjęć">
            {LAYOUTS.filter((l) => l.group === group && (layoutFits(l, format.w, format.h) || l.key === slide.layoutKey)).map((def) => (
              <LayoutThumb
                key={def.key}
                def={def}
                active={def.key === slide.layoutKey}
                slide={slide}
                photos={photoMap}
                size={thumbSize}
                onApply={() => apply(def.key)}
                onPreview={(on) => setPreviewLayout(on && def.key !== slide.layoutKey ? def.key : null)}
              />
            ))}
          </div>
          <p className="hint">Najedź na układ, aby zobaczyć go na kadrze. Zmiana układu zachowuje zdjęcia.</p>
        </Section>
        )}

      {hasPhotos && (
        <>
          {!panorama && (
            <>
              <Section title="Odstępy">
                <SliderField
                  label="Przerwa"
                  unit="px"
                  min={0}
                  max={60}
                  value={collage.gap}
                  defaultValue={DEFAULT_COLLAGE.gap}
                  onChange={(gap) => updateCollage({ gap })}
                />
                <SliderField
                  label="Margines"
                  unit="px"
                  min={0}
                  max={150}
                  value={collage.margin}
                  defaultValue={DEFAULT_COLLAGE.margin}
                  onChange={(margin) => updateCollage({ margin })}
                />
                <p className="hint">
                  Kolor lub gradient pod zdjęciami ustawisz w zakładce{' '}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setActiveTab('style')
                      setSubTab('style', 'background')
                    }}
                  >
                    Styl → Tło
                  </button>
                  .
                </p>
              </Section>

              <Section title="Ramka zdjęć">
                {!isCreative && (
                  <CheckboxField label="Ramka wokół zdjęć" checked={frame.enabled} onChange={(enabled) => updateFrame({ enabled })} />
                )}
                {showFrameControls && (
                  <>
                    <ColorField label="Kolor ramki" value={frame.color} onChange={(color) => updateFrame({ color })} />
                    <SliderField
                      label="Grubość"
                      unit="px"
                      min={4}
                      max={60}
                      value={frame.thickness}
                      defaultValue={DEFAULT_COLLAGE.frame.thickness}
                      onChange={(thickness) => updateFrame({ thickness })}
                    />
                    <Segmented label="Styl ramki" value={frame.style} options={FRAME_OPTIONS} onChange={(style) => updateFrame({ style })} />
                  </>
                )}
              </Section>
            </>
          )}

          {collageMode ? (
            <CropSection />
          ) : (
            <Section title="Dopasowanie">
              <Segmented label="Dopasowanie zdjęcia do slotu" value={collage.fit} options={FIT_OPTIONS} onChange={(fit) => updateCollage({ fit })} />
              {collage.fit === 'contain' && <p className="hint">W tym trybie zdjęcie jest widoczne w całości, więc nie da się go przesuwać ani przybliżać.</p>}
            </Section>
          )}
        </>
      )}

      {collageMode && (
        <>
          <Section title="Wyjście">
            {format.carousel ? (
              <Segmented label="Wyjście" value={slides.length > 1 ? 'carousel' : 'single'} options={OUTPUT_OPTIONS} onChange={(out) => {
                  // A collage turned into a carousel keeps its layout on the first slide.
                  if (out === 'carousel') setCarouselKind('slides')
                  setCarousel(out === 'carousel')
                }}
              />
            ) : (
              <p className="hint">Ten format ma jeden kadr. Karuzelę zrobisz w formacie Instagrama.</p>
            )}
          </Section>
          {carouselSection}
        </>
      )}
    </>
  )
}

// Wypełnij centres the photo over the slot, Dopasuj shows all of it, Ręcznie lets it be dragged
// and zoomed. It applies to the selected photo, or to all of them when none is selected.
function CropSection() {
  const slides = useAppStore((s) => s.slides)
  const fit = useAppStore((s) => s.collage.fit)
  const selection = useAppStore((s) => s.selection)
  const setCrop = useAppStore((s) => s.setCrop)
  const target = selection?.kind === 'slot' && slides[selection.slide]?.slots[selection.index] ? { slide: selection.slide, index: selection.index } : null
  const fallback: SlotCrop = fit === 'contain' ? 'fit' : 'manual'
  const crops = target ? [slides[target.slide].slots[target.index]] : slides.flatMap((sl) => Object.values(sl.slots))
  const current = crops.map((a) => a.crop ?? fallback)
  const value = current.every((c) => c === current[0]) ? current[0] : undefined

  return (
    <Section title="Przycinanie">
      <Segmented label={target ? 'Przytnij zaznaczone zdjęcie' : 'Przytnij wszystkie zdjęcia'} showLabel value={value ?? ('' as SlotCrop)} options={CROP_OPTIONS} onChange={(crop) => setCrop(crop, target)} />
      <p className="hint">
        {value === 'manual'
          ? 'Przeciągnij zdjęcie w slocie, aby je przesunąć; kółkiem myszy przybliżysz.'
          : target
            ? 'Kliknij puste miejsce obok kadru, aby ustawić wszystkie zdjęcia naraz.'
            : 'Kliknij zdjęcie na kadrze, aby przyciąć tylko je.'}
      </p>
    </Section>
  )
}
