import type { GpxPoint, RoutePart, Waypoint, Wrapper } from '../../types'

const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatDateSpan(start: Date, end: Date): string {
  const d = (x: Date) => pad2(x.getDate())
  const dm = (x: Date) => `${d(x)}.${pad2(x.getMonth() + 1)}`
  const full = (x: Date) => `${dm(x)}.${x.getFullYear()}`
  if (start.getFullYear() !== end.getFullYear()) return `${full(start)}–${full(end)}`
  if (start.getMonth() !== end.getMonth()) return `${dm(start)}–${full(end)}`
  if (start.getDate() !== end.getDate()) return `${d(start)}–${full(end)}`
  return full(start)
}

const UNNAMED_PLACE = 'Miejscowość'

// Places: the planner's stops, else the labels along the route.
export function routeFields(name: string | null, points: GpxPoint[] | null, parts: RoutePart[], waypoints: Waypoint[]): Wrapper['fields'] {
  const stops = parts.flatMap((p) => p.plan?.stops.filter((s) => !s.via && s.name) ?? [])
  const labels = [...waypoints].sort((a, b) => a.trackPos - b.trackPos).filter((wp) => wp.text.trim() && wp.text !== UNNAMED_PLACE)
  const names = stops.length ? stops.map((s) => s.name) : labels.map((wp) => wp.text.trim())
  const from = names[0] ?? ''
  const to = names.length > 1 ? names[names.length - 1] : ''
  const times = (points ?? []).flatMap((p) => (p.time == null ? [] : [p.time]))
  return {
    title: name ?? '',
    place: to || from,
    from,
    to,
    date: times.length ? formatDateSpan(new Date(times[0]), new Date(times[times.length - 1])) : '',
    note: '',
  }
}
