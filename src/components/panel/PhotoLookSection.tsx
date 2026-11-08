import CheckboxField from '../fields/CheckboxField'
import SelectField from '../fields/SelectField'
import SliderField from '../fields/SliderField'
import Section from '../ui/Section'
import { useAppStore } from '../../store/useAppStore'
import { isPlainLook, NO_PHOTO_LOOK, PHOTO_GRADES, type PhotoLook } from '../../utils/photoLook'

const FIRST_LOOK: PhotoLook = { grade: 'warm', fade: 0, grain: 20 }

export default function PhotoLookSection() {
  const look = useAppStore((s) => s.photoLook)
  const update = useAppStore((s) => s.updatePhotoLook)
  const on = !isPlainLook(look)
  return (
    <Section title="Wygląd zdjęć">
      <CheckboxField label="Wygląd filmu na zdjęciach" checked={on} onChange={(next) => update(next ? FIRST_LOOK : NO_PHOTO_LOOK)} />
      {on ? (
        <>
          <SelectField label="Korekta" value={look.grade === 'none' ? 'warm' : look.grade} options={PHOTO_GRADES} onChange={(grade) => update({ grade })} />
          <SliderField label="Spłowiałe czernie" unit="%" value={look.fade} defaultValue={0} onChange={(fade) => update({ fade })} />
          <SliderField label="Ziarno" unit="%" value={look.grain} defaultValue={0} onChange={(grain) => update({ grain })} />
        </>
      ) : (
        <p className="hint">Zdjęcia zostają takie, jak je wgrałeś. Włącz, żeby dodać korektę koloru i ziarno jak na filmie.</p>
      )}
    </Section>
  )
}
