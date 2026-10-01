import type { SelectOption } from '../../types'

export interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  // Shows the label above the control; otherwise it's only exposed to screen readers.
  showLabel?: boolean
  disabled?: boolean
}

export default function Segmented<T extends string>({ label, value, options, onChange, showLabel = false, disabled }: SegmentedProps<T>) {
  return (
    <div className="field">
      {showLabel && <span className="field-label">{label}</span>}
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={opt.value === value}
            className={opt.value === value ? 'segment active' : 'segment'}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
