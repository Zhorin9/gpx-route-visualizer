import { useId, useState } from 'react'

export interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  // Double-clicking the slider restores this value.
  defaultValue?: number
  // Values the slider snaps to when released within `snapTolerance` of them.
  snapPoints?: number[]
  snapTolerance?: number
  disabled?: boolean
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  defaultValue,
  snapPoints,
  snapTolerance = 3,
  disabled,
}: SliderFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  function snap(v: number) {
    const hit = snapPoints?.find((p) => Math.abs(p - v) <= snapTolerance)
    return hit ?? v
  }

  function commitDraft() {
    if (draft == null) return
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max))
    setDraft(null)
  }

  const display = draft ?? String(Math.round(value * 100) / 100)

  return (
    <div className={disabled ? 'field slider-field is-disabled' : 'field slider-field'}>
      <div className="field-row">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <span className="slider-value">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} – wartość`}
            value={display}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft()
              if (e.key === 'Escape') setDraft(null)
            }}
          />
          {unit && <span className="slider-unit">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        title={defaultValue != null ? 'Dwuklik przywraca wartość domyślną' : undefined}
        onChange={(e) => onChange(snap(Number(e.target.value)))}
        onDoubleClick={() => defaultValue != null && onChange(defaultValue)}
      />
    </div>
  )
}
