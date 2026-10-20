import { registerPanelSection } from '../../core/panel/registry'
import VideoExportPanel from './panel/VideoExportPanel'

export function registerVideoExport() {
  registerPanelSection({ id: 'video', label: 'Wideo', tab: 'export', order: 20, Component: VideoExportPanel })
}
