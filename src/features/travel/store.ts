import i18n from '../../i18n'
import { IDENTITY_TRANSFORM, makeTitle, makeWaypoint, nextId } from '../../store/defaults'
import { joinTrack, type JoinedTrack } from '../../store/derived'
import { newSourceKey, settleParts } from '../../store/slices/routeSourceSlice'
import { defaultTitlePlace } from '../../core/formats/registry'
import { posAtDistance } from '../../utils/geometry'
import { cumulativeDistanceKm } from '../../utils/gpx'
import type { SliceContext } from '../../store/types'
import type { GpxPoint, Stop, TrackPart, TravelModeId, TravelPlan, Waypoint } from '../../types'
import { journeyOf, legName, legPlans, named, sameLeg, type Journey } from './model/journey'
import { buildLeg, lineOf, onGround, travelMode } from './model/modes'
import { scheduleSeconds, tripSchedule } from '../animation/model/schedule'
import { withRouteClip } from '../animation/store'
import { clamp } from '../../utils/math'

export type TravelSelection = { kind: 'leg'; index: number } | { kind: 'stop'; id: number }

export interface TravelSlice {
  // First stop of a trip with no second one yet: not a route, so kept outside the document.
  draftStop: Stop | null
  travelBusy: boolean
  travelError: string
  travelSelection: TravelSelection | null
  // How the leg to the next added stop is travelled while the trip has one stop.
  nextMode: TravelModeId
  // The leg the next stop goes into, from the search or a click on the map; null adds it at the end.
  travelInsert: number | null
  // The stop the next click on the map moves.
  travelPick: number | null
  // The first leg the route service couldn't route.
  travelFailedLeg: number | null
  // The trip as changed, shown while its new legs are being routed.
  travelPending: Journey | null
  selectTravel: (selection: TravelSelection | null) => void
  setTravelInsert: (index: number | null) => void
  setTravelPick: (id: number | null) => void
  setNextMode: (mode: TravelModeId) => void
  // `atStart` places the trip before the GPX files (a flight to the start).
  setJourney: (journey: Journey, label: string, options?: { atStart?: boolean }) => Promise<void>
}

// Estimated times start on the morning of the day the leg was planned.
function morning(): number {
  const d = new Date()
  d.setHours(8, 0, 0, 0)
  return d.getTime()
}

function kmAt(cum: Float64Array, pos: number): number {
  const i = clamp(Math.floor(pos), 0, cum.length - 1)
  const next = Math.min(cum.length - 1, i + 1)
  return cum[i] + (cum[next] - cum[i]) * (pos - i)
}

// A stop's label follows its stop; any other place keeps its share of the distance along a rebuilt part.
function moveWaypoints(waypoints: Waypoint[], before: JoinedTrack | null, after: JoinedTrack, cache: Record<string, GpxPoint[]>, stopPos: Map<number, number>) {
  return waypoints.flatMap((w): Waypoint[] => {
    if (w.stopId != null) {
      const pos = stopPos.get(w.stopId)
      return pos == null ? [] : [{ ...w, trackPos: pos }]
    }
    const old = before?.parts.find((p) => w.trackPos >= p.startIdx && w.trackPos <= p.endIdx)
    const now = old && after.parts.find((p) => p.id === old.id)
    if (!old || !now) return []
    if (old.sourceKey === now.sourceKey) return [{ ...w, trackPos: w.trackPos - old.startIdx + now.startIdx }]
    const from = cumulativeDistanceKm(cache[old.sourceKey])
    const to = cumulativeDistanceKm(cache[now.sourceKey])
    const share = kmAt(from, w.trackPos - old.startIdx) / (from[from.length - 1] || 1)
    return [{ ...w, trackPos: now.startIdx + posAtDistance(to, 0, to.length - 1, share * to[to.length - 1]) }]
  })
}

function stopPositions(parts: JoinedTrack['parts']): Map<number, number> {
  const at = new Map<number, number>()
  for (const p of parts) {
    if (!p.plan) continue
    const { stops } = p.plan
    if (!at.has(stops[0].id)) at.set(stops[0].id, p.startIdx)
    if (!at.has(stops[stops.length - 1].id)) at.set(stops[stops.length - 1].id, p.endIdx)
  }
  return at
}

let running: AbortController | null = null
// Every stop edit is its own undo step; only dragging a stop on the map collapses into one.
let edits = 0

export function createTravelSlice({ set, get, commit }: SliceContext): TravelSlice {
  return {
    draftStop: null,
    travelBusy: false,
    travelError: '',
    travelSelection: null,
    nextMode: 'car',
    travelInsert: null,
    travelPick: null,
    travelFailedLeg: null,
    travelPending: null,
    selectTravel: (travelSelection) => set({ travelSelection }),
    setTravelInsert: (travelInsert) => set({ travelInsert, travelPick: null }),
    setTravelPick: (travelPick) => set({ travelPick, travelInsert: null }),
    setNextMode: (nextMode) => set({ nextMode }),

    setJourney: async (journey, label, options) => {
      // A newer change replaces one still waiting for the route service.
      running?.abort()
      const controller = (running = new AbortController())
      const oldPlans = (get().routeSource?.parts ?? []).filter((p) => p.plan)
      const start = morning()
      const errors: { leg: number; text: string }[] = []
      set({ travelBusy: true, travelError: '', travelFailedLeg: null, travelPending: journey })

      const built = await Promise.all(
        legPlans(journey).map(async (plan, leg): Promise<{ plan: TravelPlan; reuse?: TrackPart; points?: GpxPoint[] }> => {
          const reuse = oldPlans.find((p) => sameLeg(p.plan as TravelPlan, plan))
          if (reuse) return { plan, reuse }
          const ctx = { profile: plan.profile, options: plan.options, signal: controller.signal }
          try {
            return { plan, points: await buildLeg(plan, ctx, start) }
          } catch (err) {
            if (controller.signal.aborted) throw err
            // The leg stays on the route as a straight line; the person picks another way for it.
            errors.push({ leg, text: i18n.t('travel.errors.legFailed', { leg: legName(plan), reason: err instanceof Error ? err.message : i18n.t('travel.errors.routeFailed') }) })
            const straight: TravelPlan = { ...plan, line: 'straight' }
            return { plan: straight, points: await buildLeg(straight, ctx, start) }
          }
        }),
      ).catch(() => null)
      if (!built || controller.signal.aborted) return
      running = null

      const s = get()
      const before = s.routeSource?.parts ?? []
      const cache = { ...s.trackCache }
      // Kept parts first, so a rebuilt leg can take over the id of the one it replaces.
      const taken = new Set(built.flatMap((b) => (b.reuse ? [b.reuse.id] : [])))
      let fresh = nextId(before)
      const legs = built.map(({ plan, reuse, points }): TrackPart => {
        if (reuse) return { ...reuse, name: legName(plan), plan }
        const ends = (p: TravelPlan) => `${p.stops[0].id}-${p.stops[p.stops.length - 1].id}`
        const replaced = oldPlans.find((p) => !taken.has(p.id) && ends(p.plan as TravelPlan) === ends(plan))
        const id = replaced?.id ?? fresh++
        taken.add(id)
        const sourceKey = newSourceKey()
        cache[sourceKey] = points as GpxPoint[]
        const mode = travelMode(plan.mode)
        const sameMode = replaced?.plan?.mode === plan.mode && lineOf(replaced.plan) === lineOf(plan)
        return {
          id,
          name: legName(plan),
          color: replaced?.color ?? '',
          dashed: sameMode ? (replaced as TrackPart).dashed : mode.line.dashed || lineOf(plan) !== 'road',
          visible: replaced?.visible ?? true,
          sourceKey,
          plan,
          estimatedTime: true,
          ...(onGround(plan) ? null : { groundElevation: false as const }),
          // The mode's own marker (a plane for a flight), unless one was picked for this leg.
          vehicle: sameMode && replaced?.vehicle ? replaced.vehicle : mode.vehicle,
        }
      })

      const stops = named(journey.stops)
      errors.sort((a, b) => a.leg - b.leg)
      set({ trackCache: cache, travelBusy: false, travelPending: null, travelError: errors.map((e) => e.text).join(' '), travelFailedLeg: errors[0]?.leg ?? null, draftStop: legs.length ? null : (stops[0] ?? null) })
      if (!legs.length && !oldPlans.length) return

      const gpx = before.filter((p) => !p.plan)
      const firstPlan = before.findIndex((p) => p.plan)
      const atStart = options?.atStart ?? (firstPlan === 0 && gpx.length > 0)
      const settled = settleParts(before, atStart ? [...legs, ...gpx] : [...gpx, ...legs], s.routeStyle)
      const tripName = stops.length > 1 ? `${stops[0].name} → ${stops[stops.length - 1].name}` : null
      const name = gpx.length ? (s.routeSource?.name ?? null) : tripName
      const routeSource = settled.parts.length ? { name, parts: settled.parts } : null
      const after = joinTrack(routeSource, cache)

      // Stops new to the route (the draft too) get a label with their name; one whose label was deleted stays without.
      const oldNames = new Map(journeyOf(before, null).stops.map((st) => [st.id, st.name]))
      const newNames = new Map(stops.map((st) => [st.id, st.name]))
      const stopPos = stopPositions(after?.parts ?? [])
      const moved = after ? moveWaypoints(s.waypoints, joinTrack(s.routeSource, s.trackCache), after, cache, stopPos) : []
      // A renamed stop renames its label too, unless the label was written by hand.
      const waypoints = moved.map((w) => {
        const name = w.stopId != null ? newNames.get(w.stopId) : undefined
        return name != null && w.text === oldNames.get(w.stopId as number) ? { ...w, text: name } : w
      })
      const known = new Set(oldNames.keys())
      for (const stop of stops) {
        const pos = stopPos.get(stop.id)
        if (known.has(stop.id) || pos == null) continue
        waypoints.push({ ...makeWaypoint(nextId(waypoints), pos), text: stop.name, stopId: stop.id })
      }

      const title = s.texts.find((t) => t.role === 'title')
      const texts = !before.length && name
        ? [...s.texts.filter((t) => t.role !== 'title'), makeTitle(nextId(s.texts), name, s.titleStyle, defaultTitlePlace(s.aspectKey))]
        : title && name && title.text === s.routeSource?.name
          ? s.texts.map((t) => (t === title ? { ...t, text: name } : t))
          : s.texts

      // The line takes as long to draw as the trip's legs and rests add up to.
      const schedule = after ? tripSchedule(after.parts) : null
      commit(label.startsWith('drag') ? `travel:${label}` : `travel:${label}:${++edits}`, {
        ...(schedule ? { animation: withRouteClip(s.animation, { duration: scheduleSeconds(schedule) }) } : null),
        routeSource,
        routeStyle: settled.routeStyle,
        range: { start: 0, end: Math.max(0, (after?.track.points.length ?? 1) - 1) },
        progress: 100,
        waypoints,
        texts,
        ...(before.length ? null : { routeTransform: IDENTITY_TRANSFORM }),
      })
    },
  }
}
