import { pickDocument } from '../../store/history'
import { useAppStore } from '../../store/useAppStore'
import type { DocumentState } from '../../store/types'
import { usePlayback } from './playback'

// Editing the design (a template, a colour, a moved element) brings back the static view:
// a paused preview would otherwise keep showing the frame at that moment, where the header
// or the stats may not have appeared yet. Changes to the animation itself keep the preview,
// so the timeline can be tuned while watching it; switching the animation off ends it too.
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
