// Which moment of the animation has actually reached the Konva nodes (see CommitProbe).
export interface Committed {
  t: number
  previewing: boolean
}

let committed: Committed = { t: 0, previewing: false }
const waiters = new Set<{ test: (c: Committed) => boolean; resolve: () => void }>()

export function reportCommit(state: Committed) {
  committed = state
  for (const w of waiters) {
    if (w.test(committed)) {
      waiters.delete(w)
      w.resolve()
    }
  }
}

// Resolves once the frame shows a state that passes `test`; gives up after `timeoutMs`
// (no route on the frame means nothing animated to wait for).
export function waitForCommit(test: (c: Committed) => boolean, timeoutMs = 1000): Promise<void> {
  if (test(committed)) return Promise.resolve()
  return new Promise((resolve) => {
    const waiter = { test, resolve }
    waiters.add(waiter)
    setTimeout(() => {
      if (waiters.delete(waiter)) resolve()
    }, timeoutMs)
  })
}
