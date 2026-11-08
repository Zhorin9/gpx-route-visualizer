import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  return (
    <Section title={t('photoLookSection.title')}>
      <CheckboxField label={t('photoLookSection.filmLook')} checked={on} onChange={(next) => update(next ? FIRST_LOOK : NO_PHOTO_LOOK)} />
      {on ? (
        <>
          <SelectField label={t('photoLookSection.grade')} value={look.grade === 'none' ? 'warm' : look.grade} options={PHOTO_GRADES.map((g) => ({ ...g, label: t(g.label) }))} onChange={(grade) => update({ grade })} />
          <SliderField label={t('photoLookSection.fade')} unit="%" value={look.fade} defaultValue={0} onChange={(fade) => update({ fade })} />
          <SliderField label={t('photoLookSection.grain')} unit="%" value={look.grain} defaultValue={0} onChange={(grain) => update({ grain })} />
        </>
      ) : (
        <p className="hint">{t('photoLookSection.offHint')}</p>
      )}
    </Section>
  )
}
