import { useLayoutEffect } from 'react'
import { usePlayback } from '../playback'

// The frame lives in react-konva's own renderer, which react-dom's flushSync can't force.
// This probe sits inside that tree and reports which moment has actually been committed to
// the Konva nodes, so a video frame is captured only once it shows the right time.

interface Committed {
  t: number
  previewing: boolean
}

let committed: Committed = { t: 0, previewing: false }
const waiters = new Set<{ test: (c: Committed) => boolean; resolve: () => void }>()

export default function CommitProbe() {
  const t = usePlayback((s) => s.t)
  const previewing = usePlayback((s) => s.previewing)
  useLayoutEffect(() => {
    committed = { t, previewing }
    for (const w of waiters) {
      if (w.test(committed)) {
        waiters.delete(w)
        w.resolve()
      }
    }
  }, [t, previewing])
  return null
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
