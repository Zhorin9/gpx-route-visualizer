import { formatNumber } from '../utils/format'

// Everything is stored and computed in metric; units only change what is shown.
export type Units = 'metric' | 'imperial'

const KM_PER_MI = 1.609344
const FT_PER_M = 3.28084

export const distanceIn = (km: number, units: Units) => (units === 'imperial' ? km / KM_PER_MI : km)
export const distanceToKm = (value: number, units: Units) => (units === 'imperial' ? value * KM_PER_MI : value)
export const heightIn = (m: number, units: Units) => (units === 'imperial' ? m * FT_PER_M : m)

export const distanceUnit = (units: Units) => (units === 'imperial' ? 'mi' : 'km')
export const heightUnit = (units: Units) => (units === 'imperial' ? 'ft' : 'm')
export const speedUnit = (units: Units) => (units === 'imperial' ? 'mph' : 'km/h')

export function formatDistance(km: number, units: Units, precision: number): string {
  return `${formatNumber(distanceIn(km, units), precision)} ${distanceUnit(units)}`
}

// Rounded to `roundTo` in the shown unit, so 5 m steps stay 5 ft steps in feet.
export function formatHeight(m: number, units: Units, roundTo = 1): string {
  const value = Math.round(heightIn(m, units) / roundTo) * roundTo
  return `${formatNumber(value)} ${heightUnit(units)}`
}

export function formatGain(m: number, units: Units, roundTo = 1): string {
  return `+${formatHeight(m, units, roundTo)}`
}

export function formatSpeed(kmh: number, units: Units): string {
  return `${formatNumber(distanceIn(kmh, units), 1)} ${speedUnit(units)}`
}
