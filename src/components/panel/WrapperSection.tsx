import { useTranslation } from 'react-i18next'
import CheckboxField from '../fields/CheckboxField'
import Section from '../ui/Section'
import { FORMATS } from '../../core/formats/registry'
import { useActiveSlide, usePanorama } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { slideNumbers } from '../../utils/series'
import { WRAPPER_OPTIONS } from '../../utils/wrappers'
import './WrapperSection.css'

export default function WrapperSection() {
  const { t } = useTranslation()
  const wrapper = useAppStore((s) => s.wrapper)
  const slides = useAppStore((s) => s.slides)
  const { w, h } = useAppStore((s) => FORMATS[s.aspectKey])
  const setWrapper = useAppStore((s) => s.setWrapper)
  const updateWrapper = useAppStore((s) => s.updateWrapper)
  const updateSlide = useAppStore((s) => s.updateSlide)
  const index = useActiveSlide()
  const panorama = usePanorama()
  const on = wrapper.id !== 'none'

  return (
    <Section title={t('wrapperSection.title')}>
      <div className="layout-grid" role="radiogroup" aria-label={t('wrapperSection.title')}>
        {WRAPPER_OPTIONS.map(({ id, label }) => (
          <button key={id} type="button" role="radio" aria-checked={wrapper.id === id} className={wrapper.id === id ? 'wrapper-option active' : 'wrapper-option'} onClick={() => setWrapper(id)}>
            <span className={`wrapper-thumb wrapper-thumb-${id}`} style={{ aspectRatio: `${w} / ${h}` }} />
            {t(label)}
          </button>
        ))}
      </div>
      {wrapper.id === 'postmark' && (
        <>
          <CheckboxField label={t('wrapperSection.allSlides')} checked={wrapper.postmark.all} onChange={(all) => updateWrapper({ postmark: { all } })} />
          <p className="hint">{t('wrapperSection.postmarkHint')}</p>
        </>
      )}
      {on && panorama && wrapper.id !== 'postmark' && <p className="hint">{t('wrapperSection.panoramaHint')}</p>}
      {on && slides.length > 1 && !panorama && (
        <CheckboxField
          label={t('wrapperSection.offOnSlide', { n: slideNumbers(slides)[index] ?? '—' })}
          checked={!!slides[index].wrapperOff}
          onChange={(off) => updateSlide(index, { wrapperOff: off || undefined })}
        />
      )}
      <p className="hint">{t('wrapperSection.fieldsHint')}</p>
    </Section>
  )
}
