import { useId } from 'react'

export interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  // Lets Enter start a new line.
  multiline?: boolean
}

export default function TextField({ label, value, onChange, placeholder, multiline }: TextFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={Math.max(2, value.split('\n').length)} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}
