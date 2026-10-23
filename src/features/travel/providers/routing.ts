import type { GpxPoint, RouteOption, Stop } from '../../../types'

// The kinds of route the travel modes ask for; each service names them its own way.
export type RouteProfile = 'car' | 'trekking' | 'road' | 'mtb' | 'hiking' | 'rail'

export interface RouteRequest {
  stops: Stop[]
  profile: RouteProfile
  // What the route keeps away from (tolls, motorways, ...), when the service can do it.
  options: readonly RouteOption[]
}

// A route service: turns stops into a line along roads, paths or rails.
export interface RoutingProvider {
  id: string
  label: string
  // Terms of use, so a change of the app's licence means reviewing this list, not the code.
  terms: string
  // The service's own profile for each generic one; a missing entry means "not supported".
  profiles: Partial<Record<RouteProfile, string>>
  // Points with elevation, and times when the service estimates them.
  route: (request: RouteRequest, signal: AbortSignal) => Promise<GpxPoint[]>
}

// An error a person can act on, e.g. "no road between these places". `noTrack`: the service found no
// way from a stop at all, as when a town's point lies in a car-free old town.
export class RouteError extends Error {
  constructor(
    message: string,
    readonly noTrack = false,
  ) {
    super(message)
  }
}

const providers: RoutingProvider[] = []

export function registerRoutingProvider(provider: RoutingProvider): void {
  const i = providers.findIndex((p) => p.id === provider.id)
  if (i >= 0) providers.splice(i, 1)
  providers.push(provider)
}

// The first registered service is the default.
export function routingProvider(id?: string): RoutingProvider {
  const found = providers.find((p) => p.id === id) ?? providers[0]
  if (!found) throw new RouteError('Brak serwisu tras.')
  return found
}

// Public instances ask for no more than about one request a second. A request cancelled while
// waiting (a newer change replaced it) is dropped without a call and without a wait after it.
export function rateLimited(fn: (request: RouteRequest, signal: AbortSignal) => Promise<GpxPoint[]>, gapMs: number) {
  let queue: Promise<unknown> = Promise.resolve()
  return (request: RouteRequest, signal: AbortSignal): Promise<GpxPoint[]> => {
    const run = queue.then(() => {
      if (signal.aborted) throw new DOMException('Przerwano', 'AbortError')
      return fn(request, signal)
    })
    queue = run.then(
      () => new Promise((resolve) => setTimeout(resolve, gapMs)),
      () => (signal.aborted ? undefined : new Promise((resolve) => setTimeout(resolve, gapMs))),
    )
    return run
  }
}

// Answers kept for the session, so undo, redo and dragging a stop back don't ask the network again.
export function cached(fn: (request: RouteRequest, signal: AbortSignal) => Promise<GpxPoint[]>) {
  const answers = new Map<string, Promise<GpxPoint[]>>()
  return (request: RouteRequest, signal: AbortSignal): Promise<GpxPoint[]> => {
    const where = request.stops.map((s) => `${s.lat.toFixed(5)},${s.lon.toFixed(5)}`).join('|')
    const key = `${request.profile}|${[...request.options].sort().join()}|${where}`
    const hit = answers.get(key)
    if (hit) return hit
    const answer = fn(request, signal)
    answers.set(key, answer)
    // A failed or cancelled request may succeed next time.
    answer.catch(() => answers.delete(key))
    return answer
  }
}
