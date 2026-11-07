import SelectField from '../fields/SelectField'
import SliderField from '../fields/SliderField'
import Section from '../ui/Section'
import { useAppStore } from '../../store/useAppStore'
import { PHOTO_GRADES } from '../../utils/photoLook'

export default function PhotoLookSection() {
  const look = useAppStore((s) => s.photoLook)
  const update = useAppStore((s) => s.updatePhotoLook)
  return (
    <Section title="Wygląd zdjęć">
      <SelectField label="Korekta" value={look.grade} options={PHOTO_GRADES} onChange={(grade) => update({ grade })} />
      <SliderField label="Spłowiałe czernie" unit="%" value={look.fade} defaultValue={0} onChange={(fade) => update({ fade })} />
      <SliderField label="Ziarno" unit="%" value={look.grain} defaultValue={0} onChange={(grain) => update({ grain })} />
      <p className="hint">Jak film: na wszystkich zdjęciach w kadrze, w tle slajdów i w znacznikach miejsc.</p>
    </Section>
  )
}
