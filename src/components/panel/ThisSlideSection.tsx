import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CheckboxField from '../fields/CheckboxField'
import SliderField from '../fields/SliderField'
import TextField from '../fields/TextField'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import useSlideScene from '../../hooks/useSlideScene'
import { useActiveSlide } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { markerText } from '../../utils/drawSlide'
import { DEFAULT_FIGURES, DEFAULT_OVERLAYS, FIGURE_LABELS, SUMMARY_FIGURES, applyTargets, slideLabel, slideKind, slideNumbers, slidePlace, type ApplyChoice, type PlaceSource } from '../../utils/series'
import { CROP_OPTIONS } from './cropOptions'
import type { FigureSize, MiniMap, Slide } from '../../types'
import type { TKey } from '../../i18n'

const MINI_MAP_OPTIONS: { value: MiniMap; label: TKey }[] = [
  { value: 'off', label: 'thisSlideSection.off' },
  { value: 'corner', label: 'thisSlideSection.miniMapCorner' },
  { value: 'large', label: 'thisSlideSection.miniMapLarge' },
]

const MARKER_OPTIONS: { value: 'off' | 'on'; label: TKey }[] = [
  { value: 'off', label: 'thisSlideSection.off' },
  { value: 'on', label: 'thisSlideSection.marker' },
]

const SOURCE_LABELS: Record<PlaceSource, TKey> = { gps: 'thisSlideSection.sourceGps', time: 'thisSlideSection.sourceTime', manual: 'thisSlideSection.sourceManual' }

const SIZE_OPTIONS: { value: FigureSize; label: TKey }[] = [
  { value: 'small', label: 'thisSlideSection.sizeSmall' },
  { value: 'medium', label: 'thisSlideSection.sizeMedium' },
  { value: 'large', label: 'thisSlideSection.sizeLarge' },
]

function ApplyDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const { t } = useTranslation()
  const slides = useAppStore((s) => s.slides)
  const applyToPhotoSlides = useAppStore((s) => s.applyToPhotoSlides)
  const [choice, setChoice] = useState<ApplyChoice>({ miniMap: true, marker: true, crop: false })
  const slide = slides[index]
  const overlays = slide.overlays ?? DEFAULT_OVERLAYS
  const crop = slide.slots[0]?.crop ?? 'fill'
  const count = applyTargets(slides, index).length

  return (
    <Dialog title={t('thisSlideSection.applyTitle')} onClose={onClose}>
      <CheckboxField
        label={t('thisSlideSection.applyMiniMap', { value: t(MINI_MAP_OPTIONS.find((o) => o.value === overlays.miniMap)!.label).toLowerCase() })}
        checked={choice.miniMap}
        onChange={(miniMap) => setChoice({ ...choice, miniMap })}
      />
      <CheckboxField
        label={t('thisSlideSection.applyMarker', { value: overlays.marker ? t('thisSlideSection.onShort') : t('thisSlideSection.offShort') })}
        checked={choice.marker}
        onChange={(marker) => setChoice({ ...choice, marker })}
      />
      <CheckboxField
        label={t('thisSlideSection.applyCrop', { value: t(CROP_OPTIONS.find((o) => o.value === crop)!.label).toLowerCase() })}
        checked={choice.crop}
        onChange={(on) => setChoice({ ...choice, crop: on })}
      />
      <p className="hint">{t('thisSlideSection.applyHint', { count })}</p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          disabled={!count || !(choice.miniMap || choice.marker || choice.crop)}
          onClick={() => {
            applyToPhotoSlides(index, choice)
            onClose()
          }}
        >
          {t('thisSlideSection.applyTo', { n: count })}
        </Button>
      </div>
    </Dialog>
  )
}

function PhotoSlideFields({ slide, index }: { slide: Slide; index: number }) {
  const { t } = useTranslation()
  const updateSlide = useAppStore((s) => s.updateSlide)
  const { route, photos, units } = useSlideScene()
  const [applying, setApplying] = useState(false)
  const place = slidePlace(slide, photos, route?.points ?? null)
  const overlays = slide.overlays ?? DEFAULT_OVERLAYS
  const photo = photos.get(slide.slots[0]?.photoId ?? -1)
  const crop = slide.slots[0]?.crop ?? 'fill'

  return (
    <>
      {photo && (
        <div className="slide-photo-row">
          <span>{photo.name}</span>
          <span className="text-muted">{place && route ? `${markerText(route, place.index, units)} · ${t(SOURCE_LABELS[place.source])}` : t('thisSlideSection.noPlace')}</span>
        </div>
      )}
      <Segmented
        label={t('thisSlideSection.crop')}
        showLabel
        value={crop}
        options={CROP_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={(c) => updateSlide(index, { slots: Object.fromEntries(Object.entries(slide.slots).map(([k, a]) => [k, { ...a, crop: c }])) })}
      />
      {route ? (
        <>
          <SliderField
            label={t('thisSlideSection.placeOnRoute')}
            unit={units === 'imperial' ? 'mi' : 'km'}
            min={0}
            max={Math.round(route.totalKm * 10) / 10}
            step={0.1}
            value={Math.round(route.cumKm[place?.index ?? 0] * 10) / 10}
            onChange={(km) => updateSlide(index, { place: firstIndexAtKm(route.cumKm, km) })}
          />
          {slide.place != null ? (
            <button type="button" className="link-btn" onClick={() => updateSlide(index, { place: undefined })}>
              {t('thisSlideSection.backToExif')}
            </button>
          ) : (
            !place && <p className="hint">{t('thisSlideSection.noMatchHint')}</p>
          )}
        </>
      ) : (
        <p className="hint">{t('thisSlideSection.needsRouteHint')}</p>
      )}
      <fieldset className="panel-fieldset" disabled={!place}>
        <Segmented
          label={t('thisSlideSection.miniMap')}
          showLabel
          value={overlays.miniMap}
          options={MINI_MAP_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
          onChange={(miniMap) => updateSlide(index, { overlays: { ...overlays, miniMap } })}
        />
        <Segmented
          label={t('thisSlideSection.kmAndElevation')}
          showLabel
          value={overlays.marker ? 'on' : 'off'}
          options={MARKER_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
          onChange={(v) => updateSlide(index, { overlays: { ...overlays, marker: v === 'on' } })}
        />
      </fieldset>
      <Button block onClick={() => setApplying(true)}>
        {t('thisSlideSection.applyToAll')}
      </Button>
      {applying && <ApplyDialog index={index} onClose={() => setApplying(false)} />}
    </>
  )
}

function firstIndexAtKm(cumKm: Float64Array, km: number): number {
  let lo = 0
  let hi = cumKm.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cumKm[mid] < km) lo = mid + 1
    else hi = mid
  }
  return lo
}

function SummaryFields({ slide, index }: { slide: Slide; index: number }) {
  const { t } = useTranslation()
  const updateSlide = useAppStore((s) => s.updateSlide)
  const figures = slide.figures ?? DEFAULT_FIGURES
  return (
    <>
      <span className="field-label">{t('thisSlideSection.figures')}</span>
      {SUMMARY_FIGURES.map((f) => (
        <CheckboxField
          key={f}
          label={t(FIGURE_LABELS[f])}
          checked={figures.includes(f)}
          onChange={(on) => updateSlide(index, { figures: SUMMARY_FIGURES.filter((x) => (x === f ? on : figures.includes(x))) })}
        />
      ))}
      <Segmented
        label={t('thisSlideSection.figureSize')}
        showLabel
        value={slide.figureSize ?? 'medium'}
        options={SIZE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={(figureSize) => updateSlide(index, { figureSize })}
      />
      {figures.length > 4 && <p className="hint">{t('thisSlideSection.figuresHint')}</p>}
      <TextField label={t('thisSlideSection.question')} multiline value={slide.question ?? ''} placeholder={t('thisSlideSection.questionPlaceholder')} onChange={(question) => updateSlide(index, { question })} />
    </>
  )
}

export default function ThisSlideSection() {
  const { t } = useTranslation()
  const index = useActiveSlide()
  const slides = useAppStore((s) => s.slides)
  const mode = useAppStore((s) => s.mode)
  const updateSlide = useAppStore((s) => s.updateSlide)
  const duplicateSlide = useAppStore((s) => s.duplicateSlide)
  const { route } = useSlideScene()
  const slide = slides[index]
  const kind = slideKind(slide)
  const n = slideNumbers(slides)[index]
  const total = slideNumbers(slides).filter((x) => x != null).length

  return (
    <Section title={t('thisSlideSection.title', { name: slideLabel(slide, index, mode), n: n ?? '—', total })}>
      {kind === 'photos' && <PhotoSlideFields slide={slide} index={index} />}
      {kind === 'profile' && (
        <>
          <CheckboxField label={t('thisSlideSection.highlightClimb')} checked={slide.climb !== false} onChange={(climb) => updateSlide(index, { climb })} />
          {route?.hardestClimb == null && <p className="hint">{t('thisSlideSection.noClimb')}</p>}
        </>
      )}
      {kind === 'summary' && <SummaryFields slide={slide} index={index} />}
      {kind !== 'photos' && <p className="hint">{t('thisSlideSection.styleHint')}</p>}
      <Button variant="ghost" onClick={() => duplicateSlide(index)}>
        {t('thisSlideSection.duplicate')}
      </Button>
    </Section>
  )
}
