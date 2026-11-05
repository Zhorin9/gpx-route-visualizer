import { useLayoutEffect } from 'react'
import { usePlayback } from '../playback'
import { reportCommit } from './commitState'

// react-dom's flushSync can't force react-konva's renderer, so this probe reports which moment reached
// the Konva nodes; a video frame is captured only once it shows the right time.
export default function CommitProbe() {
  const t = usePlayback((s) => s.t)
  const previewing = usePlayback((s) => s.previewing)
  useLayoutEffect(() => reportCommit({ t, previewing }), [t, previewing])
  return null
}
