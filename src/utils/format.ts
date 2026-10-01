const LOCALE = 'pl-PL'

const numberFormats = new Map<number, Intl.NumberFormat>()

export function formatNumber(value: number, fractionDigits = 0): string {
  let fmt = numberFormats.get(fractionDigits)
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
    numberFormats.set(fractionDigits, fmt)
  }
  return fmt.format(value)
}

export function formatKm(km: number, precision: number): string {
  return `${formatNumber(km, precision)} km`
}

export function formatElevation(meters: number, roundTo: number): string {
  return `+${formatNumber(Math.round(meters / roundTo) * roundTo)} m`
}

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '--'
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })

export function formatClock(ms: number): string {
  return timeFormat.format(ms)
}

export function formatDay(date: Date): string {
  return dayFormat.format(date)
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
