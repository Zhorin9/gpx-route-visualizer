import { useAppStore } from '../store/useAppStore'
import { pickDocument } from '../store/history'
import { archiveBaseName, downloadFiles, renderStageFiles, type ExportFile } from './exportImage'
import { reflowTo } from './reflow'
import type { AspectKey, ExportFormat } from '../types'

// rAF never fires in a hidden tab, so the timeout keeps the export from hanging.
const nextPaint = () =>
  Promise.race([
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60)))),
    new Promise<void>((resolve) => setTimeout(resolve, 400)),
  ])

// Renders each chosen format with its own layout, then restores the document exactly as it was.
export async function exportProject(formats: AspectKey[], scale: 1 | 2, format: ExportFormat, trackName: string | null): Promise<void> {
  const store = useAppStore
  const before = store.getState()
  const snapshot = pickDocument(before)
  const { selection, routeEditable } = before
  const slideCount = snapshot.slides.length

  store.getState().setExporting(true)
  store.setState({ selection: null, routeEditable: false })
  try {
    const files: ExportFile[] = []
    for (const key of formats) {
      store.setState(reflowTo(store.getState(), key))
      await nextPaint()
      const got = await renderStageFiles(format, scale, key, trackName, slideCount)
      files.push(...got)
    }
    await downloadFiles(files, archiveBaseName(trackName))
  } finally {
    store.setState({ ...snapshot, selection, routeEditable })
    store.getState().setExporting(false)
  }
}
