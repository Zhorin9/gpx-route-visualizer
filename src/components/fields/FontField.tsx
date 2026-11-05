import { FONT_OPTIONS } from '../../utils/fonts'
import SelectField from './SelectField'

export default function FontField({ value, onChange }: { value: string; onChange: (font: string) => void }) {
  return <SelectField label="Czcionka" value={value} onChange={onChange} options={FONT_OPTIONS} />
}
