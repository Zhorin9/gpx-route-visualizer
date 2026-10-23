import type { Stop, TrackPart, TravelModeId, TravelPlan } from '../../../types'

// How a leg is travelled and drawn: its plan without the stops.
export type Leg = Omit<TravelPlan, 'stops'>

// The trip as the panel shows it: every stop in order (via points among them) and how each
// leg between two named stops is travelled. The route keeps it as one part per leg.
export interface Journey {
  stops: Stop[]
  legs: Leg[]
}

export const named = (stops: Stop[]) => stops.filter((s) => !s.via)

// Joined from the planned parts in route order: a leg starts where the previous one ended.
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

// One plan per leg: from a named stop to the next, with the via points between.
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

// The same line: same places in the same order, travelled and shaped the same way (its animation time aside).
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

// A new stop at the end; its leg is travelled like the one before it.
export function addStop(j: Journey, stop: Stop, mode: TravelModeId): Journey {
  const count = named(j.stops).length
  if (count === 0) return { stops: [stop], legs: [] }
  const previous = j.legs[j.legs.length - 1]
  return { stops: [...j.stops, stop], legs: [...j.legs, previous ? { mode: previous.mode, line: previous.line } : { mode }] }
}

// Removing a stop in the middle joins its two legs into one, travelled like the first of them.
export function removeStop(j: Journey, id: number): Journey {
  const stop = j.stops.find((s) => s.id === id)
  if (!stop) return j
  const stops = trimVias(j.stops.filter((s) => s.id !== id))
  if (stop.via) return { ...j, stops }
  const k = named(j.stops).indexOf(stop)
  const drop = k === 0 ? 0 : Math.min(k, j.legs.length - 1)
  return { stops, legs: j.legs.filter((_, i) => i !== drop) }
}

// Moves a named stop to another place in the order. Legs keep their modes by position;
// via points are dropped, since they shaped legs that no longer exist.
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

// A via point dragged out of leg `index`, placed after the leg's `after`-th stop.
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
