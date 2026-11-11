import { useTranslation } from 'react-i18next'
import { vehicleFor } from '../../animation/vehicles'
import { TRAVEL_MODES, travelMode } from '../model/modes'
import { seconds } from './format'
import type { TravelModeId } from '../../../types'

export function ModeIcon({ mode }: { mode: TravelModeId }) {
  const vehicle = vehicleFor(travelMode(mode).vehicle)
  return (
    <svg viewBox="-12 -12 24 24" width="18" height="18" aria-hidden="true" className="mode-icon">
      <path d={vehicle.path} fill={vehicle.outline ? 'none' : 'currentColor'} stroke={vehicle.outline ? 'currentColor' : 'none'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ModeTiles({ label, value, onChange }: { label: string; value: TravelModeId; onChange: (id: TravelModeId) => void }) {
  const { t } = useTranslation()
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="mode-grid" role="radiogroup" aria-label={label}>
        {TRAVEL_MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === value} className={m.id === value ? 'mode-opt active' : 'mode-opt'} onClick={() => onChange(m.id)}>
            <ModeIcon mode={m.id} />
            {t(m.label)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SecondsField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { t } = useTranslation()
  return (
    <div className="seconds-field">
      <span>{label}</span>
      <span className="seconds-stepper">
        <button type="button" aria-label={t('travel.panel.shorter', { label })} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 0.5))}>
          −
        </button>
        <span className="seconds-value">{seconds(value)}</span>
        <button type="button" aria-label={t('travel.panel.longer', { label })} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 0.5))}>
          +
        </button>
      </span>
    </div>
  )
}
