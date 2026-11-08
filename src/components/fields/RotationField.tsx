import { useTranslation } from 'react-i18next'
import SliderField from './SliderField'

export default function RotationField({ value, onChange }: { value: number; onChange: (degrees: number) => void }) {
  const { t } = useTranslation()
  return <SliderField label={t('rotationField.rotation')} unit="°" min={-180} max={180} value={value} defaultValue={0} snapPoints={[0, -90, 90]} onChange={onChange} />
}
