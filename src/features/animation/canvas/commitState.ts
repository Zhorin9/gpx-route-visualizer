import { useLayoutEffect } from 'react'
import { usePlayback } from '../playback'

export interface Committed {
  t: number
  previewing: boolean
}

let committed: Committed = { t: 0, previewing: false }
const waiters = new Set<{ test: (c: Committed) => boolean; resolve: () => void }>()

function reportCommit(state: Committed) {
  committed = state
  for (const w of waiters) {
    if (w.test(committed)) {
      waiters.delete(w)
      w.resolve()
    }
  }
}

// react-dom's flushSync can't force react-konva's renderer, so the stage reports which moment reached
// the Konva nodes; a video frame is captured only once it shows the right time.
export function useReportCommit() {
  const t = usePlayback((s) => s.t)
  const previewing = usePlayback((s) => s.previewing)
  useLayoutEffect(() => reportCommit({ t, previewing }), [t, previewing])
}

// Gives up after `timeoutMs`, so a stage that stopped rendering can't hang an export.
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
