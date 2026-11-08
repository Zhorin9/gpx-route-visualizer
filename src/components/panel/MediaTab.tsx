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
import { LAYOUTS, layoutDef, layoutFits, slotCount, type LayoutDef } from '../../utils/layouts'
import ThisSlideSection from './ThisSlideSection'
import { CROP_OPTIONS } from './cropOptions'
import LayoutCells from '../LayoutCells'
import PhotoPool from './PhotoPool'
import { MAX_SLIDES, MIN_CAROUSEL_SLIDES } from '../../store/defaults'
import type { CarouselKind, FrameKind, LayoutGroup, LayoutKey, Photo, SelectOption, Slide, SlotCrop } from '../../types'
import type { TKey } from '../../i18n'
import { useTranslation } from 'react-i18next'
import PhotoLookSection from './PhotoLookSection'

const GROUP_OPTIONS: { value: LayoutGroup; label: TKey }[] = [
  { value: 'grid', label: 'mediaTab.groupGrid' },
  { value: 'creative', label: 'mediaTab.groupCreative' },
]

const CAROUSEL_KIND_OPTIONS: { value: CarouselKind; label: TKey }[] = [
  { value: 'panorama', label: 'mediaTab.onePhoto' },
  { value: 'slides', label: 'mediaTab.separateLayouts' },
]

const SLIDE_COUNT_OPTIONS: SelectOption<string>[] = Array.from({ length: MAX_SLIDES - MIN_CAROUSEL_SLIDES + 1 }, (_, i) => {
  const n = String(i + MIN_CAROUSEL_SLIDES)
  return { value: n, label: n }
})

const FRAME_OPTIONS: { value: FrameKind; label: TKey }[] = [
  { value: 'equal', label: 'mediaTab.frameEqual' },
  { value: 'polaroid', label: 'mediaTab.framePolaroid' },
]

const FIT_OPTIONS: { value: 'cover' | 'contain'; label: TKey }[] = [
  { value: 'cover', label: 'mediaTab.fitCover' },
  { value: 'contain', label: 'mediaTab.fitContain' },
]

const OUTPUT_OPTIONS: { value: 'single' | 'carousel'; label: TKey }[] = [
  { value: 'single', label: 'mediaTab.single' },
  { value: 'carousel', label: 'mediaTab.carousel' },
]

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
  const { t } = useTranslation()
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
        <LayoutCells def={def} slide={slide} photos={photos} width={size.w} height={size.h} margin={3} outlineFramed />
      </span>
      <span className="layout-thumb-label">{t(def.label)}</span>
    </button>
  )
}

export default function MediaTab() {
  const { t } = useTranslation()
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
    <Section title={t('mediaTab.carousel')}>
      <Segmented label={t('mediaTab.splitMode')} showLabel value={carouselKind} options={CAROUSEL_KIND_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={setCarouselKind} />
      {panorama ? (
        <>
          <Segmented label={t('mediaTab.slideCount')} showLabel value={String(slides.length)} options={SLIDE_COUNT_OPTIONS} onChange={(n) => setSlideCount(Number(n))} />
          <p className="hint">
            {t('mediaTab.panoramaHint')}
          </p>
        </>
      ) : (
        <p className="hint">{t('mediaTab.slidesHint')}</p>
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
        <Section collapseId="layout" title={`${collageMode ? t('mediaTab.frameSplit') : t('mediaTab.layout')}${slides.length > 1 ? t('mediaTab.slideSuffix', { n: activeSlide + 1 }) : ''}`}>
          <Segmented label={t('mediaTab.layoutGroup')} value={group} options={GROUP_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={setGroup} />
          <div className="layout-grid" role="group" aria-label={t('mediaTab.photoLayouts')}>
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
          <p className="hint">{t('mediaTab.layoutHint')}</p>
        </Section>
        )}

      {hasPhotos && (
        <>
          {!panorama && (
            <>
              <Section title={t('mediaTab.spacing')}>
                <SliderField
                  label={t('mediaTab.gap')}
                  unit="px"
                  min={0}
                  max={60}
                  value={collage.gap}
                  defaultValue={DEFAULT_COLLAGE.gap}
                  onChange={(gap) => updateCollage({ gap })}
                />
                <SliderField
                  label={t('mediaTab.margin')}
                  unit="px"
                  min={0}
                  max={150}
                  value={collage.margin}
                  defaultValue={DEFAULT_COLLAGE.margin}
                  onChange={(margin) => updateCollage({ margin })}
                />
                <p className="hint">
                  {t('mediaTab.backgroundHint')}{' '}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setActiveTab('style')
                      setSubTab('style', 'background')
                    }}
                  >
                    {t('mediaTab.styleBackground')}
                  </button>
                  .
                </p>
              </Section>

              <Section title={t('mediaTab.frame')}>
                {!isCreative && (
                  <CheckboxField label={t('mediaTab.frameAround')} checked={frame.enabled} onChange={(enabled) => updateFrame({ enabled })} />
                )}
                {showFrameControls && (
                  <>
                    <ColorField label={t('mediaTab.frameColor')} value={frame.color} onChange={(color) => updateFrame({ color })} />
                    <SliderField
                      label={t('mediaTab.thickness')}
                      unit="px"
                      min={4}
                      max={60}
                      value={frame.thickness}
                      defaultValue={DEFAULT_COLLAGE.frame.thickness}
                      onChange={(thickness) => updateFrame({ thickness })}
                    />
                    <Segmented label={t('mediaTab.frameStyle')} value={frame.style} options={FRAME_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(style) => updateFrame({ style })} />
                  </>
                )}
              </Section>
            </>
          )}

          {collageMode ? (
            <CropSection />
          ) : (
            <Section title={t('mediaTab.fit')}>
              <Segmented label={t('mediaTab.fitLabel')} value={collage.fit} options={FIT_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(fit) => updateCollage({ fit })} />
              {collage.fit === 'contain' && <p className="hint">{t('mediaTab.containHint')}</p>}
            </Section>
          )}
          <PhotoLookSection />
        </>
      )}

      {collageMode && (
        <>
          <Section title={t('mediaTab.output')}>
            {format.carousel ? (
              <Segmented label={t('mediaTab.output')} value={slides.length > 1 ? 'carousel' : 'single'} options={OUTPUT_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(out) => setCarousel(out === 'carousel')} />
            ) : (
              <p className="hint">{t('mediaTab.singleFrameHint')}</p>
            )}
          </Section>
          {carouselSection}
        </>
      )}
    </>
  )
}

function CropSection() {
  const { t } = useTranslation()
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
    <Section title={t('mediaTab.crop')}>
      <Segmented label={target ? t('mediaTab.cropSelected') : t('mediaTab.cropAll')} showLabel value={value ?? ('' as SlotCrop)} options={CROP_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} onChange={(crop) => setCrop(crop, target)} />
      <p className="hint">
        {value === 'manual'
          ? t('mediaTab.cropManualHint')
          : target
            ? t('mediaTab.cropAllHint')
            : t('mediaTab.cropOneHint')}
      </p>
    </Section>
  )
}
