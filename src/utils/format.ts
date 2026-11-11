import { currentLocale } from '../i18n'

const numberFormats = new Map<string, Intl.NumberFormat>()

export function formatNumber(value: number, fractionDigits = 0): string {
  const locale = currentLocale()
  const key = `${locale}|${fractionDigits}`
  let fmt = numberFormats.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
    numberFormats.set(key, fmt)
  }
  return fmt.format(value)
}

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '--'
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatClock(ms: number): string {
  return new Intl.DateTimeFormat(currentLocale(), { hour: '2-digit', minute: '2-digit' }).format(ms)
}

export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
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
