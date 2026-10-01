export interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function CheckboxField({ label, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <label className={disabled ? 'field checkbox is-disabled' : 'field checkbox'}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
