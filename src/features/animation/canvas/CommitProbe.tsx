import { useLayoutEffect } from 'react'
import { usePlayback } from '../playback'
import { reportCommit } from './commitState'

// The frame lives in react-konva's own renderer, which react-dom's flushSync can't force.
// This probe sits inside that tree and reports which moment has actually been committed to
// the Konva nodes, so a video frame is captured only once it shows the right time.
export default function CommitProbe() {
  const t = usePlayback((s) => s.t)
  const previewing = usePlayback((s) => s.previewing)
  useLayoutEffect(() => reportCommit({ t, previewing }), [t, previewing])
  return null
}
