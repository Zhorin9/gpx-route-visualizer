import { useEffect } from 'react'
import Konva from 'konva'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/useAppStore'
import { ensureFontLoaded } from '../utils/fonts'
import { clearTextMeasureCache } from '../utils/measureText'

// Canvas text silently falls back to a default font instead of fetching an
// unloaded @font-face, so every family in use is loaded explicitly, then
// text is re-measured and the stages redrawn.
export default function useFontPreload(): void {
  const families = useAppStore(
    useShallow((s) => [
      ...new Set([s.statsStyle.fontFamily, ...s.texts.map((t) => t.fontFamily), ...s.waypoints.map((w) => w.fontFamily)]),
    ]),
  )

  useEffect(() => {
    let cancelled = false
    Promise.all(families.map(ensureFontLoaded)).then(() => {
      if (cancelled) return
      clearTextMeasureCache()
      useAppStore.getState().bumpFontsVersion()
      Konva.stages.forEach((stage) => stage.batchDraw())
    })
    return () => {
      cancelled = true
    }
  }, [families])
}
