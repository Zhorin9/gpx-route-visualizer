import { DOCUMENT_KEYS } from '../../store/document'
import { useAppStore } from '../../store/useAppStore'
import { usePlayback } from './playback'

// A paused preview would keep showing a moment where the header or stats may not be shown yet.
// Animation edits keep it, so the timeline can be tuned while watching.
export function stopPreviewOnEdit(): () => void {
  return useAppStore.subscribe((state, prev) => {
    if (!usePlayback.getState().previewing || state.exporting || prev.exporting) return
    if (!state.animation.enabled) return usePlayback.getState().stop()
    if (DOCUMENT_KEYS.some((key) => key !== 'animation' && state[key] !== prev[key])) usePlayback.getState().stop()
  })
}
