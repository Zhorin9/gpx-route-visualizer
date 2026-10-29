import CheckboxField from '../fields/CheckboxField'
import Section from '../ui/Section'
import { FORMATS } from '../../core/formats/registry'
import { useActiveSlide, usePanorama } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import { slideNumbers } from '../../utils/series'
import { WRAPPER_OPTIONS } from '../../utils/wrappers'

// Styl → Opakowanie: the form every slide takes. Its fields are edited in Teksty.
export default function WrapperSection() {
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
    <Section title="Opakowanie">
      <div className="wrapper-grid" role="radiogroup" aria-label="Opakowanie">
        {WRAPPER_OPTIONS.map(({ id, label }) => (
          <button key={id} type="button" role="radio" aria-checked={wrapper.id === id} className={wrapper.id === id ? 'wrapper-option active' : 'wrapper-option'} onClick={() => setWrapper(id)}>
            <span className={`wrapper-thumb wrapper-thumb-${id}`} style={{ aspectRatio: `${w} / ${h}` }} />
            {label}
          </button>
        ))}
      </div>
      {wrapper.id === 'postmark' && (
        <>
          <CheckboxField label="Na wszystkich slajdach" checked={wrapper.postmark.all} onChange={(all) => updateWrapper({ postmark: { all } })} />
          <p className="hint">Przeciągnij stempel na podglądzie, aby go przesunąć.</p>
        </>
      )}
      {on && panorama && wrapper.id !== 'postmark' && <p className="hint">Panorama biegnie przez wszystkie slajdy, więc zostaje bez opakowania.</p>}
      {on && slides.length > 1 && !panorama && (
        <CheckboxField
          label={`Bez opakowania na slajdzie ${slideNumbers(slides)[index] ?? '—'}`}
          checked={!!slides[index].wrapperOff}
          onChange={(off) => updateSlide(index, { wrapperOff: off || undefined })}
        />
      )}
      <p className="hint">Pola (miejsce, data, notatka) edytujesz w zakładce Teksty.</p>
    </Section>
  )
}
