import { beginStageFrames } from '../core/export/frameSource'
import { useAppStore } from '../store/useAppStore'
import { archiveBaseName, downloadFiles, ribbonToFiles, type ExportFile } from './exportImage'
import type { AspectKey, ExportFormat } from '../types'

// Renders each chosen format with its own layout, then restores the document exactly as it was.
export async function exportProject(formats: AspectKey[], scale: 1 | 2, format: ExportFormat, trackName: string | null): Promise<void> {
  const slideCount = useAppStore.getState().slides.length
  const frames = await beginStageFrames()
  try {
    const files: ExportFile[] = []
    for (const key of formats) {
      await frames.useFormat(key)
      files.push(...(await ribbonToFiles(frames.render(scale), format, scale, key, trackName, slideCount)))
    }
    await downloadFiles(files, archiveBaseName(trackName))
  } finally {
    frames.end()
  }
}
