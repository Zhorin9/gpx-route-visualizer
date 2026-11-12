import { beginStageFrames } from '../core/export/frameSource'
import { useAppStore } from '../store/useAppStore'
import { archiveBaseName, downloadFiles, ribbonToFiles, type ExportFile } from './exportImage'
import { exportedSlides } from './series'
import type { AspectKey, ExportFormat } from '../types'

export async function renderProject(formats: AspectKey[], scale: 1 | 2, format: ExportFormat, trackName: string | null): Promise<ExportFile[]> {
  const frames = await beginStageFrames()
  try {
    const files: ExportFile[] = []
    for (const key of formats) {
      await frames.useFormat(key)
      files.push(...(await ribbonToFiles(await frames.render(scale), format, scale, key, trackName, exportedSlides(useAppStore.getState().slides))))
    }
    return files
  } finally {
    frames.end()
  }
}

export async function exportProject(formats: AspectKey[], scale: 1 | 2, format: ExportFormat, trackName: string | null): Promise<void> {
  await downloadFiles(await renderProject(formats, scale, format, trackName), archiveBaseName(trackName))
}
