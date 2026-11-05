import { useState } from 'react'
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
import { plural } from '../../utils/format'
import { markerText } from '../../utils/drawSlide'
import { DEFAULT_FIGURES, DEFAULT_OVERLAYS, FIGURE_LABELS, SUMMARY_FIGURES, applyTargets, slideLabel, slideKind, slideNumbers, slidePlace, type ApplyChoice, type PlaceSource } from '../../utils/series'
import { CROP_OPTIONS } from './cropOptions'
import type { FigureSize, MiniMap, SelectOption, Slide } from '../../types'

const MINI_MAP_OPTIONS: SelectOption<MiniMap>[] = [
  { value: 'off', label: 'Wył.' },
  { value: 'corner', label: 'Róg' },
  { value: 'large', label: 'Duża' },
]

const MARKER_OPTIONS: SelectOption<'off' | 'on'>[] = [
  { value: 'off', label: 'Wył.' },
  { value: 'on', label: 'Znacznik' },
]

const SOURCE_LABELS: Record<PlaceSource, string> = { gps: 'z EXIF (miejsce)', time: 'z EXIF (czas)', manual: 'ustawione ręcznie' }

const SIZE_OPTIONS: SelectOption<FigureSize>[] = [
  { value: 'small', label: 'Małe' },
  { value: 'medium', label: 'Średnie' },
  { value: 'large', label: 'Duże' },
]

function ApplyDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const slides = useAppStore((s) => s.slides)
  const applyToPhotoSlides = useAppStore((s) => s.applyToPhotoSlides)
  const [choice, setChoice] = useState<ApplyChoice>({ miniMap: true, marker: true, crop: false })
  const slide = slides[index]
  const overlays = slide.overlays ?? DEFAULT_OVERLAYS
  const crop = slide.slots[0]?.crop ?? 'fill'
  const count = applyTargets(slides, index).length

  return (
    <Dialog title="Zastosować do slajdów ze zdjęciami?" onClose={onClose}>
      <CheckboxField label={`Mini-mapa: ${MINI_MAP_OPTIONS.find((o) => o.value === overlays.miniMap)?.label.toLowerCase()}`} checked={choice.miniMap} onChange={(miniMap) => setChoice({ ...choice, miniMap })} />
      <CheckboxField label={`Znacznik kilometra i wysokości: ${overlays.marker ? 'wł.' : 'wył.'}`} checked={choice.marker} onChange={(marker) => setChoice({ ...choice, marker })} />
      <CheckboxField label={`Kadrowanie: ${CROP_OPTIONS.find((o) => o.value === crop)?.label.toLowerCase()}`} checked={choice.crop} onChange={(on) => setChoice({ ...choice, crop: on })} />
      <p className="hint">
        Dotyczy {count} {plural(count, 'slajdu', 'slajdów', 'slajdów')} ze zdjęciami. Mapa, profil i podsumowanie pozostają bez zmian. Wyjątki ze stylem własnym są pomijane.
      </p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          Anuluj
        </Button>
        <Button
          variant="primary"
          disabled={!count || !(choice.miniMap || choice.marker || choice.crop)}
          onClick={() => {
            applyToPhotoSlides(index, choice)
            onClose()
          }}
        >
          Zastosuj do {count}
        </Button>
      </div>
    </Dialog>
  )
}

function PhotoSlideFields({ slide, index }: { slide: Slide; index: number }) {
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
          <span className="text-muted">{place && route ? `${markerText(route, place.index, units)} · ${SOURCE_LABELS[place.source]}` : 'bez miejsca na trasie'}</span>
        </div>
      )}
      <Segmented
        label="Kadrowanie"
        showLabel
        value={crop}
        options={CROP_OPTIONS}
        onChange={(c) => updateSlide(index, { slots: Object.fromEntries(Object.entries(slide.slots).map(([k, a]) => [k, { ...a, crop: c }])) })}
      />
      {route ? (
        <>
          <SliderField
            label="Miejsce na trasie"
            unit={units === 'imperial' ? 'mi' : 'km'}
            min={0}
            max={Math.round(route.totalKm * 10) / 10}
            step={0.1}
            value={Math.round(route.cumKm[place?.index ?? 0] * 10) / 10}
            onChange={(km) => updateSlide(index, { place: firstIndexAtKm(route.cumKm, km) })}
          />
          {slide.place != null ? (
            <button type="button" className="link-btn" onClick={() => updateSlide(index, { place: undefined })}>
              Wróć do miejsca z EXIF
            </button>
          ) : (
            !place && <p className="hint">Zdjęcie nie ma miejsca ani czasu zgodnego z trasą. Przesuń suwak, aby je dopasować.</p>
          )}
        </>
      ) : (
        <p className="hint">Mini-mapa i kilometr potrzebują trasy: wgraj GPX w zakładce Mapa.</p>
      )}
      <fieldset className="panel-fieldset" disabled={!place}>
        <Segmented label="Mini-mapa" showLabel value={overlays.miniMap} options={MINI_MAP_OPTIONS} onChange={(miniMap) => updateSlide(index, { overlays: { ...overlays, miniMap } })} />
        <Segmented
          label="Kilometr i wysokość"
          showLabel
          value={overlays.marker ? 'on' : 'off'}
          options={MARKER_OPTIONS}
          onChange={(v) => updateSlide(index, { overlays: { ...overlays, marker: v === 'on' } })}
        />
      </fieldset>
      <Button block onClick={() => setApplying(true)}>
        Zastosuj do wszystkich…
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
  const updateSlide = useAppStore((s) => s.updateSlide)
  const figures = slide.figures ?? DEFAULT_FIGURES
  return (
    <>
      <span className="field-label">Liczby na slajdzie</span>
      {SUMMARY_FIGURES.map((f) => (
        <CheckboxField
          key={f}
          label={FIGURE_LABELS[f]}
          checked={figures.includes(f)}
          onChange={(on) => updateSlide(index, { figures: SUMMARY_FIGURES.filter((x) => (x === f ? on : figures.includes(x))) })}
        />
      ))}
      <Segmented label="Wielkość liczb" showLabel value={slide.figureSize ?? 'medium'} options={SIZE_OPTIONS} onChange={(figureSize) => updateSlide(index, { figureSize })} />
      {figures.length > 4 && <p className="hint">Przy więcej niż czterech liczbach slajd układa je w dwóch kolumnach i zmniejsza, jeśli się nie mieszczą.</p>}
      <TextField label="Pytanie do odbiorców" multiline value={slide.question ?? ''} placeholder="Np. Który odcinek byłby dla Ciebie największym wyzwaniem?" onChange={(question) => updateSlide(index, { question })} />
    </>
  )
}

export default function ThisSlideSection() {
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
    <Section title={`Ten slajd · ${slideLabel(slide, index, mode)} ${n ?? '—'} z ${total}`}>
      {kind === 'photos' && <PhotoSlideFields slide={slide} index={index} />}
      {kind === 'profile' && (
        <>
          <CheckboxField label="Wyróżnij najtrudniejszy podjazd" checked={slide.climb !== false} onChange={(climb) => updateSlide(index, { climb })} />
          {route?.hardestClimb == null && <p className="hint">Na tej trasie nie ma podjazdu do wyróżnienia.</p>}
        </>
      )}
      {kind === 'summary' && <SummaryFields slide={slide} index={index} />}
      {kind !== 'photos' && <p className="hint">Tło i kolory tego slajdu zmienisz w zakładce Styl → Ten slajd.</p>}
      <Button variant="ghost" onClick={() => duplicateSlide(index)}>
        Duplikuj slajd
      </Button>
    </Section>
  )
}
