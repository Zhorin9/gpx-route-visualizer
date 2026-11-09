import i18n from '../../../i18n'
import { useAppStore } from '../../../store/useAppStore'
import { formatNumber } from '../../../utils/format'

// "2 h 10 min", or "45 min" under an hour.
export function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  const h = Math.floor(minutes / 60)
  return h ? `${h} h ${minutes % 60} min` : `${minutes} min`
}

export const seconds = (value: number) => `${formatNumber(value, value % 1 ? 1 : 0)} s`

export function copyCoordinates(at: { lat: number; lon: number }) {
  void navigator.clipboard?.writeText(`${at.lat.toFixed(4)}, ${at.lon.toFixed(4)}`)
  useAppStore.getState().showToast(i18n.t('travel.panel.copied'))
}
