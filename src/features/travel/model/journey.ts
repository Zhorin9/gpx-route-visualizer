import type { Stop, TrackPart, TravelModeId, TravelPlan } from '../../../types'

export type Leg = Omit<TravelPlan, 'stops'>

export interface Journey {
  stops: Stop[]
  legs: Leg[]
}

export const named = (stops: Stop[]) => stops.filter((s) => !s.via)

// A leg removed from the route in between is bridged with the mode of the one before it.
export function journeyOf(parts: TrackPart[], draft: Stop | null): Journey {
  const stops: Stop[] = []
  const legs: Leg[] = []
  for (const { plan } of parts) {
    if (!plan) continue
    const joined = stops.length > 0 && stops[stops.length - 1].id === plan.stops[0].id
    if (stops.length && !joined) legs.push(legs[legs.length - 1])
    stops.push(...(joined ? plan.stops.slice(1) : plan.stops))
    const { stops: _stops, ...leg } = plan
    legs.push(leg)
  }
  return stops.length ? { stops, legs } : { stops: draft ? [draft] : [], legs: [] }
}

export function legPlans({ stops, legs }: Journey): TravelPlan[] {
  const plans: TravelPlan[] = []
  let current: Stop[] = []
  for (const stop of stops) {
    current.push(stop)
    if (stop.via || current.length === 1) continue
    plans.push({ ...legs[plans.length], stops: current })
    current = [stop]
  }
  return plans
}

// Ignores the animation time.
export function sameLeg(a: TravelPlan, b: TravelPlan): boolean {
  return (
    a.mode === b.mode &&
    (a.line ?? '') === (b.line ?? '') &&
    (a.profile ?? '') === (b.profile ?? '') &&
    [...(a.options ?? [])].sort().join() === [...(b.options ?? [])].sort().join() &&
    a.stops.length === b.stops.length &&
    a.stops.every((s, i) => s.id === b.stops[i].id && s.lat === b.stops[i].lat && s.lon === b.stops[i].lon)
  )
}

// Via points only shape a leg, so they can't open or close the trip.
function trimVias(stops: Stop[]): Stop[] {
  const first = stops.findIndex((s) => !s.via)
  const last = stops.length - 1 - [...stops].reverse().findIndex((s) => !s.via)
  return first < 0 ? [] : stops.slice(first, last + 1)
}

export function addStop(j: Journey, stop: Stop, mode: TravelModeId): Journey {
  const count = named(j.stops).length
  if (count === 0) return { stops: [stop], legs: [] }
  const previous = j.legs[j.legs.length - 1]
  return { stops: [...j.stops, stop], legs: [...j.legs, previous ? { mode: previous.mode, line: previous.line } : { mode }] }
}

// The new start reaches the old one the way the first leg goes.
export function addStart(j: Journey, stop: Stop, mode: TravelModeId): Journey {
  if (named(j.stops).length === 0) return { stops: [stop], legs: [] }
  const first = j.legs[0]
  return { stops: [stop, ...j.stops], legs: [first ? { mode: first.mode, line: first.line } : { mode }, ...j.legs] }
}

// The stop splits leg `index` in two, both travelled the same way; the leg's via points go with the old shape.
export function insertStop(j: Journey, stop: Stop, index: number): Journey {
  const plan = legPlans(j)[index]
  if (!plan) return j
  const { duration: _duration, ...leg } = j.legs[index]
  const stops = j.stops.filter((s) => !s.via || !plan.stops.includes(s))
  const at = stops.indexOf(plan.stops[0]) + 1
  return { stops: [...stops.slice(0, at), stop, ...stops.slice(at)], legs: [...j.legs.slice(0, index + 1), leg, ...j.legs.slice(index + 1)] }
}

// The stop stays on the line as a via point of the leg the two around it become.
export function makeVia(j: Journey, id: number): Journey {
  const stops = named(j.stops)
  const k = stops.findIndex((s) => s.id === id)
  if (k <= 0 || k === stops.length - 1) return j
  return { stops: j.stops.map((s) => (s.id === id ? { ...s, via: true } : s)), legs: j.legs.filter((_, i) => i !== k) }
}

// The via point splits its leg, as a stop put in between does, but the leg's other via points stay.
export function makeStop(j: Journey, id: number, name: string): Journey {
  const index = legPlans(j).findIndex((p) => p.stops.some((s) => s.id === id && s.via))
  if (index < 0) return j
  const { duration: _duration, ...leg } = j.legs[index]
  return { stops: j.stops.map((s) => (s.id === id ? { ...s, name, via: false } : s)), legs: [...j.legs.slice(0, index + 1), leg, ...j.legs.slice(index + 1)] }
}

export function repeatAtEnd(j: Journey, id: number, mode: TravelModeId): Journey {
  const stop = j.stops.find((s) => s.id === id)
  if (!stop) return j
  const { pause: _pause, ...place } = stop
  return addStop(j, { ...place, id: Math.max(...j.stops.map((s) => s.id)) + 1 }, mode)
}

export function reverseJourney(j: Journey): Journey {
  return { stops: [...j.stops].reverse(), legs: [...j.legs].reverse() }
}

export function removeStop(j: Journey, id: number): Journey {
  const stop = j.stops.find((s) => s.id === id)
  if (!stop) return j
  const stops = trimVias(j.stops.filter((s) => s.id !== id))
  if (stop.via) return { ...j, stops }
  const k = named(j.stops).indexOf(stop)
  const drop = k === 0 ? 0 : Math.min(k, j.legs.length - 1)
  return { stops, legs: j.legs.filter((_, i) => i !== drop) }
}

// Via points are dropped: they shaped legs that no longer exist.
export function moveStop(j: Journey, id: number, toIndex: number): Journey {
  const stops = named(j.stops)
  const from = stops.findIndex((s) => s.id === id)
  if (from < 0 || toIndex < 0 || toIndex >= stops.length || from === toIndex) return j
  const [stop] = stops.splice(from, 1)
  stops.splice(toIndex, 0, stop)
  return { stops, legs: j.legs }
}

export function setLeg(j: Journey, index: number, leg: Leg): Journey {
  return { ...j, legs: j.legs.map((l, i) => (i === index ? leg : l)) }
}

// `after`: the stop of the leg the via point follows.
export function insertVia(j: Journey, index: number, after: number, via: Stop): Journey {
  const plan = legPlans(j)[index]
  if (!plan) return j
  const at = j.stops.indexOf(plan.stops[Math.min(after, plan.stops.length - 2)]) + 1
  return { ...j, stops: [...j.stops.slice(0, at), { ...via, via: true }, ...j.stops.slice(at)] }
}

export function updateStop(j: Journey, id: number, patch: Partial<Omit<Stop, 'id' | 'via'>>): Journey {
  return { ...j, stops: j.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
}

export function moveStopTo(j: Journey, id: number, at: { lat: number; lon: number }, name?: string): Journey {
  return { ...j, stops: j.stops.map((s) => (s.id === id ? { ...s, ...at, ...(name ? { name } : null) } : s)) }
}

export const legName = (plan: TravelPlan) => `${plan.stops[0].name} → ${plan.stops[plan.stops.length - 1].name}`
