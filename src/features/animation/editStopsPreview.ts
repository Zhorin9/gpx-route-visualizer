import { pickDocument } from '../../store/document'
import { useAppStore } from '../../store/useAppStore'
import type { DocumentState } from '../../store/types'
import { usePlayback } from './playback'

// A paused preview would keep showing a moment where the header or stats may not be shown yet.
// Animation edits keep it, so the timeline can be tuned while watching.
export function stopPreviewOnEdit(): () => void {
  return useAppStore.subscribe((state, prev) => {
    if (!usePlayback.getState().previewing || state.exporting || prev.exporting) return
    if (!state.animation.enabled) return usePlayback.getState().stop()
    const now = pickDocument(state)
    const before = pickDocument(prev)
    const edited = (Object.keys(now) as (keyof DocumentState)[]).some((key) => key !== 'animation' && now[key] !== before[key])
    if (edited) usePlayback.getState().stop()
  })
}
