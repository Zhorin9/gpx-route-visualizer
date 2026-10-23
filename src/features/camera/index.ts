import { registerPanelSection } from '../../core/panel/registry'
import { provideWorldView } from '../../core/route/providers'
import CameraPanel from './panel/CameraPanel'
import { useCameraView } from './useCameraView'

export function registerCamera() {
  provideWorldView(useCameraView)
  registerPanelSection({ id: 'camera', label: 'Kamera', tab: 'export', order: 15, Component: CameraPanel })
}
