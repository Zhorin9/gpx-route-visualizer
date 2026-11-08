import { useTranslation } from 'react-i18next'

export interface RangeSliderFieldProps {
  label: string
  min: number
  max: number
  start: number
  end: number
  onChange: (start: number, end: number) => void
  describe?: (value: number) => string
}

// Two native range inputs keep keyboard and screen-reader support for free.
export default function RangeSliderField({ label, min, max, start, end, onChange, describe }: RangeSliderFieldProps) {
  const { t } = useTranslation()
  const span = max - min || 1
  const minGap = Math.max(1, Math.round(span / 1000))
  const startPct = ((start - min) / span) * 100
  const endPct = ((end - min) / span) * 100

  return (
    <div className="field range-slider-field" role="group" aria-label={label}>
      <span className="field-label">{label}</span>
      <div className="range-slider">
        <div className="range-slider-track" />
        <div className="range-slider-fill" style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />
        <input
          type="range"
          aria-label={t('rangeSliderField.start')}
          aria-valuetext={describe?.(start)}
          min={min}
          max={max}
          value={start}
          onChange={(e) => onChange(Math.min(Number(e.target.value), end - minGap), end)}
        />
        <input
          type="range"
          aria-label={t('rangeSliderField.end')}
          aria-valuetext={describe?.(end)}
          min={min}
          max={max}
          value={end}
          onChange={(e) => onChange(start, Math.max(Number(e.target.value), start + minGap))}
        />
      </div>
      {describe && (
        <div className="range-slider-labels">
          <span>{describe(start)}</span>
          <span>{describe(end)}</span>
        </div>
      )}
    </div>
  )
}
