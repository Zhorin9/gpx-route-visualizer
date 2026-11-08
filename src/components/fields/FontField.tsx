import { useTranslation } from 'react-i18next'
import { FONT_OPTIONS } from '../../utils/fonts'
import type { TKey } from '../../i18n'
import SelectField from './SelectField'

export default function FontField({ value, onChange }: { value: string; onChange: (font: string) => void }) {
  const { t } = useTranslation()
  return <SelectField label={t('fontField.font')} value={value} onChange={onChange} options={FONT_OPTIONS.map((o) => ({ ...o, group: o.group && t(o.group as TKey) }))} />
}
