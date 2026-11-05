import { useState } from 'react'
import CheckboxField from '../fields/CheckboxField'
import ColorField from '../fields/ColorField'
import FontField from '../fields/FontField'
import SelectField from '../fields/SelectField'
import SliderField from '../fields/SliderField'
import Button from '../ui/Button'
import Section from '../ui/Section'
import Segmented from '../ui/Segmented'
import useSlideScene from '../../hooks/useSlideScene'
import { useActiveSlide } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { slotCount } from '../../utils/layouts'
import { DEFAULT_BACKGROUND, slideLabel, slideKind, slideNumbers } from '../../utils/series'
import type { SelectOption, SlideBackground } from '../../types'

const BACKGROUND_OPTIONS: SelectOption<SlideBackground['source']>[] = [
  { value: 'style', label: 'Styl' },
  { value: 'color', label: 'Kolor' },
  { value: 'photo', label: 'Zdjęcie' },
]

export default function SlideStylePage() {
  const index = useActiveSlide()
  const slides = useAppStore((s) => s.slides)
  const mode = useAppStore((s) => s.mode)
  const updateSlide = useAppStore((s) => s.updateSlide)
  const applyBackgroundToKind = useAppStore((s) => s.applyBackgroundToKind)
  const { projectLook } = useSlideScene()
  const [confirming, setConfirming] = useState(false)
  const slide = slides[index]
  if (!slide || index === 0 || slideKind(slide) === 'photos') {
    return <p className="hint">Własne tło i kolory mają slajdy Profil i Podsumowanie. Zaznacz taki slajd na pasku slajdów. Zdjęcia biorą tło z zakładki Styl → Tło.</p>
  }
  const bg = slide.background ?? DEFAULT_BACKGROUND
  const look = slide.ownLook
  const setBg = (patch: Partial<SlideBackground>) => updateSlide(index, { background: { ...bg, ...patch } })
  const sameKind = slides.filter((s, i) => i > 0 && i !== index && slideKind(s) === slideKind(slide)).length
  const photoSlides = slides.flatMap((s, i) => (i > 0 && slotCount(s) && Object.keys(s.slots).length ? [i] : []))
  const numbers = slideNumbers(slides)

  return (
    <>
      <Section title={`Tło slajdu ${numbers[index] ?? '—'} · ${slideLabel(slide, index, mode)}`}>
        <Segmented label="Źródło tła" showLabel value={bg.source} options={BACKGROUND_OPTIONS} onChange={(source) => setBg({ source })} />
        {bg.source === 'color' && <ColorField label="Kolor tła" value={bg.color} onChange={(color) => setBg({ color })} />}
        {bg.source === 'photo' && (
          <>
            <SelectField
              label="Zdjęcie z"
              value={String(bg.fromSlide ?? '')}
              onChange={(v) => setBg({ fromSlide: v === '' ? null : Number(v) })}
              options={[
                { value: '', label: 'Pierwszego zdjęcia serii' },
                ...photoSlides.map((i) => ({ value: String(i), label: `Slajd ${numbers[i] ?? '—'} · ${slideLabel(slides[i], i, mode)}` })),
              ]}
            />
            <SliderField label="Rozmycie (0 = ostre zdjęcie)" unit="%" value={bg.blur} defaultValue={0} onChange={(blur) => setBg({ blur })} />
            <SliderField label="Przyciemnienie" unit="%" value={bg.dim} defaultValue={DEFAULT_BACKGROUND.dim} onChange={(dim) => setBg({ dim })} />
            <p className="hint">Przyciemnienie trzyma czytelność wykresu i tekstu na jasnym zdjęciu.</p>
          </>
        )}
        {sameKind > 0 && (
          <Button block onClick={() => applyBackgroundToKind(index)}>
            Zastosuj do slajdów tego typu ({sameKind})
          </Button>
        )}
      </Section>

      <Section title="Styl">
        <CheckboxField
          label="Ten slajd ma własny styl (wyjątek)"
          checked={!!look}
          onChange={(on) => (on ? updateSlide(index, { ownLook: projectLook }) : setConfirming(true))}
        />
        {look ? (
          <>
            <ColorField label="Papier" value={look.paper} onChange={(paper) => updateSlide(index, { ownLook: { ...look, paper } })} />
            <ColorField label="Tekst" value={look.ink} onChange={(ink) => updateSlide(index, { ownLook: { ...look, ink } })} />
            <ColorField label="Akcent" value={look.accent} onChange={(accent) => updateSlide(index, { ownLook: { ...look, accent } })} />
            <FontField value={look.font} onChange={(font) => updateSlide(index, { ownLook: { ...look, font } })} />
          </>
        ) : (
          <p className="hint">Slajd bierze kolory i czcionkę z projektu (tło, kolor trasy i czcionka tytułu), więc zmiany stylu projektu odświeżają go razem z resztą.</p>
        )}
        {confirming && (
          <div className="inline-confirm" role="alertdialog" aria-label="Wrócić do stylu projektu?">
            <span>Wrócić do stylu projektu? Własne kolory i czcionka tego slajdu zostaną odrzucone.</span>
            <div className="button-row">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Anuluj
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  updateSlide(index, { ownLook: undefined })
                  setConfirming(false)
                }}
              >
                Wróć do stylu projektu
              </Button>
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
