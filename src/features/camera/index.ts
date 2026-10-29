import { registerPanelSection } from '../../core/panel/registry'
import { provideWorldView } from '../../core/route/providers'
import CameraPanel from './panel/CameraPanel'
import { useCameraView } from './useCameraView'

export function registerCamera() {
  provideWorldView(useCameraView)
  registerPanelSection({ id: 'camera', label: 'Kamera', tab: 'animation', modes: ['map'], order: 15, Component: CameraPanel })
}
