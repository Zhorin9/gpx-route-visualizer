// Caches the last result by argument identity — enough for derived data
// shared by several components (projection, stats) without recomputing per render.
export function memoOne<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | null = null
  let lastResult: R
  return (...args: A) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => Object.is(a, lastArgs![i]))) {
      return lastResult
    }
    lastArgs = args
    lastResult = fn(...args)
    return lastResult
  }
}
