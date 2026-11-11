import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import type { SlideBackground } from '../../types'
import type { TKey } from '../../i18n'

const BACKGROUND_OPTIONS: { value: SlideBackground['source']; label: TKey }[] = [
  { value: 'style', label: 'slideStylePage.sourceStyle' },
  { value: 'color', label: 'slideStylePage.sourceColor' },
  { value: 'photo', label: 'slideStylePage.sourcePhoto' },
]

export default function SlideStylePage() {
  const { t } = useTranslation()
  const index = useActiveSlide()
  const slides = useAppStore((s) => s.slides)
  const mode = useAppStore((s) => s.mode)
  const updateSlide = useAppStore((s) => s.updateSlide)
  const applyBackgroundToKind = useAppStore((s) => s.applyBackgroundToKind)
  const { projectLook } = useSlideScene()
  const [confirming, setConfirming] = useState(false)
  const slide = slides[index]
  if (!slide || index === 0 || slideKind(slide) === 'photos') {
    return <p className="hint">{t('slideStylePage.unsupportedHint')}</p>
  }
  const bg = slide.background ?? DEFAULT_BACKGROUND
  const look = slide.ownLook
  const setBg = (patch: Partial<SlideBackground>) => updateSlide(index, { background: { ...bg, ...patch } })
  const sameKind = slides.filter((s, i) => i > 0 && i !== index && slideKind(s) === slideKind(slide)).length
  const photoSlides = slides.flatMap((s, i) => (i > 0 && slotCount(s) && Object.keys(s.slots).length ? [i] : []))
  const numbers = slideNumbers(slides)

  return (
    <>
      <Section title={t('slideStylePage.backgroundTitle', { n: numbers[index] ?? '—', name: slideLabel(slide, index, mode) })}>
        <Segmented
          label={t('slideStylePage.backgroundSource')}
          showLabel
          value={bg.source}
          options={BACKGROUND_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
          onChange={(source) => setBg({ source })}
        />
        {bg.source === 'color' && <ColorField label={t('slideStylePage.backgroundColor')} value={bg.color} onChange={(color) => setBg({ color })} />}
        {bg.source === 'photo' && (
          <>
            <SelectField
              label={t('slideStylePage.photoFrom')}
              value={String(bg.fromSlide ?? '')}
              onChange={(v) => setBg({ fromSlide: v === '' ? null : Number(v) })}
              options={[
                { value: '', label: t('slideStylePage.firstPhoto') },
                ...photoSlides.map((i) => ({ value: String(i), label: t('slideStylePage.slideOption', { n: numbers[i] ?? '—', name: slideLabel(slides[i], i, mode) }) })),
              ]}
            />
            <SliderField label={t('slideStylePage.blur')} unit="%" value={bg.blur} defaultValue={0} onChange={(blur) => setBg({ blur })} />
            <SliderField label={t('slideStylePage.dim')} unit="%" value={bg.dim} defaultValue={DEFAULT_BACKGROUND.dim} onChange={(dim) => setBg({ dim })} />
            <p className="hint">{t('slideStylePage.dimHint')}</p>
          </>
        )}
        {sameKind > 0 && (
          <Button block onClick={() => applyBackgroundToKind(index)}>
            {t('slideStylePage.applyToKind', { n: sameKind })}
          </Button>
        )}
      </Section>

      <Section title={t('slideStylePage.style')}>
        <CheckboxField
          label={t('slideStylePage.ownLook')}
          checked={!!look}
          onChange={(on) => (on ? updateSlide(index, { ownLook: projectLook }) : setConfirming(true))}
        />
        {look ? (
          <>
            <ColorField label={t('slideStylePage.paper')} value={look.paper} onChange={(paper) => updateSlide(index, { ownLook: { ...look, paper } })} />
            <ColorField label={t('slideStylePage.text')} value={look.ink} onChange={(ink) => updateSlide(index, { ownLook: { ...look, ink } })} />
            <ColorField label={t('slideStylePage.accent')} value={look.accent} onChange={(accent) => updateSlide(index, { ownLook: { ...look, accent } })} />
            <FontField value={look.font} onChange={(font) => updateSlide(index, { ownLook: { ...look, font } })} />
          </>
        ) : (
          <p className="hint">{t('slideStylePage.projectLookHint')}</p>
        )}
        {confirming && (
          <div className="inline-confirm" role="alertdialog" aria-label={t('slideStylePage.revertQuestion')}>
            <span>{t('slideStylePage.revertConfirm')}</span>
            <div className="button-row">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  updateSlide(index, { ownLook: undefined })
                  setConfirming(false)
                }}
              >
                {t('slideStylePage.revert')}
              </Button>
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
