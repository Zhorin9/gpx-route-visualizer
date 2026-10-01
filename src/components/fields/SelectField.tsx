import { useId } from 'react'
import type { SelectOption } from '../../types'

export interface SelectFieldProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
}

export default function SelectField<T extends string>({ label, value, onChange, options }: SelectFieldProps<T>) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
